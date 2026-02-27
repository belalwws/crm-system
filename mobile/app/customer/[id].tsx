import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Linking } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, formatCurrency, formatDate, timeAgo, getStageColor, getStatusColor, getPriorityColor } from '@/lib/utils';
import { Card, Section, Badge, Avatar, LoadingScreen, ListItem, Button, Divider } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';
import type { Customer, Deal, Note, Activity } from '@/lib/types';

export default function CustomerDetailScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      const [custRes, notesRes] = await Promise.all([
        api.getCustomer(id!),
        api.getNotes({ customerId: id }),
      ]);
      if (custRes.success && custRes.data) setCustomer(custRes.data);
      if (notesRes.success) setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
    } catch (err) {
      console.error('Customer detail error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, getToken]);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const getAiInsight = async () => {
    setInsightLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.getCustomerInsights(id!);
      if (res.success && res.data) setAiInsight((res.data as any).insight || (res.data as any).analysis || JSON.stringify(res.data));
    } catch (err) {
      console.error('AI insight error:', err);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Customer', 'Are you sure you want to delete this customer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const token = await getToken();
          api.setToken(token);
          await api.deleteCustomer(id!);
          router.back();
        },
      },
    ]);
  };

  if (loading || !customer) return <LoadingScreen />;

  const statusColors: Record<string, string> = {
    LEAD: '#f59e0b', PROSPECT: '#3b82f6', ACTIVE: '#22c55e', INACTIVE: '#6b7280',
  };

  return (
    <>
      <Stack.Screen options={{
        title: customer.name,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push(`/customer/edit/${id}`)}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ),
      }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <Card>
          <View style={{ alignItems: 'center', padding: Spacing.lg }}>
            <Avatar name={customer.name} size={80} color={statusColors[customer.status]} />
            <Text style={{ fontSize: FontSize.xxl, fontWeight: '700', color: colors.text, marginTop: Spacing.md }}>
              {customer.name}
            </Text>
            {customer.company && (
              <Text style={{ fontSize: FontSize.md, color: colors.textSecondary }}>{customer.company}</Text>
            )}
            <Badge label={customer.status} color={statusColors[customer.status]} style={{ marginTop: Spacing.sm }} />
          </View>

          <Divider />

          {/* Contact Info */}
          <View style={{ padding: Spacing.md, gap: Spacing.md }}>
            {customer.email && (
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${customer.email}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="mail" size={18} color={colors.primary} />
                </View>
                <Text style={{ fontSize: FontSize.md, color: colors.primary }}>{customer.email}</Text>
              </TouchableOpacity>
            )}
            {customer.phone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${customer.phone}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#22c55e20', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="call" size={18} color="#22c55e" />
                </View>
                <Text style={{ fontSize: FontSize.md, color: '#22c55e' }}>{customer.phone}</Text>
              </TouchableOpacity>
            )}
            {customer.address && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f59e0b20', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="location" size={18} color="#f59e0b" />
                </View>
                <Text style={{ fontSize: FontSize.md, color: colors.text, flex: 1 }}>{customer.address}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
          <Card style={{ flex: 1, alignItems: 'center', padding: Spacing.lg }}>
            <Text style={{ fontSize: FontSize.xxl, fontWeight: '700', color: colors.primary }}>
              {customer._count?.deals || 0}
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>Deals</Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center', padding: Spacing.lg }}>
            <Text style={{ fontSize: FontSize.xxl, fontWeight: '700', color: '#22c55e' }}>
              {formatCurrency(customer.totalValue || 0)}
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>Total Value</Text>
          </Card>
        </View>

        {/* AI Insights */}
        <Section title="AI Insights">
          <Card>
            {aiInsight ? (
              <Text style={{ fontSize: FontSize.md, color: colors.text, lineHeight: 22, padding: Spacing.md }}>
                {aiInsight}
              </Text>
            ) : (
              <Button
                title={insightLoading ? 'Analyzing...' : 'Get AI Insights'}
                onPress={getAiInsight}
                disabled={insightLoading}
                icon="sparkles"
              />
            )}
          </Card>
        </Section>

        {/* Deals */}
        {customer.deals && customer.deals.length > 0 && (
          <Section title="Deals">
            <Card>
              {customer.deals.map((deal: Deal, i: number) => (
                <ListItem
                  key={deal.id}
                  title={deal.title}
                  subtitle={`${formatCurrency(deal.value)} • ${deal.stage.replace('_', ' ')}`}
                  right={<Badge label={deal.stage.replace('_', ' ')} color={getStageColor(deal.stage)} />}
                  onPress={() => router.push(`/deal/${deal.id}`)}
                  bottomBorder={i < customer.deals!.length - 1}
                />
              ))}
            </Card>
          </Section>
        )}

        {/* Notes */}
        <Section title="Notes" action={{ label: 'Add', onPress: () => router.push(`/note/create?customerId=${id}`) }}>
          <Card>
            {notes.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: Spacing.lg }}>No notes yet</Text>
            ) : (
              notes.map((note, i) => (
                <ListItem
                  key={note.id}
                  title={note.title || 'Untitled'}
                  subtitle={`${timeAgo(note.createdAt)} • ${(note.content || '').substring(0, 60)}...`}
                  left={<Ionicons name="document-text" size={20} color={colors.primary} />}
                  bottomBorder={i < notes.length - 1}
                />
              ))
            )}
          </Card>
        </Section>

        {/* Created */}
        <View style={{ marginTop: Spacing.lg, alignItems: 'center' }}>
          <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
            Created {formatDate(customer.createdAt)}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
