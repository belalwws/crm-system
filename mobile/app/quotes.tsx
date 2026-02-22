import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import api from '@/lib/api';
import { useThemeColors, formatCurrency, formatDate } from '@/lib/utils';
import { Badge, EmptyState, LoadingScreen } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';
import type { Quote } from '@/lib/types';

export default function QuotesScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuotes = useCallback(async () => {
    try {
      const token = await getToken(); api.setToken(token);
      const res = await api.getQuotes();
      if (res.success) setQuotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [getToken]);

  useEffect(() => { fetchQuotes(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchQuotes(); };

  const statusColors: Record<string, string> = {
    DRAFT: '#6b7280', SENT: '#3b82f6', ACCEPTED: '#22c55e', DECLINED: '#ef4444', EXPIRED: '#f59e0b',
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen options={{ title: 'Quotes' }} />
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="receipt" title="No quotes" message="Quotes will appear here" />}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
            marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FontSize.lg, fontWeight: '600', color: colors.text }}>{item.quoteNumber || `Quote #${item.id.slice(-6)}`}</Text>
                {item.customer && <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{item.customer.name}</Text>}
              </View>
              <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: '#22c55e' }}>{formatCurrency(item.total || 0)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.sm }}>
              <Badge label={item.status || 'DRAFT'} color={statusColors[item.status] || '#6b7280'} />
              {item.validUntil && (
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
                  Valid until {formatDate(item.validUntil)}
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </>
  );
}
