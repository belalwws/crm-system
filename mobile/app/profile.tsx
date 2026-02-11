import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/lib/utils';
import { Card, Avatar, Section, Divider } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const { signOut } = useAuth();
  const { user } = useUser();

  const info = [
    { icon: 'person' as const, label: 'Name', value: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not set' },
    { icon: 'mail' as const, label: 'Email', value: user?.primaryEmailAddress?.emailAddress || 'Not set' },
    { icon: 'calendar' as const, label: 'Joined', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown' },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        <Card style={{ padding: Spacing.xl, alignItems: 'center' }}>
          <Avatar name={`${user?.firstName || ''} ${user?.lastName || ''}`} size={80} color={colors.primary} />
          <Text style={{ fontSize: FontSize.xxl, fontWeight: '700', color: colors.text, marginTop: Spacing.md }}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={{ fontSize: FontSize.md, color: colors.textSecondary }}>
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </Card>

        <Section title="Information">
          <Card>
            {info.map((item, i) => (
              <View key={item.label} style={{
                flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
                borderBottomWidth: i < info.length - 1 ? 1 : 0, borderBottomColor: colors.border,
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '20',
                  alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
                }}>
                  <Ionicons name={item.icon} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{item.label}</Text>
                  <Text style={{ fontSize: FontSize.md, color: colors.text, fontWeight: '500' }}>{item.value}</Text>
                </View>
              </View>
            ))}
          </Card>
        </Section>

        <TouchableOpacity
          onPress={() => signOut()}
          style={{
            backgroundColor: '#ef444415', borderRadius: BorderRadius.lg, padding: Spacing.lg,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.lg,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: '#ef4444' }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}
