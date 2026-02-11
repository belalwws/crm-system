import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, timeAgo } from '@/lib/utils';
import { EmptyState, LoadingScreen, Badge } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';

export default function EmailsScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmails = useCallback(async () => {
    try {
      const token = await getToken(); api.setToken(token);
      const res = await api.getEmailHistory();
      if (res.success) setEmails(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [getToken]);

  useEffect(() => { fetchEmails(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchEmails(); };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen options={{ title: 'Emails' }} />
      <FlatList
        data={emails}
        keyExtractor={(item, i) => item.id || String(i)}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="mail" title="No emails" message="Your email history will appear here" />}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
            marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: Spacing.md }}>
                <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: colors.text }} numberOfLines={1}>{item.subject || 'No subject'}</Text>
                <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 }}>To: {item.to}</Text>
              </View>
              <Badge label={item.status || 'sent'} color={item.status === 'delivered' ? '#22c55e' : '#3b82f6'} />
            </View>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: Spacing.sm }}>
              {timeAgo(item.sentAt || item.createdAt)}
            </Text>
          </View>
        )}
      />
    </>
  );
}
