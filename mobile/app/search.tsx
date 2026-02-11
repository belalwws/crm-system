import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, formatCurrency } from '@/lib/utils';
import { Badge, EmptyState } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';

type SearchResult = { id: string; type: string; title: string; subtitle?: string; };

export default function SearchScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const token = await getToken(); api.setToken(token);
      const res = await api.globalSearch(q);
      if (res.success && res.data) {
        const mapped: SearchResult[] = [];
        if (res.data.customers) res.data.customers.forEach((c: any) => mapped.push({ id: c.id, type: 'customer', title: c.name, subtitle: c.company || c.email }));
        if (res.data.deals) res.data.deals.forEach((d: any) => mapped.push({ id: d.id, type: 'deal', title: d.title, subtitle: formatCurrency(d.value) }));
        if (res.data.tasks) res.data.tasks.forEach((t: any) => mapped.push({ id: t.id, type: 'task', title: t.title, subtitle: t.status }));
        if (res.data.contacts) res.data.contacts.forEach((ct: any) => mapped.push({ id: ct.id, type: 'contact', title: ct.name || ct.email, subtitle: ct.company }));
        setResults(mapped);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [getToken]);

  const onSearch = (text: string) => {
    setQuery(text);
    const timer = setTimeout(() => doSearch(text), 400);
    return () => clearTimeout(timer);
  };

  const navigate = (item: SearchResult) => {
    switch (item.type) {
      case 'customer': router.push(`/customer/${item.id}`); break;
      case 'deal': router.push(`/deal/${item.id}`); break;
      case 'task': router.push(`/task/${item.id}`); break;
      default: break;
    }
  };

  const getIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'customer': return 'person';
      case 'deal': return 'trending-up';
      case 'task': return 'checkmark-circle';
      case 'contact': return 'people';
      default: return 'search';
    }
  };

  const typeColor: Record<string, string> = { customer: '#6366f1', deal: '#3b82f6', task: '#22c55e', contact: '#06b6d4' };

  return (
    <>
      <Stack.Screen options={{ title: 'Search' }} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: Spacing.lg }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
            borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.border,
            paddingHorizontal: Spacing.md, height: 48,
          }}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={onSearch}
              placeholder="Search customers, deals, tasks..."
              placeholderTextColor={colors.textSecondary}
              autoFocus
              style={{ flex: 1, marginLeft: Spacing.sm, fontSize: FontSize.md, color: colors.text }}
            />
            {query ? (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item, i) => `${item.type}-${item.id}-${i}`}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
          ListEmptyComponent={
            query.length > 0 && !loading ? (
              <EmptyState icon="search" title="No results" message={`No results for "${query}"`} />
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigate(item)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
                backgroundColor: colors.card, borderRadius: BorderRadius.lg,
                marginBottom: Spacing.sm, borderWidth: 1, borderColor: colors.border,
              }}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: (typeColor[item.type] || colors.primary) + '20',
                alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
              }}>
                <Ionicons name={getIcon(item.type)} size={18} color={typeColor[item.type] || colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FontSize.md, fontWeight: '500', color: colors.text }}>{item.title}</Text>
                {item.subtitle && <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{item.subtitle}</Text>}
              </View>
              <Badge label={item.type} color={typeColor[item.type] || '#6b7280'} />
            </TouchableOpacity>
          )}
        />
      </View>
    </>
  );
}
