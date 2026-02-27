import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Dimensions
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useIsDark, formatCurrency } from '@/lib/utils';
import { Card, Badge } from '@/components/ui';
import {
  FontSize, Spacing, BorderRadius, FontWeight, AccentColors,
} from '@/lib/theme';
import api from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    change: number;
    byMonth: { month: string; value: number }[];
  };
  deals: {
    total: number;
    won: number;
    lost: number;
    inProgress: number;
    byStage: { stage: string; count: number; value: number }[];
  };
  customers: {
    total: number;
    new: number;
    growth: number;
    byType: { type: string; count: number }[];
  };
  activities: {
    total: number;
    calls: number;
    emails: number;
    meetings: number;
    tasks: number;
  };
  topPerformers: {
    id: string;
    name: string;
    deals: number;
    revenue: number;
  }[];
}

const TIME_PERIODS = ['7d', '30d', '90d', 'year'];

export default function AnalyticsScreen() {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('30d');

  const fetchAnalytics = async () => {
    try {
      const response = await api.getDashboardReport(period) as any;
      // Transform the response to our AnalyticsData format
      setData({
        revenue: {
          current: response.revenue || 0,
          previous: response.previousRevenue || 0,
          change: response.revenueChange || 0,
          byMonth: response.revenueByMonth || [],
        },
        deals: {
          total: response.totalDeals || 0,
          won: response.wonDeals || 0,
          lost: response.lostDeals || 0,
          inProgress: response.activeDeals || 0,
          byStage: response.dealsByStage || [],
        },
        customers: {
          total: response.totalCustomers || 0,
          new: response.newCustomers || 0,
          growth: response.customerGrowth || 0,
          byType: response.customersByType || [],
        },
        activities: {
          total: response.totalActivities || 0,
          calls: response.calls || 0,
          emails: response.emails || 0,
          meetings: response.meetings || 0,
          tasks: response.tasks || 0,
        },
        topPerformers: response.topPerformers || [],
      });
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      // Set mock data for demo
      setData({
        revenue: {
          current: 125000,
          previous: 98000,
          change: 27.5,
          byMonth: [
            { month: 'Jan', value: 15000 },
            { month: 'Feb', value: 22000 },
            { month: 'Mar', value: 18000 },
            { month: 'Apr', value: 32000 },
            { month: 'May', value: 38000 },
          ],
        },
        deals: { total: 45, won: 28, lost: 7, inProgress: 10, byStage: [] },
        customers: { total: 156, new: 23, growth: 15.2, byType: [] },
        activities: { total: 342, calls: 89, emails: 156, meetings: 45, tasks: 52 },
        topPerformers: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAnalytics();
  }, [period]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, [period]);

  const StatCard = ({
    title, value, subtitle, icon, iconColor, change, format = 'number',
  }: {
    title: string;
    value: number;
    subtitle?: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    change?: number;
    format?: 'number' | 'currency' | 'percent';
  }) => {
    const displayValue =
      format === 'currency' ? formatCurrency(value) :
      format === 'percent' ? `${value}%` :
      value.toLocaleString();

    return (
      <Card style={{ padding: Spacing.lg, flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{
            width: 40, height: 40, borderRadius: BorderRadius.md,
            backgroundColor: iconColor + '15',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
          {change !== undefined && (
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: change >= 0 ? AccentColors.emerald + '15' : AccentColors.red + '15',
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full,
            }}>
              <Ionicons
                name={change >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={change >= 0 ? AccentColors.emerald : AccentColors.red}
              />
              <Text style={{
                fontSize: FontSize.xs, fontWeight: FontWeight.medium,
                color: change >= 0 ? AccentColors.emerald : AccentColors.red,
                marginLeft: 4,
              }}>
                {Math.abs(change).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: colors.text }}>
          {displayValue}
        </Text>
        <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 4 }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </Card>
    );
  };

  const SimpleBarChart = ({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) => (
    <View style={{ gap: Spacing.md }}>
      {data.map((item, i) => (
        <View key={i}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: FontSize.sm, color: colors.text }}>{item.label}</Text>
            <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: colors.text }}>
              {item.value.toLocaleString()}
            </Text>
          </View>
          <View style={{
            height: 8, backgroundColor: colors.border, borderRadius: BorderRadius.full, overflow: 'hidden',
          }}>
            <View style={{
              height: '100%',
              width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
              backgroundColor: AccentColors.blue,
              borderRadius: BorderRadius.full,
            }} />
          </View>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Analytics', headerShown: true }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {/* Period Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: Spacing.lg }}
          contentContainerStyle={{ gap: Spacing.sm }}
        >
          {TIME_PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: BorderRadius.full,
                backgroundColor: period === p ? colors.text : colors.card,
                borderWidth: 1,
                borderColor: period === p ? colors.text : colors.border,
              }}
            >
              <Text style={{
                fontSize: FontSize.sm, fontWeight: FontWeight.medium,
                color: period === p ? colors.background : colors.textSecondary,
              }}>
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'Year'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {data && (
          <>
            {/* Revenue & Customers */}
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md }}>
              <StatCard
                title="Total Revenue"
                value={data.revenue.current}
                icon="cash"
                iconColor={AccentColors.emerald}
                change={data.revenue.change}
                format="currency"
              />
              <StatCard
                title="Customers"
                value={data.customers.total}
                subtitle={`+${data.customers.new} new`}
                icon="people"
                iconColor={AccentColors.blue}
                change={data.customers.growth}
              />
            </View>

            {/* Deals */}
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg }}>
              <StatCard
                title="Won Deals"
                value={data.deals.won}
                icon="checkmark-circle"
                iconColor={AccentColors.emerald}
              />
              <StatCard
                title="In Progress"
                value={data.deals.inProgress}
                icon="time"
                iconColor={AccentColors.amber}
              />
            </View>

            {/* Activities Breakdown */}
            <Card style={{ padding: Spacing.xl, marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: colors.text, marginBottom: Spacing.lg }}>
                Activity Breakdown
              </Text>
              <SimpleBarChart
                data={[
                  { label: 'Emails', value: data.activities.emails },
                  { label: 'Calls', value: data.activities.calls },
                  { label: 'Tasks', value: data.activities.tasks },
                  { label: 'Meetings', value: data.activities.meetings },
                ]}
                maxValue={Math.max(
                  data.activities.emails,
                  data.activities.calls,
                  data.activities.tasks,
                  data.activities.meetings
                )}
              />
            </Card>

            {/* Deal Pipeline */}
            <Card style={{ padding: Spacing.xl, marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: colors.text, marginBottom: Spacing.lg }}>
                Deal Status Overview
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                {[
                  { label: 'Won', value: data.deals.won, color: AccentColors.emerald },
                  { label: 'Lost', value: data.deals.lost, color: AccentColors.red },
                  { label: 'Active', value: data.deals.inProgress, color: AccentColors.amber },
                ].map((item) => (
                  <View key={item.label} style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{
                      width: 64, height: 64, borderRadius: 32,
                      backgroundColor: item.color + '20',
                      alignItems: 'center', justifyContent: 'center',
                      marginBottom: 8,
                    }}>
                      <Text style={{ fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: item.color }}>
                        {item.value}
                      </Text>
                    </View>
                    <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>

            {/* Revenue Trend */}
            {data.revenue.byMonth.length > 0 && (
              <Card style={{ padding: Spacing.xl }}>
                <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: colors.text, marginBottom: Spacing.lg }}>
                  Revenue Trend
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120 }}>
                  {data.revenue.byMonth.map((item, i) => {
                    const maxValue = Math.max(...data.revenue.byMonth.map(m => m.value));
                    const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    return (
                      <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                        <View style={{
                          width: 24,
                          height: height,
                          backgroundColor: AccentColors.blue,
                          borderRadius: BorderRadius.sm,
                          marginBottom: 8,
                        }} />
                        <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
                          {item.month}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}
