import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuthToken } from '@/lib/utils';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, formatCurrency, getStatusColor, truncate, useIsDark } from '@/lib/utils';
import { SearchBar, FAB, StatusBadge, Avatar, EmptyState, LoadingScreen, Chip } from '@/components/ui';
import { FontSize, Spacing, BorderRadius, FontWeight, SemanticColors } from '@/lib/theme';
import type { Customer } from '@/lib/types';

const STATUSES = ['ALL', 'LEAD', 'PROSPECT', 'ACTIVE', 'INACTIVE'];

export default function CustomersScreen() {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const { getAuthToken } = useAuthToken();
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchCustomers = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.getCustomers(params);
      if (res.success) {
        setCustomers(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Fetch customers error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthToken, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(), 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  useEffect(() => { fetchCustomers(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCustomers();
  }, [fetchCustomers]);

  const getBadgeColors = (status: string) => {
    const mode = isDark ? 'dark' : 'light';
    const s = SemanticColors.status[status as keyof typeof SemanticColors.status];
    if (!s) return { dot: '#737373', text: isDark ? '#a3a3a3' : '#525252', bg: isDark ? 'rgba(38,38,38,0.5)' : '#f5f5f5' };
    return { dot: s.dot, text: s.text[mode], bg: s.bg[mode] };
  };

  const renderCustomer = ({ item }: { item: Customer }) => {
    const badge = getBadgeColors(item.status);
    return (
      <TouchableOpacity
        onPress={() => router.push(`/customer/${item.id}`)}
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={item.name} size={44} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.medium, color: colors.text }} numberOfLines={1}>
              {item.name}
            </Text>
            {item.company && (
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                {item.company}
              </Text>
            )}
          </View>
          <StatusBadge
            label={item.status}
            dotColor={badge.dot}
            textColor={badge.text}
            bgColor={badge.bg}
          />
        </View>

        {/* Contact info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: 12 }}>
          {item.email && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="mail-outline" size={12} color={colors.textTertiary} />
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }} numberOfLines={1}>
                {truncate(item.email, 24)}
              </Text>
            </View>
          )}
          {item.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="call-outline" size={12} color={colors.textTertiary} />
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
                {item.phone}
              </Text>
            </View>
          )}
        </View>

        {/* Quick stats */}
        <View style={{ flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.lg }}>
          {item._count && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="briefcase-outline" size={13} color={colors.textTertiary} />
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
                  {item._count.deals || 0} deals
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="document-text-outline" size={13} color={colors.textTertiary} />
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
                  {item._count.notes || 0} notes
                </Text>
              </View>
            </>
          )}
          {item.totalValue !== undefined && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="cash-outline" size={13} color={colors.textTertiary} />
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
                {formatCurrency(item.totalValue)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: Spacing.lg, paddingBottom: 0 }}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search customers..."
        />
        <FlatList
          data={STATUSES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ gap: Spacing.sm, paddingVertical: Spacing.md }}
          renderItem={({ item }) => (
            <Chip
              label={item}
              active={statusFilter === item}
              onPress={() => setStatusFilter(item)}
            />
          )}
        />
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        ListEmptyComponent={
          <EmptyState icon="people" title="No customers found" description="Add your first customer to get started" />
        }
      />

      <FAB icon="add" onPress={() => router.push('/customer/create')} />
    </View>
  );
}
