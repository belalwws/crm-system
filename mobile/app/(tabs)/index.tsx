import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useThemeColors, useIsDark, formatCurrency, getStageColor, getStatusColor, getPriorityColor, useAuthToken } from '@/lib/utils';
import { LoadingScreen, Button } from '@/components/ui';
import { FontSize, Spacing, BorderRadius, FontWeight, AccentColors, SemanticColors } from '@/lib/theme';
import type { DashboardStats, Deal, Task } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardScreen() {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const { getAuthToken } = useAuthToken();
  const { user } = useUser();
  const router = useRouter();
  const { setDashboardStats, setNotifications } = useAppStore();
  const demoUser = useAppStore((s) => s.demoUser);

  // Use Clerk user name or demo user name
  const displayName = user?.firstName || demoUser?.name?.split(' ')[0] || 'there';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const token = await getAuthToken();
      console.log('[Dashboard] token:', token ? `${token.substring(0, 20)}...` : 'NULL');
      if (!token) {
        // Not authenticated — auth gate will redirect, don't show error
        console.log('[Dashboard] No token — skipping fetch');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [statsRes, dealsRes, tasksRes, notifRes] = await Promise.allSettled([
        api.getDashboardStats(),
        api.getDeals({ limit: 5 }),
        api.getTasks({ limit: 5 }),
        api.getNotifications(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.success && statsRes.value.data) {
        setStats(statsRes.value.data);
        setDashboardStats(statsRes.value.data);
      }
      if (dealsRes.status === 'fulfilled' && dealsRes.value.success) {
        const d = dealsRes.value.data;
        setRecentDeals(Array.isArray(d) ? d : (d as any)?.deals || []);
      }
      if (tasksRes.status === 'fulfilled' && tasksRes.value.success) {
        const t = tasksRes.value.data;
        setRecentTasks(Array.isArray(t) ? t : (t as any)?.tasks || []);
      }
      if (notifRes.status === 'fulfilled' && notifRes.value.success) {
        const n = notifRes.value.data;
        setNotifications(Array.isArray(n) ? n : []);
      }

      // If ALL calls failed, surface the error so the user sees it
      const results = [statsRes, dealsRes, tasksRes, notifRes];
      const allFailed = results.every(
        r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
      );
      if (allFailed) {
        const firstError = results.find(
          r => r.status === 'fulfilled' && r.value.message
        );
        const msg = firstError?.status === 'fulfilled'
          ? firstError.value.message
          : 'All API calls failed. Check backend connection.';
        console.error('[Dashboard] All API calls failed:', msg);
        setError(msg || 'Cannot connect to server');
      }
    } catch (err: any) {
      console.error('[Dashboard] fetch error:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthToken]);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const summary = stats?.summary;
  const dealsByStage = stats?.dealsByStage || [];
  const totalPipeline = Number(summary?.totalDealValue || 0);
  const wonValue = Number(summary?.wonValue || 0);

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
          alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <Ionicons name="cloud-offline-outline" size={36} color={colors.danger} />
        </View>
        <Text style={{ fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: colors.text, textAlign: 'center', marginBottom: 8 }}>
          Connection Error
        </Text>
        <Text style={{ fontSize: FontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
          {error}
        </Text>
        <Button title="Try Again" onPress={() => { setLoading(true); fetchData(); }} icon="refresh" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Hero Header ─── */}
      <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, fontWeight: FontWeight.medium, marginBottom: 4 }}>
              {getGreeting()}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: FontWeight.bold, color: colors.text }} numberOfLines={1}>
              {displayName} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            {(useAppStore.getState().unreadCount > 0) && (
              <View style={{
                position: 'absolute', top: -2, right: -2,
                width: 10, height: 10, borderRadius: 5,
                backgroundColor: '#ef4444', borderWidth: 2, borderColor: colors.background,
              }} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: FontSize.sm, color: colors.textTertiary, marginTop: 4 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* ─── Revenue Hero Card ─── */}
      <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg }}>
        <LinearGradient
          colors={isDark ? ['#1e1e2e', '#2a2a3e'] : ['#171717', '#262626']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: BorderRadius.xl, padding: Spacing.xl, overflow: 'hidden' }}
        >
          <View style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <View style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)' }} />

          <Text style={{ fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', fontWeight: FontWeight.medium, marginBottom: 4 }}>
            Total Revenue
          </Text>
          <Text style={{ fontSize: 32, fontWeight: FontWeight.extrabold, color: '#ffffff', marginBottom: 4 }}>
            {formatCurrency(wonValue)}
          </Text>

          {summary && summary.earningsChangePercent !== 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 3,
                backgroundColor: summary.earningsChangePercent > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full,
              }}>
                <Ionicons
                  name={summary.earningsChangePercent > 0 ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={summary.earningsChangePercent > 0 ? '#34d399' : '#f87171'}
                />
                <Text style={{
                  fontSize: FontSize.xs, fontWeight: FontWeight.semibold,
                  color: summary.earningsChangePercent > 0 ? '#34d399' : '#f87171',
                }}>
                  {Math.abs(summary.earningsChangePercent)}%
                </Text>
              </View>
              <Text style={{ fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)' }}>vs last month</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Pipeline</Text>
              <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#ffffff' }}>
                {formatCurrency(totalPipeline)}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Won Deals</Text>
              <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#34d399' }}>
                {summary?.wonDeals || 0}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* ─── Quick Stats Grid ─── */}
      <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl }}>
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <QuickStat label="Customers" value={summary?.totalCustomers || 0} icon="people" color={AccentColors.indigo} colors={colors} onPress={() => router.push('/(tabs)/customers')} />
          <QuickStat label="Deals" value={summary?.totalDeals || 0} icon="briefcase" color={AccentColors.blue} colors={colors} onPress={() => router.push('/(tabs)/deals')} />
          <QuickStat label="Tasks" value={summary?.totalTasks || 0} icon="checkmark-circle" color={AccentColors.emerald} colors={colors} onPress={() => router.push('/(tabs)/tasks')} />
          <QuickStat label="Pending" value={summary?.pendingTasks || 0} icon="time" color={AccentColors.amber} colors={colors} />
        </View>
      </View>

      {/* ─── Quick Actions ─── */}
      <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
          <ActionChip icon="person-add" label="New Customer" color={AccentColors.indigo} colors={colors} onPress={() => router.push('/customer/create' as any)} />
          <ActionChip icon="add-circle" label="New Deal" color={AccentColors.blue} colors={colors} onPress={() => router.push('/deal/create' as any)} />
          <ActionChip icon="create" label="New Task" color={AccentColors.emerald} colors={colors} onPress={() => router.push('/task/create' as any)} />
          <ActionChip icon="chatbubbles" label="AI Chat" color={AccentColors.violet} colors={colors} onPress={() => router.push('/ai-chat')} />
          <ActionChip icon="search" label="Search" color={AccentColors.neutral} colors={colors} onPress={() => router.push('/search')} />
        </ScrollView>
      </View>

      {/* ─── Pipeline Overview ─── */}
      {dealsByStage.length > 0 && (
        <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl }}>
          <SectionHeader title="Pipeline" subtitle={`${summary?.totalDeals || 0} total deals`} />
          <View style={{ backgroundColor: colors.card, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            {dealsByStage.map((stage, i) => {
              const stageKey = stage._id?.toUpperCase().replace('-', '_') || '';
              const stageColor = getStageColor(stageKey);
              const percentage = totalPipeline > 0 ? (Number(stage.value) / totalPipeline) * 100 : 0;
              return (
                <View key={stage._id} style={{
                  flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 14,
                  borderBottomWidth: i < dealsByStage.length - 1 ? 1 : 0, borderBottomColor: colors.border,
                }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: stageColor, marginRight: Spacing.md }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: colors.text, textTransform: 'capitalize' }}>
                      {(stage._id || '').replace('-', ' ')}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={{ flex: 1, height: 3, backgroundColor: colors.border, borderRadius: 2 }}>
                        <View style={{ width: `${Math.min(percentage, 100)}%` as any, height: 3, backgroundColor: stageColor, borderRadius: 2 }} />
                      </View>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginLeft: Spacing.md }}>
                    <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.text }}>
                      {formatCurrency(Number(stage.value))}
                    </Text>
                    <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary }}>
                      {stage.count} deal{stage.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ─── Recent Deals ─── */}
      <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl }}>
        <SectionHeader title="Recent Deals" action="See All" onAction={() => router.push('/(tabs)/deals')} />
        <View style={{ backgroundColor: colors.card, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          {recentDeals.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <Ionicons name="briefcase-outline" size={28} color={colors.textTertiary} />
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 8 }}>No deals yet</Text>
            </View>
          ) : (
            recentDeals.slice(0, 4).map((deal, i) => {
              const stageColor = getStageColor(deal.stage);
              const badgeMode = isDark ? 'dark' : 'light';
              const sb = SemanticColors.stage[deal.stage as keyof typeof SemanticColors.stage];
              return (
                <TouchableOpacity key={deal.id} onPress={() => router.push(`/deal/${deal.id}`)} activeOpacity={0.6}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
                    borderBottomWidth: i < Math.min(recentDeals.length, 4) - 1 ? 1 : 0, borderBottomColor: colors.border,
                  }}>
                  <View style={{ width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: stageColor + '15', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="trending-up" size={18} color={stageColor} />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: colors.text }} numberOfLines={1}>{deal.title}</Text>
                    <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary, marginTop: 2 }}>{deal.customer?.name || '—'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.text }}>{formatCurrency(Number(deal.value))}</Text>
                    <View style={{ backgroundColor: sb ? sb.bg[badgeMode] : colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full, marginTop: 3 }}>
                      <Text style={{ fontSize: 9, fontWeight: FontWeight.medium, color: sb ? sb.text[badgeMode] : colors.textSecondary, textTransform: 'capitalize' }}>
                        {deal.stage.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>

      {/* ─── Recent Tasks ─── */}
      <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl }}>
        <SectionHeader title="Tasks" action="See All" onAction={() => router.push('/(tabs)/tasks')} />
        <View style={{ backgroundColor: colors.card, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          {recentTasks.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <Ionicons name="checkmark-circle-outline" size={28} color={colors.textTertiary} />
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 8 }}>No tasks yet</Text>
            </View>
          ) : (
            recentTasks.slice(0, 4).map((task, i) => {
              const statusColor = getStatusColor(task.status);
              const priorityColor = getPriorityColor(task.priority);
              const isCompleted = task.status === 'COMPLETED';
              return (
                <TouchableOpacity key={task.id} onPress={() => router.push(`/task/${task.id}`)} activeOpacity={0.6}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
                    borderBottomWidth: i < Math.min(recentTasks.length, 4) - 1 ? 1 : 0, borderBottomColor: colors.border,
                  }}>
                  <View style={{
                    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
                    borderColor: isCompleted ? AccentColors.emerald : colors.border,
                    backgroundColor: isCompleted ? AccentColors.emerald : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={{
                      fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: colors.text,
                      textDecorationLine: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.6 : 1,
                    }} numberOfLines={1}>{task.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      {task.dueDate && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="calendar-outline" size={10} color={colors.textTertiary} />
                          <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary }}>
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                      )}
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priorityColor }} />
                      <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary, textTransform: 'capitalize' }}>
                        {(task.priority || '').toLowerCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: statusColor + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full }}>
                    <Text style={{ fontSize: 9, fontWeight: FontWeight.medium, color: statusColor, textTransform: 'capitalize' }}>
                      {(task.status || '').replace('_', ' ').toLowerCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>

      {/* ─── Monthly Trend ─── */}
      {stats?.monthlyData && stats.monthlyData.some(m => m.value > 0) && (
        <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl }}>
          <SectionHeader title="Monthly Revenue" subtitle={new Date().getFullYear().toString()} />
          <View style={{ backgroundColor: colors.card, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: colors.border, padding: Spacing.lg }}>
            <MiniBarChart data={stats.monthlyData} colors={colors} isDark={isDark} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

/* ───────── Sub-components ───────── */

function SectionHeader({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  const colors = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
      <View>
        <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: colors.text }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, fontWeight: FontWeight.medium }}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function QuickStat({ label, value, icon, color, colors, onPress }: {
  label: string; value: number; icon: keyof typeof Ionicons.glyphMap;
  color: string; colors: any; onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
      style={{
        flex: 1, backgroundColor: colors.card,
        borderRadius: BorderRadius.lg, padding: Spacing.md,
        borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 6,
      }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: colors.text }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.textTertiary, fontWeight: FontWeight.medium }}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionChip({ icon, label, color, colors, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; label: string;
  color: string; colors: any; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colors.card, borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.lg, paddingVertical: 10, borderWidth: 1, borderColor: colors.border,
      }}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: colors.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

function MiniBarChart({ data, colors, isDark }: { data: Array<{ month: string; value: number; count: number }>; colors: any; isDark: boolean }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const currentMonth = new Date().getMonth();
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 80 }}>
        {data.map((item, i) => {
          const barH = Math.max((item.value / maxValue) * 70, 3);
          const isCurrent = i === currentMonth;
          return (
            <View key={item.month} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{
                width: '70%', height: barH, borderRadius: 3,
                backgroundColor: isCurrent ? AccentColors.indigo : item.value > 0
                  ? (isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)')
                  : (isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'),
              }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
        {data.map((item, i) => (
          <View key={item.month} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{
              fontSize: 8, fontWeight: i === currentMonth ? FontWeight.semibold : FontWeight.normal,
              color: i === currentMonth ? colors.text : colors.textTertiary,
            }}>{item.month.slice(0, 3)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
