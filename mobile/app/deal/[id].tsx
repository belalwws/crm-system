import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, formatCurrency, formatDate, timeAgo, getStageColor } from '@/lib/utils';
import { Card, Section, Badge, Avatar, LoadingScreen, ListItem, Button, Divider } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';
import type { Deal, Note } from '@/lib/types';

export default function DealDetailScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [aiInsight, setAiInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      const [dealRes, notesRes] = await Promise.all([
        api.getDeal(id!),
        api.getNotes({ dealId: id }),
      ]);
      if (dealRes.success && dealRes.data) setDeal(dealRes.data);
      if (notesRes.success) setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
    } catch (err) {
      console.error('Deal detail error:', err);
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
      const res = await api.getDealInsights(id!);
      if (res.success && res.data) setAiInsight(res.data.insight || res.data.analysis || JSON.stringify(res.data));
    } catch (err) { console.error(err); }
    finally { setInsightLoading(false); }
  };

  const handleDelete = () => {
    Alert.alert('Delete Deal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const token = await getToken(); api.setToken(token);
        await api.deleteDeal(id!); router.back();
      }},
    ]);
  };

  if (loading || !deal) return <LoadingScreen />;

  const STAGES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  const currentStageIdx = STAGES.indexOf(deal.stage);

  return (
    <>
      <Stack.Screen options={{
        title: deal.title,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push(`/deal/edit/${id}`)}>
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
        {/* Value & Stage */}
        <Card style={{ padding: Spacing.xl, alignItems: 'center' }}>
          <Text style={{ fontSize: 36, fontWeight: '800', color: '#22c55e' }}>
            {formatCurrency(deal.value)}
          </Text>
          <Badge label={deal.stage.replace('_', ' ')} color={getStageColor(deal.stage)} style={{ marginTop: Spacing.md }} />
          {deal.probability !== undefined && (
            <Text style={{ fontSize: FontSize.md, color: colors.textSecondary, marginTop: Spacing.sm }}>
              {deal.probability}% probability
            </Text>
          )}
        </Card>

        {/* Pipeline Progress */}
        <Card style={{ padding: Spacing.lg, marginTop: Spacing.lg }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginBottom: Spacing.md }}>
            Pipeline Progress
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {STAGES.map((stage, i) => (
              <View key={stage} style={{ flex: 1, alignItems: 'center' }}>
                <View style={{
                  height: 6, width: '100%', borderRadius: 3,
                  backgroundColor: i <= currentStageIdx ? getStageColor(deal.stage) : colors.border,
                }} />
                <Text style={{
                  fontSize: 8, color: i <= currentStageIdx ? getStageColor(deal.stage) : colors.textSecondary,
                  marginTop: 4, textAlign: 'center',
                }}>
                  {stage.replace('_', '\n')}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Details */}
        <Section title="Details">
          <Card style={{ padding: Spacing.lg }}>
            {deal.customer && (
              <TouchableOpacity
                onPress={() => router.push(`/customer/${deal.customer!.id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md }}
              >
                <Ionicons name="person" size={18} color={colors.primary} />
                <Text style={{ fontSize: FontSize.md, color: colors.primary }}>{deal.customer.name}</Text>
              </TouchableOpacity>
            )}
            {deal.expectedCloseDate && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md }}>
                <Ionicons name="calendar" size={18} color={colors.textSecondary} />
                <Text style={{ fontSize: FontSize.md, color: colors.text }}>
                  Expected close: {formatDate(deal.expectedCloseDate)}
                </Text>
              </View>
            )}
            {deal.description && (
              <Text style={{ fontSize: FontSize.md, color: colors.text, lineHeight: 22, marginTop: Spacing.sm }}>
                {deal.description}
              </Text>
            )}
          </Card>
        </Section>

        {/* AI Insights */}
        <Section title="AI Insights">
          <Card>
            {aiInsight ? (
              <Text style={{ fontSize: FontSize.md, color: colors.text, lineHeight: 22, padding: Spacing.md }}>{aiInsight}</Text>
            ) : (
              <Button title={insightLoading ? 'Analyzing...' : 'Get AI Insights'} onPress={getAiInsight} disabled={insightLoading} icon="sparkles" />
            )}
          </Card>
        </Section>

        {/* Notes */}
        <Section title="Notes" action={{ label: 'Add', onPress: () => router.push(`/note/create?dealId=${id}`) }}>
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

        <View style={{ marginTop: Spacing.lg, alignItems: 'center' }}>
          <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Created {formatDate(deal.createdAt)}</Text>
        </View>
      </ScrollView>
    </>
  );
}
