import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useAuthToken } from '@/lib/utils';
import { useRouter, Stack } from 'expo-router';
import api from '@/lib/api';
import { useThemeColors } from '@/lib/utils';
import { Card, Button, Input, LoadingScreen } from '@/components/ui';
import { FontSize, Spacing } from '@/lib/theme';
import type { Customer, DealStage } from '@/lib/types';

const STAGES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

export default function CreateDealScreen() {
  const colors = useThemeColors();
  const { getAuthToken } = useAuthToken();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    title: '', value: '', stage: 'LEAD', probability: '50', customerId: '', description: '', expectedCloseDate: '',
  });

  useEffect(() => {
    (async () => {
      const token = await getAuthToken();
      const res = await api.getCustomers({});
      if (res.success) setCustomers(Array.isArray(res.data) ? res.data : []);
    })();
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await api.createDeal({
        title: form.title,
        value: parseFloat(form.value) || 0,
        stage: form.stage as DealStage,
        probability: parseInt(form.probability) || 50,
        customerId: form.customerId || undefined,
        description: form.description,
        expectedCloseDate: form.expectedCloseDate || undefined,
      });
      if (res.success) router.back();
      else Alert.alert('Error', res.error || 'Failed to create deal');
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <>
      <Stack.Screen options={{ title: 'New Deal' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Input label="Title *" placeholder="Deal title" value={form.title} onChangeText={v => update('title', v)} />
          <Input label="Value ($)" placeholder="10000" value={form.value} onChangeText={v => update('value', v)} keyboardType="numeric" />
          <Input label="Probability (%)" placeholder="50" value={form.probability} onChangeText={v => update('probability', v)} keyboardType="numeric" />
          <Input label="Description" placeholder="Deal description..." value={form.description} onChangeText={v => update('description', v)} multiline numberOfLines={3} />
          <Input label="Expected Close Date" placeholder="YYYY-MM-DD" value={form.expectedCloseDate} onChangeText={v => update('expectedCloseDate', v)} />

          <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>Stage</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {STAGES.map(s => (
              <Button key={s} title={s.replace('_', ' ')} variant={form.stage === s ? 'primary' : 'outline'} onPress={() => update('stage', s)} style={{ flex: 0 }} />
            ))}
          </View>

          {customers.length > 0 && (
            <>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>Customer</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <Button title="None" variant={!form.customerId ? 'primary' : 'outline'} onPress={() => update('customerId', '')} style={{ flex: 0 }} />
                  {customers.map(c => (
                    <Button key={c.id} title={c.name} variant={form.customerId === c.id ? 'primary' : 'outline'} onPress={() => update('customerId', c.id)} style={{ flex: 0 }} />
                  ))}
                </View>
              </ScrollView>
            </>
          )}
        </Card>

        <Button title={loading ? 'Creating...' : 'Create Deal'} onPress={handleSave} disabled={loading} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </>
  );
}
