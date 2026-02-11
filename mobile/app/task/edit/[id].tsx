import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import api from '@/lib/api';
import { useThemeColors } from '@/lib/utils';
import { Card, Button, Input, LoadingScreen } from '@/components/ui';
import { FontSize, Spacing } from '@/lib/theme';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function EditTaskScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '',
  });

  useEffect(() => {
    (async () => {
      const token = await getToken(); api.setToken(token);
      const res = await api.getTask(id!);
      if (res.success && res.data) {
        const t = res.data;
        setForm({
          title: t.title || '', description: t.description || '', priority: t.priority || 'MEDIUM',
          status: t.status || 'TODO', dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
        });
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSave = async () => {
    if (!form.title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    setSaving(true);
    try {
      const token = await getToken(); api.setToken(token);
      const res = await api.updateTask(id!, {
        title: form.title, description: form.description, priority: form.priority,
        status: form.status, dueDate: form.dueDate || undefined,
      });
      if (res.success) router.back(); else Alert.alert('Error', res.error || 'Failed');
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  };

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));
  if (loading) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Task' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <Card style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Input label="Title *" value={form.title} onChangeText={v => update('title', v)} />
          <Input label="Description" value={form.description} onChangeText={v => update('description', v)} multiline />
          <Input label="Due Date" placeholder="YYYY-MM-DD" value={form.dueDate} onChangeText={v => update('dueDate', v)} />
          <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>Priority</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {PRIORITIES.map(p => (
              <Button key={p} title={p} variant={form.priority === p ? 'primary' : 'outline'} onPress={() => update('priority', p)} style={{ flex: 0 }} />
            ))}
          </View>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>Status</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {STATUSES.map(s => (
              <Button key={s} title={s.replace('_', ' ')} variant={form.status === s ? 'primary' : 'outline'} onPress={() => update('status', s)} style={{ flex: 0 }} />
            ))}
          </View>
        </Card>
        <Button title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={saving} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </>
  );
}
