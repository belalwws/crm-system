import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, Stack } from 'expo-router';
import api from '@/lib/api';
import { useThemeColors } from '@/lib/utils';
import { Card, Button, Input } from '@/components/ui';
import { Spacing } from '@/lib/theme';

export default function CreateMeetingScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', location: '', startTime: '', endTime: '',
  });

  const handleSave = async () => {
    if (!form.title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    if (!form.startTime.trim()) { Alert.alert('Error', 'Start time is required'); return; }
    setLoading(true);
    try {
      const token = await getToken(); api.setToken(token);
      const res = await api.createMeeting({
        title: form.title, description: form.description, location: form.location,
        startTime: new Date(form.startTime).toISOString(),
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
      });
      if (res.success) router.back();
      else Alert.alert('Error', res.error || 'Failed');
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <>
      <Stack.Screen options={{ title: 'New Meeting' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <Card style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Input label="Title *" placeholder="Meeting title" value={form.title} onChangeText={v => update('title', v)} />
          <Input label="Description" placeholder="Meeting description..." value={form.description} onChangeText={v => update('description', v)} multiline />
          <Input label="Location" placeholder="Office, Zoom link, etc." value={form.location} onChangeText={v => update('location', v)} />
          <Input label="Start Time *" placeholder="YYYY-MM-DD HH:MM" value={form.startTime} onChangeText={v => update('startTime', v)} />
          <Input label="End Time" placeholder="YYYY-MM-DD HH:MM" value={form.endTime} onChangeText={v => update('endTime', v)} />
        </Card>
        <Button title={loading ? 'Creating...' : 'Create Meeting'} onPress={handleSave} disabled={loading} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </>
  );
}
