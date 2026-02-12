import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useThemeColors, formatCurrency, getStageColor, getStatusColor } from '@/lib/utils';
import { StatCard, Card, Section, StatusBadge, Avatar, LoadingScreen, ListItem, ProgressBar } from '@/components/ui';
import { FontSize, Spacing, BorderRadius, FontWeight, AccentColors, SemanticColors } from '@/lib/theme';
import type { DashboardStats, Deal, Task } from '@/lib/types';

export default function DashboardScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { setDashboardStats, setNotifications } = useAppStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);

      const [statsRes, dealsRes, tasksRes, notifRes] = await Promise.all([
        api.getDashboardStats(),
        api.getDeals({ limit: 5 }),
        api.getTasks({ limit: 5 }),
        api.getNotifications(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
        setDashboardStats(statsRes.data);
      }
      if (dealsRes.success) {
        setRecentDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
      }
      if (tasksRes.success) {
        setRecentTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      }
      if (notifRes.success) {
        setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
    >
      {/* Greeting */}
      <View style={{ marginBottom: Spacing.xxl }}>
        <Text style={{ fontSize: FontSize.xxl, fontWeight: FontWeight.semibold, color: colors.text }}>
          Hello, {user?.firstName || 'there'}
        </Text>
        <Text style={{ fontSize: FontSize.md, color: colors.textSecondary, marginTop: 4 }}>
          Here's your business overview
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg }}>
        <StatCard
          title="Customers"
          value={stats?.totalCustomers || 0}
          icon="people"
          color={AccentColors.indigo}
          onPress={() => router.push('/(tabs)/customers')}
        />
        <StatCard
          title="Deals"
          value={stats?.totalDeals || 0}
          icon="trending-up"
          color={AccentColors.blue}
          onPress={() => router.push('/(tabs)/deals')}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats?.revenue || 0)}
          icon="cash"
          color={AccentColors.emerald}
        />
        <StatCard
          title="Pipeline"
          value={formatCurrency(stats?.pipelineValue || 0)}
          icon="analytics"
          color={AccentColors.amber}
        />
        <StatCard
          title="Tasks"
          value={stats?.totalTasks || 0}
          icon="checkmark-circle"
          color={AccentColors.cyan}
          onPress={() => router.push('/(tabs)/tasks')}
        />
        <StatCard
          title="Pending"
          value={stats?.pendingTasks || 0}
          icon="time"
          color={AccentColors.red}
        />
      </View>

      {/* Deals by Stage */}
      {stats?.dealsByStage && stats.dealsByStage.length > 0 && (
        <Section title="Pipeline Stages">
          <Card>
            {stats.dealsByStage.map((s, i) => (
              <View
                key={s.stage}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderBottomWidth: i < stats.dealsByStage.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: getStageColor(s.stage),
                  }} />
                  <Text style={{ fontSize: FontSize.md, color: colors.text, fontWeight: FontWeight.medium }}>
                    {s.stage.replace('_', ' ')}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>
                    {s.count} deals
                  </Text>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.text }}>
                    {formatCurrency(s.value)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </Section>
      )}

      {/* Recent Deals */}
      <Section
        title="Recent Deals"
        action={{ label: 'See All', onPress: () => router.push('/(tabs)/deals') }}
      >
        <Card>
          {recentDeals.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', paddingVertical: 20 }}>
              No deals yet
            </Text>
          ) : (
            recentDeals.map((deal, i) => (
              <ListItem
                key={deal.id}
                title={deal.title}
                subtitle={`${deal.customer?.name || 'No customer'} · ${formatCurrency(deal.value)}`}
                left={<Avatar name={deal.title} size={36} color={getStageColor(deal.stage)} />}
                right={
                  <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: getStageColor(deal.stage) }}>
                    {deal.stage.replace('_', ' ')}
                  </Text>
                }
                onPress={() => router.push(`/deal/${deal.id}`)}
                bottomBorder={i < recentDeals.length - 1}
              />
            ))
          )}
        </Card>
      </Section>

      {/* Recent Tasks */}
      <Section
        title="Recent Tasks"
        action={{ label: 'See All', onPress: () => router.push('/(tabs)/tasks') }}
      >
        <Card>
          {recentTasks.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', paddingVertical: 20 }}>
              No tasks yet
            </Text>
          ) : (
            recentTasks.map((task, i) => (
              <ListItem
                key={task.id}
                title={task.title}
                subtitle={`${task.priority} priority · ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}`}
                left={
                  <View style={{
                    width: 36, height: 36, borderRadius: BorderRadius.md,
                    backgroundColor: getStatusColor(task.status) + '15',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons
                      name={task.status === 'COMPLETED' ? 'checkmark-circle' : 'time'}
                      size={18}
                      color={getStatusColor(task.status)}
                    />
                  </View>
                }
                right={
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: getStatusColor(task.status),
                  }} />
                }
                onPress={() => router.push(`/task/${task.id}`)}
                bottomBorder={i < recentTasks.length - 1}
              />
            ))
          )}
        </Card>
      </Section>
    </ScrollView>
  );
}
