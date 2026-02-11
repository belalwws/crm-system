import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, formatDate, timeAgo } from '@/lib/utils';
import { FAB, Badge, EmptyState, LoadingScreen } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';
import type { Meeting } from '@/lib/types';

export default function MeetingsScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMeetings = useCallback(async () => {
    try {
      const token = await getToken(); api.setToken(token);
      const res = await api.getMeetings();
      if (res.success) setMeetings(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [getToken]);

  useEffect(() => { fetchMeetings(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchMeetings(); };

  const isUpcoming = (date: string) => new Date(date) > new Date();

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen options={{ title: 'Meetings' }} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="calendar" title="No meetings" message="Schedule your first meeting" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/meeting/${item.id}`)}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
                marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.border,
                borderLeftWidth: 4, borderLeftColor: isUpcoming(item.startTime) ? '#22c55e' : '#6b7280',
              }}
            >
              <Text style={{ fontSize: FontSize.lg, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>
                    {formatDate(item.startTime)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>
                    {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {item.endTime ? ` - ${new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </Text>
                </View>
              </View>
              {item.location && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: 4 }}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{item.location}</Text>
                </View>
              )}
              <Badge
                label={isUpcoming(item.startTime) ? 'Upcoming' : 'Past'}
                color={isUpcoming(item.startTime) ? '#22c55e' : '#6b7280'}
                style={{ position: 'absolute', top: Spacing.md, right: Spacing.md }}
              />
            </TouchableOpacity>
          )}
        />
        <FAB icon="add" onPress={() => router.push('/meeting/create')} />
      </View>
    </>
  );
}
