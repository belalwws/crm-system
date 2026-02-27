import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useAuthToken } from '@/lib/utils';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, formatDate } from '@/lib/utils';
import { Card, Section, Badge, LoadingScreen, Button, Divider } from '@/components/ui';
import { FontSize, Spacing } from '@/lib/theme';
import type { Meeting } from '@/lib/types';

export default function MeetingDetailScreen() {
  const colors = useThemeColors();
  const { getAuthToken } = useAuthToken();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await api.getMeeting(id!);
      if (res.success && res.data) setMeeting(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id, getAuthToken]);

  useEffect(() => { fetchData(); }, []);

  const handleDelete = () => {
    Alert.alert('Delete Meeting', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const token = await getAuthToken();
        await api.deleteMeeting(id!); router.back();
      }},
    ]);
  };

  if (loading || !meeting) return <LoadingScreen />;

  const isUpcoming = new Date(meeting.startTime) > new Date();

  return (
    <>
      <Stack.Screen options={{
        title: meeting.title,
        headerRight: () => (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        <Card style={{ padding: Spacing.xl, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: (isUpcoming ? '#22c55e' : '#6b7280') + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="calendar" size={32} color={isUpcoming ? '#22c55e' : '#6b7280'} />
          </View>
          <Text style={{ fontSize: FontSize.xxl, fontWeight: '700', color: colors.text, marginTop: Spacing.md, textAlign: 'center' }}>{meeting.title}</Text>
          <Badge label={isUpcoming ? 'Upcoming' : 'Past'} color={isUpcoming ? '#22c55e' : '#6b7280'} style={{ marginTop: Spacing.sm }} />
        </Card>

        <Section title="Details">
          <Card style={{ padding: Spacing.lg, gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={{ fontSize: FontSize.md, color: colors.text }}>{formatDate(meeting.startTime)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={{ fontSize: FontSize.md, color: colors.text }}>
                {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {meeting.endTime ? ` - ${new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
              </Text>
            </View>
            {meeting.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={{ fontSize: FontSize.md, color: colors.text }}>{meeting.location}</Text>
              </View>
            )}
            {meeting.description && (
              <>
                <Divider />
                <Text style={{ fontSize: FontSize.md, color: colors.text, lineHeight: 22 }}>{meeting.description}</Text>
              </>
            )}
          </Card>
        </Section>
      </ScrollView>
    </>
  );
}
