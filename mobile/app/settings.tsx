import React from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/lib/store';
import { useThemeColors } from '@/lib/utils';
import { Card, Section, Divider } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { signOut } = useAuth();
  const { theme, setTheme } = useAppStore();

  const isDark = theme === 'dark';

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        <Section title="Appearance">
          <Card>
            <View style={{
              flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
              justifyContent: 'space-between',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: '#6366f120', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color="#6366f1" />
                </View>
                <Text style={{ fontSize: FontSize.md, color: colors.text, fontWeight: '500' }}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </Card>
        </Section>

        <Section title="About">
          <Card>
            {[
              { icon: 'information-circle' as const, label: 'Version', value: '1.0.0' },
              { icon: 'code-slash' as const, label: 'Build', value: 'Expo SDK 52' },
              { icon: 'globe' as const, label: 'API', value: 'Nexus CRM Backend' },
            ].map((item, i) => (
              <View key={item.label} style={{
                flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
                justifyContent: 'space-between',
                borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: colors.border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
                  <Text style={{ fontSize: FontSize.md, color: colors.text }}>{item.label}</Text>
                </View>
                <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{item.value}</Text>
              </View>
            ))}
          </Card>
        </Section>

        <TouchableOpacity
          onPress={() => signOut()}
          style={{
            backgroundColor: '#ef444415', borderRadius: BorderRadius.lg, padding: Spacing.lg,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.xl,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: '#ef4444' }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}
