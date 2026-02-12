import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/lib/store';
import { useThemeColors } from '@/lib/utils';
import { Card, Avatar, Badge } from '@/components/ui';
import { FontSize, Spacing, BorderRadius, FontWeight, AccentColors } from '@/lib/theme';

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
  const { unreadCount } = useAppStore();

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'COMMUNICATION',
      items: [
        { icon: 'notifications', label: 'Notifications', route: '/notifications', color: AccentColors.red, badge: unreadCount },
        { icon: 'chatbubbles', label: 'AI Assistant', route: '/ai-chat', color: AccentColors.violet },
        { icon: 'mail', label: 'Emails', route: '/emails', color: AccentColors.blue },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { icon: 'calendar', label: 'Meetings', route: '/meetings', color: AccentColors.amber },
        { icon: 'people', label: 'Contacts', route: '/contacts', color: AccentColors.cyan },
        { icon: 'cube', label: 'Products', route: '/products', color: AccentColors.emerald },
        { icon: 'receipt', label: 'Quotes', route: '/quotes', color: AccentColors.pink },
        { icon: 'people-circle', label: 'Teams', route: '/teams', color: AccentColors.indigo },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { icon: 'bar-chart', label: 'Reports', route: '/reports', color: AccentColors.teal },
        { icon: 'search', label: 'Search', route: '/search', color: AccentColors.neutral },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { icon: 'person-circle', label: 'Profile', route: '/profile', color: AccentColors.indigo },
        { icon: 'settings', label: 'Settings', route: '/settings', color: AccentColors.neutral },
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
          <Avatar name={`${user?.firstName || ''} ${user?.lastName || ''}`} size={52} />
          <View style={{ flex: 1, marginLeft: Spacing.lg }}>
            <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: colors.text }}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 }}>
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </Card>

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <View key={section.title} style={{ marginBottom: Spacing.xl }}>
          <Text style={{
            fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: colors.textSecondary,
            letterSpacing: 1, marginBottom: Spacing.sm, marginLeft: 4,
          }}>
            {section.title}
          </Text>
          <Card style={{ padding: 0 }}>
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
                  backgroundColor: item.color + '15', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={{ flex: 1, fontSize: FontSize.md, color: colors.text, fontWeight: FontWeight.medium, marginLeft: Spacing.md }}>
                  {item.label}
                </Text>
                {item.badge ? (
                  <Badge label={String(item.badge)} color="#ef4444" />
                ) : null}
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={{ marginLeft: Spacing.sm }} />
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
          backgroundColor: colors.card,
          borderRadius: BorderRadius.lg,
          borderWidth: 1,
          borderColor: '#ef4444' + '30',
          padding: Spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.sm,
        }}
      >
        <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.medium, color: '#ef4444' }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
