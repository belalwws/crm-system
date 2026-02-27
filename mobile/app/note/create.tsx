import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useAuthToken } from '@/lib/utils';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import api from '@/lib/api';
import { useThemeColors } from '@/lib/utils';
import { Card, Button, Input } from '@/components/ui';
import { Spacing } from '@/lib/theme';

export default function CreateNoteScreen() {
  const colors = useThemeColors();
  const { getAuthToken } = useAuthToken();
  const router = useRouter();
  const params = useLocalSearchParams<{ customerId?: string; dealId?: string; taskId?: string }>();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  const handleSave = async () => {
    if (!form.content.trim()) { Alert.alert('Error', 'Content is required'); return; }
    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await api.createNote({
        title: form.title, content: form.content,
        customerId: params.customerId || undefined,
        dealId: params.dealId || undefined,
        taskId: params.taskId || undefined,
      });
      if (res.success) router.back();
      else Alert.alert('Error', res.error || 'Failed');
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New Note' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <Card style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Input label="Title" placeholder="Note title (optional)" value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} />
          <Input label="Content *" placeholder="Write your note..." value={form.content} onChangeText={v => setForm(p => ({ ...p, content: v }))} multiline numberOfLines={8} style={{ minHeight: 200 }} />
        </Card>
        <Button title={loading ? 'Saving...' : 'Save Note'} onPress={handleSave} disabled={loading} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </>
  );
}
