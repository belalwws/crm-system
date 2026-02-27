import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useAuthToken } from '@/lib/utils';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, formatCurrency } from '@/lib/utils';
import { Card, Section, LoadingScreen } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';

export default function ReportsScreen() {
  const colors = useThemeColors();
  const { getAuthToken } = useAuthToken();
  const [funnel, setFunnel] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const [funnelRes, forecastRes, perfRes] = await Promise.all([
        api.getConversionFunnel(),
        api.getRevenueForecast(),
        api.getPerformanceMetrics(),
      ]);
      if (funnelRes.success) setFunnel(funnelRes.data);
      if (forecastRes.success) setForecast(forecastRes.data);
      if (perfRes.success) setPerformance(perfRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [getAuthToken]);

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen options={{ title: 'Reports' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Revenue Forecast */}
        {forecast && (
          <Section title="Revenue Forecast">
            <Card style={{ padding: Spacing.xl }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>Projected Revenue</Text>
                  <Text style={{ fontSize: 28, fontWeight: '800', color: '#22c55e' }}>
                    {formatCurrency(forecast.projected || forecast.total || 0)}
                  </Text>
                </View>
                <View style={{
                  width: 48, height: 48, borderRadius: 24, backgroundColor: '#22c55e20',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="trending-up" size={24} color="#22c55e" />
                </View>
              </View>
              {forecast.months && Array.isArray(forecast.months) && (
                <View style={{ marginTop: Spacing.lg, gap: Spacing.sm }}>
                  {forecast.months.slice(0, 6).map((m: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{m.month || m.label}</Text>
                      <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>{formatCurrency(m.value || m.revenue || 0)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </Section>
        )}

        {/* Conversion Funnel */}
        {funnel && (
          <Section title="Conversion Funnel">
            <Card style={{ padding: Spacing.lg }}>
              {Array.isArray(funnel) ? funnel.map((stage: any, i: number) => {
                const maxCount = Math.max(...funnel.map((s: any) => s.count || 0), 1);
                const pct = ((stage.count || 0) / maxCount) * 100;
                return (
                  <View key={i} style={{ marginBottom: Spacing.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: FontSize.sm, color: colors.text, fontWeight: '500' }}>{stage.stage || stage.name}</Text>
                      <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{stage.count} deals</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
                      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.primary, width: `${pct}%` }} />
                    </View>
                  </View>
                );
              }) : (
                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No funnel data</Text>
              )}
            </Card>
          </Section>
        )}

        {/* Performance */}
        {performance && (
          <Section title="Performance Metrics">
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <Card style={{ flex: 1, padding: Spacing.lg, alignItems: 'center' }}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
                <Text style={{ fontSize: FontSize.xxl, fontWeight: '700', color: colors.text, marginTop: Spacing.sm }}>
                  {performance.winRate || performance.conversionRate || '0'}%
                </Text>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Win Rate</Text>
              </Card>
              <Card style={{ flex: 1, padding: Spacing.lg, alignItems: 'center' }}>
                <Ionicons name="time" size={24} color="#3b82f6" />
                <Text style={{ fontSize: FontSize.xxl, fontWeight: '700', color: colors.text, marginTop: Spacing.sm }}>
                  {performance.avgCycleTime || performance.avgDealTime || '0'}d
                </Text>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Avg Cycle</Text>
              </Card>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
              <Card style={{ flex: 1, padding: Spacing.lg, alignItems: 'center' }}>
                <Ionicons name="cash" size={24} color="#22c55e" />
                <Text style={{ fontSize: FontSize.xxl, fontWeight: '700', color: colors.text, marginTop: Spacing.sm }}>
                  {formatCurrency(performance.avgDealSize || performance.avgDealValue || 0)}
                </Text>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Avg Deal</Text>
              </Card>
              <Card style={{ flex: 1, padding: Spacing.lg, alignItems: 'center' }}>
                <Ionicons name="checkbox" size={24} color="#6366f1" />
                <Text style={{ fontSize: FontSize.xxl, fontWeight: '700', color: colors.text, marginTop: Spacing.sm }}>
                  {performance.tasksCompleted || performance.completedTasks || 0}
                </Text>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Tasks Done</Text>
              </Card>
            </View>
          </Section>
        )}
      </ScrollView>
    </>
  );
}
