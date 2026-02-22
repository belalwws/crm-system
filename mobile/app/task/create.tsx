import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, Stack } from 'expo-router';
import api from '@/lib/api';
import { useThemeColors } from '@/lib/utils';
import { Card, Button, Input } from '@/components/ui';
import { FontSize, Spacing } from '@/lib/theme';
import type { Customer, Deal } from '@/lib/types';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

export default function CreateTaskScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM', status: 'PENDING',
    dueDate: '', customerId: '', dealId: '',
  });

  useEffect(() => {
    (async () => {
      const token = await getToken(); api.setToken(token);
      const [custRes, dealsRes] = await Promise.all([api.getCustomers({}), api.getDeals({})]);
      if (custRes.success) setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
      if (dealsRes.success) setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
    })();
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    setLoading(true);
    try {
      const token = await getToken(); api.setToken(token);
      const res = await api.createTask({
        title: form.title, description: form.description,
        priority: form.priority as Task['priority'],
        status: form.status as Task['status'],
        dueDate: form.dueDate || undefined,
        customerId: form.customerId || undefined, dealId: form.dealId || undefined,
      });
      if (res.success) router.back();
      else Alert.alert('Error', res.error || 'Failed');
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <>
      <Stack.Screen options={{ title: 'New Task' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Input label="Title *" placeholder="Task title" value={form.title} onChangeText={v => update('title', v)} />
          <Input label="Description" placeholder="Task description..." value={form.description} onChangeText={v => update('description', v)} multiline numberOfLines={3} />
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

          {customers.length > 0 && (
            <>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>Customer (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <Button title="None" variant={!form.customerId ? 'primary' : 'outline'} onPress={() => update('customerId', '')} style={{ flex: 0 }} />
                  {customers.slice(0, 10).map(c => (
                    <Button key={c.id} title={c.name} variant={form.customerId === c.id ? 'primary' : 'outline'} onPress={() => update('customerId', c.id)} style={{ flex: 0 }} />
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {deals.length > 0 && (
            <>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>Deal (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <Button title="None" variant={!form.dealId ? 'primary' : 'outline'} onPress={() => update('dealId', '')} style={{ flex: 0 }} />
                  {deals.slice(0, 10).map(d => (
                    <Button key={d.id} title={d.title} variant={form.dealId === d.id ? 'primary' : 'outline'} onPress={() => update('dealId', d.id)} style={{ flex: 0 }} />
                  ))}
                </View>
              </ScrollView>
            </>
          )}
        </Card>
        <Button title={loading ? 'Creating...' : 'Create Task'} onPress={handleSave} disabled={loading} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </>
  );
}
