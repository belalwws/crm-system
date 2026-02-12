import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useThemeColors, timeAgo } from '@/lib/utils';
import { Card, EmptyState, LoadingScreen, Button } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';
import type { Notification } from '@/lib/types';

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const { setNotifications: setStoreNotifs } = useAppStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken(); api.setToken(token);
      const res = await api.getNotifications();
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setNotifications(data);
        setStoreNotifs(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [getToken]);

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const markRead = async (id: string) => {
    try {
      const token = await getToken(); api.setToken(token);
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      const token = await getToken(); api.setToken(token);
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  };

  const getIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'DEAL_WON': return 'trophy';
      case 'DEAL_LOST': return 'close-circle';
      case 'TASK_DUE': return 'alarm';
      case 'TASK_ASSIGNED': return 'person-add';
      case 'CUSTOMER_ADDED': return 'person';
      case 'MEETING': return 'calendar';
      default: return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'DEAL_WON': return '#22c55e';
      case 'DEAL_LOST': return '#ef4444';
      case 'TASK_DUE': return '#f59e0b';
      case 'TASK_ASSIGNED': return '#3b82f6';
      case 'CUSTOMER_ADDED': return '#6366f1';
      case 'MEETING': return '#06b6d4';
      default: return colors.textSecondary;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen options={{
        title: 'Notifications',
        headerRight: () => unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={{ color: colors.primary, fontSize: FontSize.sm, fontWeight: '600' }}>Mark All Read</Text>
          </TouchableOpacity>
        ) : null,
      }} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="notifications-off" title="No notifications" message="You're all caught up!" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => !item.isRead && markRead(item.id)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', padding: Spacing.lg, marginBottom: Spacing.sm,
              backgroundColor: item.isRead ? colors.card : colors.primary + '08',
              borderRadius: BorderRadius.lg, borderWidth: 1,
              borderColor: item.isRead ? colors.border : colors.primary + '30',
            }}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: getIconColor(item.type) + '20',
              alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
            }}>
              <Ionicons name={getIcon(item.type)} size={20} color={getIconColor(item.type)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FontSize.md, fontWeight: item.isRead ? '400' : '600', color: colors.text }}>
                {item.title}
              </Text>
              {item.message && (
                <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 }} numberOfLines={2}>
                  {item.message}
                </Text>
              )}
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 4 }}>
                {timeAgo(item.createdAt)}
              </Text>
            </View>
            {!item.isRead && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 }} />
            )}
          </TouchableOpacity>
        )}
      />
    </>
  );
}
