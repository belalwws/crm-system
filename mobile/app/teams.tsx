import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors } from '@/lib/utils';
import { EmptyState, LoadingScreen, Avatar } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';
import type { Team } from '@/lib/types';

export default function TeamsScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeams = useCallback(async () => {
    try {
      const token = await getToken(); api.setToken(token);
      const res = await api.getTeams();
      if (res.success) setTeams(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [getToken]);

  useEffect(() => { fetchTeams(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchTeams(); };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen options={{ title: 'Teams' }} />
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="people-circle" title="No teams" message="Teams will appear here" />}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
            marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.border,
            flexDirection: 'row', alignItems: 'center',
          }}>
            <View style={{
              width: 48, height: 48, borderRadius: 24, backgroundColor: '#6366f120',
              alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
            }}>
              <Ionicons name="people" size={24} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: '600', color: colors.text }}>{item.name}</Text>
              {item.description && (
                <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }} numberOfLines={1}>{item.description}</Text>
              )}
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
                {item.members?.length || 0} members
              </Text>
            </View>
          </View>
        )}
      />
    </>
  );
}
