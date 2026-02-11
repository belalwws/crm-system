import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, formatCurrency, getStageColor, truncate } from '@/lib/utils';
import { SearchBar, FAB, Badge, Avatar, EmptyState, LoadingScreen, Chip } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';
import type { Deal } from '@/lib/types';

const STAGES = ['ALL', 'LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

export default function DealsScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const router = useRouter();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  const fetchDeals = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      const params: any = {};
      if (search) params.search = search;
      if (stageFilter !== 'ALL') params.stage = stageFilter;
      const res = await api.getDeals(params);
      if (res.success) {
        setDeals(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Fetch deals error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, search, stageFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchDeals(), 300);
    return () => clearTimeout(timer);
  }, [search, stageFilter]);

  useEffect(() => { fetchDeals(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchDeals(); }, [fetchDeals]);

  const renderDeal = ({ item }: { item: Deal }) => (
    <TouchableOpacity
      onPress={() => router.push(`/deal/${item.id}`)}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.card,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 4,
        borderLeftColor: getStageColor(item.stage),
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: Spacing.md }}>
          <Text style={{ fontSize: FontSize.lg, fontWeight: '600', color: colors.text }} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 }}>
            {item.customer?.name || 'No customer'}
          </Text>
        </View>
        <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: '#22c55e' }}>
          {formatCurrency(item.value)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.md }}>
        <Badge label={item.stage.replace('_', ' ')} color={getStageColor(item.stage)} />
        {item.probability !== undefined && (
          <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
            {item.probability}% probability
          </Text>
        )}
        {item.expectedCloseDate && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
              {new Date(item.expectedCloseDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      {item.probability !== undefined && (
        <View style={{ marginTop: Spacing.md, height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
          <View style={{
            height: 4, borderRadius: 2, backgroundColor: getStageColor(item.stage),
            width: `${Math.min(item.probability, 100)}%`,
          }} />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: Spacing.lg, paddingBottom: 0 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search deals..." />
        <FlatList
          data={STAGES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ gap: Spacing.sm, paddingVertical: Spacing.md }}
          renderItem={({ item }) => (
            <Chip
              label={item.replace('_', ' ')}
              active={stageFilter === item}
              onPress={() => setStageFilter(item)}
              color={item === 'ALL' ? colors.primary : getStageColor(item)}
            />
          )}
        />
      </View>

      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        renderItem={renderDeal}
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState icon="trending-up" title="No deals found" message="Create your first deal to track your pipeline" />
        }
      />

      <FAB icon="add" onPress={() => router.push('/deal/create')} />
    </View>
  );
}
