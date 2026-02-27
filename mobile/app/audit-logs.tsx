import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, TextInput
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, formatDate } from '@/lib/utils';
import { Card, Badge, EmptyState, Avatar } from '@/components/ui';
import {
  FontSize, Spacing, BorderRadius, FontWeight, AccentColors,
} from '@/lib/theme';
import api from '@/lib/api';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  user?: { name: string; email: string };
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const ACTION_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  create: { icon: 'add-circle', color: AccentColors.emerald },
  update: { icon: 'create', color: AccentColors.blue },
  delete: { icon: 'trash', color: AccentColors.red },
  login: { icon: 'log-in', color: AccentColors.violet },
  logout: { icon: 'log-out', color: AccentColors.neutral },
  export: { icon: 'download', color: AccentColors.amber },
  import: { icon: 'cloud-upload', color: AccentColors.cyan },
  view: { icon: 'eye', color: AccentColors.neutral },
};

const ENTITIES = ['all', 'customer', 'deal', 'contact', 'task', 'user', 'team'];

export default function AuditLogsScreen() {
  const colors = useThemeColors();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('all');

  const fetchLogs = async () => {
    try {
      const response = await api.getAuditLogs();
      setLogs((response as any).logs || response || []);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      // Mock data for demo
      setLogs([
        {
          id: '1',
          action: 'create',
          entity: 'deal',
          entityId: 'd1',
          userId: 'u1',
          user: { name: 'John Doe', email: 'john@example.com' },
          details: { title: 'New Enterprise Deal' },
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          action: 'update',
          entity: 'customer',
          entityId: 'c1',
          userId: 'u1',
          user: { name: 'Jane Smith', email: 'jane@example.com' },
          details: { field: 'status', from: 'lead', to: 'active' },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          action: 'login',
          entity: 'user',
          entityId: 'u2',
          userId: 'u2',
          user: { name: 'Mike Johnson', email: 'mike@example.com' },
          details: {},
          ipAddress: '192.168.1.1',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLogs();
  }, []);

  const getActionDetails = (log: AuditLog) => {
    const action = log.action.toLowerCase();
    const entity = log.entity.toLowerCase();
    
    switch (action) {
      case 'create':
        return `Created ${entity}`;
      case 'update':
        return `Updated ${entity}`;
      case 'delete':
        return `Deleted ${entity}`;
      case 'login':
        return 'Logged in';
      case 'logout':
        return 'Logged out';
      default:
        return `${action} ${entity}`;
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(searchLower) ||
      log.entity.toLowerCase().includes(searchLower) ||
      log.user?.name.toLowerCase().includes(searchLower) ||
      log.user?.email.toLowerCase().includes(searchLower);
    const matchesEntity = selectedEntity === 'all' || log.entity.toLowerCase() === selectedEntity;
    return matchesSearch && matchesEntity;
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Audit Logs', headerShown: true }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {/* Header */}
        <Card style={{ padding: Spacing.lg, marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View style={{
              width: 44, height: 44, borderRadius: BorderRadius.md,
              backgroundColor: AccentColors.violet + '15',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="shield-checkmark" size={22} color={AccentColors.violet} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: colors.text }}>
                Activity Audit
              </Text>
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>
                Track all system activities
              </Text>
            </View>
            <Badge label={`${logs.length} logs`} color={AccentColors.violet} />
          </View>
        </Card>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
          backgroundColor: colors.card, borderRadius: BorderRadius.lg,
          borderWidth: 1, borderColor: colors.border,
          paddingHorizontal: Spacing.lg, height: 48, marginBottom: Spacing.md,
        }}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search logs..."
            placeholderTextColor={colors.textTertiary}
            style={{ flex: 1, color: colors.text, fontSize: FontSize.md }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Entity Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: Spacing.lg }}
          contentContainerStyle={{ gap: Spacing.sm }}
        >
          {ENTITIES.map((entity) => (
            <TouchableOpacity
              key={entity}
              onPress={() => setSelectedEntity(entity)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: BorderRadius.full,
                backgroundColor: selectedEntity === entity ? colors.text : colors.card,
                borderWidth: 1,
                borderColor: selectedEntity === entity ? colors.text : colors.border,
              }}
            >
              <Text style={{
                fontSize: FontSize.sm, fontWeight: FontWeight.medium,
                color: selectedEntity === entity ? colors.background : colors.textSecondary,
                textTransform: 'capitalize',
              }}>
                {entity}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Logs List */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 60 }} />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No logs found"
            description={searchQuery ? 'Try a different search term' : 'No audit logs recorded yet'}
          />
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {filteredLogs.map((log) => {
              const actionInfo = ACTION_ICONS[log.action.toLowerCase()] || ACTION_ICONS.view;
              return (
                <Card key={log.id} style={{ padding: Spacing.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: BorderRadius.md,
                      backgroundColor: actionInfo.color + '15',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons name={actionInfo.icon} size={20} color={actionInfo.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                        <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.medium, color: colors.text }}>
                          {getActionDetails(log)}
                        </Text>
                        <Badge label={log.entity} color={AccentColors.neutral} />
                      </View>
                      {log.user && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <Avatar name={log.user.name} size={20} />
                          <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>
                            {log.user.name}
                          </Text>
                        </View>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 6 }}>
                        <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                        <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary }}>
                          {formatDate(log.createdAt)}
                        </Text>
                        {log.ipAddress && (
                          <>
                            <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary }}>•</Text>
                            <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary }}>
                              {log.ipAddress}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </>
  );
}
