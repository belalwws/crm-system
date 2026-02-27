import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuthToken } from '@/lib/utils';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, formatCurrency, getStageColor, truncate, useIsDark } from '@/lib/utils';
import { SearchBar, FAB, StatusBadge, EmptyState, LoadingScreen, Chip, ProgressBar, Avatar } from '@/components/ui';
import { FontSize, Spacing, BorderRadius, FontWeight, SemanticColors } from '@/lib/theme';
import type { Deal } from '@/lib/types';

const STAGES = ['ALL', 'LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

export default function DealsScreen() {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const { getAuthToken } = useAuthToken();
  const router = useRouter();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  const fetchDeals = useCallback(async () => {
    try {
      const token = await getAuthToken();
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
  }, [getAuthToken, search, stageFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchDeals(), 300);
    return () => clearTimeout(timer);
  }, [search, stageFilter]);

  useEffect(() => { fetchDeals(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchDeals(); }, [fetchDeals]);

  const getStageBadge = (stage: string) => {
    const mode = isDark ? 'dark' : 'light';
    const s = SemanticColors.stage[stage as keyof typeof SemanticColors.stage];
    if (!s) return { dot: '#737373', text: isDark ? '#a3a3a3' : '#525252', bg: isDark ? 'rgba(38,38,38,0.5)' : '#f5f5f5' };
    return { dot: s.dot, text: s.text[mode], bg: s.bg[mode] };
  };

  const renderDeal = ({ item }: { item: Deal }) => {
    const badge = getStageBadge(item.stage);
    return (
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
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: Spacing.md }}>
            <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.medium, color: colors.text }} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 }}>
              {item.customer?.name || 'No customer'}
            </Text>
          </View>
          <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.text }}>
            {formatCurrency(item.value)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.md }}>
          <StatusBadge
            label={item.stage.replace('_', ' ')}
            dotColor={badge.dot}
            textColor={badge.text}
            bgColor={badge.bg}
          />
          {item.probability !== undefined && (
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
              {item.probability}%
            </Text>
          )}
          {item.expectedCloseDate && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
                {new Date(item.expectedCloseDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        {item.probability !== undefined && (
          <View style={{ marginTop: Spacing.md }}>
            <ProgressBar value={item.probability} color={getStageColor(item.stage)} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
            />
          )}
        />
      </View>

      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        renderItem={renderDeal}
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        ListEmptyComponent={
          <EmptyState icon="trending-up" title="No deals found" description="Create your first deal to track your pipeline" />
        }
      />

      <FAB icon="add" onPress={() => router.push('/deal/create')} />
    </View>
  );
}
