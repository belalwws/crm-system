import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/lib/store';
import { useThemeColors } from '@/lib/utils';
import { Card, Avatar, Divider, Badge } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  color: string;
  badge?: number;
};

export default function MoreScreen() {
  const colors = useThemeColors();
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { unreadNotifications } = useAppStore();

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Communication',
      items: [
        { icon: 'notifications', label: 'Notifications', route: '/notifications', color: '#ef4444', badge: unreadNotifications },
        { icon: 'chatbubbles', label: 'AI Assistant', route: '/ai-chat', color: '#8b5cf6' },
        { icon: 'mail', label: 'Emails', route: '/emails', color: '#3b82f6' },
      ],
    },
    {
      title: 'Management',
      items: [
        { icon: 'calendar', label: 'Meetings', route: '/meetings', color: '#f59e0b' },
        { icon: 'people', label: 'Contacts', route: '/contacts', color: '#06b6d4' },
        { icon: 'cube', label: 'Products', route: '/products', color: '#22c55e' },
        { icon: 'receipt', label: 'Quotes', route: '/quotes', color: '#ec4899' },
        { icon: 'people-circle', label: 'Teams', route: '/teams', color: '#6366f1' },
      ],
    },
    {
      title: 'Insights',
      items: [
        { icon: 'bar-chart', label: 'Reports', route: '/reports', color: '#14b8a6' },
        { icon: 'search', label: 'Search', route: '/search', color: '#64748b' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'person-circle', label: 'Profile', route: '/profile', color: '#6366f1' },
        { icon: 'settings', label: 'Settings', route: '/settings', color: '#64748b' },
      ],
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
    >
      {/* Profile Header */}
      <Card style={{ padding: Spacing.xl, marginBottom: Spacing.lg }}>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Avatar name={`${user?.firstName || ''} ${user?.lastName || ''}`} size={56} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: Spacing.lg }}>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '700', color: colors.text }}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <View key={section.title} style={{ marginBottom: Spacing.lg }}>
          <Text style={{
            fontSize: FontSize.xs, fontWeight: '600', color: colors.textSecondary,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginLeft: Spacing.sm,
          }}>
            {section.title}
          </Text>
          <Card>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.6}
                style={{
                  flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
                  borderBottomWidth: i < section.items.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: BorderRadius.md,
                  backgroundColor: item.color + '18', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={{ flex: 1, fontSize: FontSize.md, color: colors.text, fontWeight: '500', marginLeft: Spacing.md }}>
                  {item.label}
                </Text>
                {item.badge ? (
                  <Badge label={String(item.badge)} color="#ef4444" />
                ) : null}
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ marginLeft: Spacing.sm }} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      ))}

      {/* Sign Out */}
      <TouchableOpacity
        onPress={() => signOut()}
        activeOpacity={0.6}
        style={{
          backgroundColor: '#ef444415',
          borderRadius: BorderRadius.lg,
          padding: Spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.sm,
        }}
      >
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: '#ef4444' }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
