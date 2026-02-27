import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { useAuthToken } from '@/lib/utils';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors } from '@/lib/utils';
import { SearchBar, EmptyState, LoadingScreen, Avatar } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';
import type { Contact } from '@/lib/types';

export default function ContactsScreen() {
  const colors = useThemeColors();
  const { getAuthToken } = useAuthToken();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchContacts = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await api.getContacts();
      if (res.success) setContacts(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [getAuthToken, search]);

  useEffect(() => { const t = setTimeout(fetchContacts, 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { fetchContacts(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchContacts(); };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen options={{ title: 'Contacts' }} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: Spacing.lg, paddingBottom: 0 }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search contacts..." />
        </View>
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="people" title="No contacts" message="Your contacts will appear here" />}
          renderItem={({ item }) => (
            <View style={{
              backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
              marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.border,
              flexDirection: 'row', alignItems: 'center',
            }}>
              <Avatar name={`${item.firstName} ${item.lastName}` || item.email || '?'} size={44} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: colors.text }}>{`${item.firstName} ${item.lastName}`.trim() || 'No name'}</Text>
                {item.email && <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{item.email}</Text>}
                {item.phone && <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{item.phone}</Text>}
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {item.email && (
                  <TouchableOpacity onPress={() => Linking.openURL(`mailto:${item.email}`)}>
                    <Ionicons name="mail" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
                {item.phone && (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                    <Ionicons name="call" size={20} color="#22c55e" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      </View>
    </>
  );
}
