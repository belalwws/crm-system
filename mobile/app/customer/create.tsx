import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, Stack } from 'expo-router';
import api from '@/lib/api';
import type { Customer } from '@/lib/types';
import { useThemeColors } from '@/lib/utils';
import { Card, Button, Input } from '@/components/ui';
import { FontSize, Spacing } from '@/lib/theme';

const STATUSES = ['LEAD', 'ACTIVE', 'INACTIVE'];

export default function CreateCustomerScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', address: '', industry: '', website: '', status: 'LEAD', notes: '',
  });

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    setLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.createCustomer({ ...form, status: form.status as Customer['status'] });
      if (res.success) {
        router.back();
      } else {
        Alert.alert('Error', res.error || 'Failed to create customer');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <>
      <Stack.Screen options={{ title: 'New Customer' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Input label="Name *" placeholder="Customer name" value={form.name} onChangeText={v => update('name', v)} />
          <Input label="Email" placeholder="email@example.com" value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Phone" placeholder="+1 234 567 890" value={form.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" />
          <Input label="Company" placeholder="Company name" value={form.company} onChangeText={v => update('company', v)} />
          <Input label="Industry" placeholder="e.g. Technology" value={form.industry} onChangeText={v => update('industry', v)} />
          <Input label="Website" placeholder="https://..." value={form.website} onChangeText={v => update('website', v)} autoCapitalize="none" keyboardType="url" />
          <Input label="Address" placeholder="Full address" value={form.address} onChangeText={v => update('address', v)} multiline />

          <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginTop: Spacing.sm }}>Status</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {STATUSES.map(s => (
              <Button key={s} title={s} variant={form.status === s ? 'primary' : 'outline'} onPress={() => update('status', s)} style={{ flex: 0 }} />
            ))}
          </View>

          <Input label="Notes" placeholder="Additional notes..." value={form.notes} onChangeText={v => update('notes', v)} multiline numberOfLines={4} />
        </Card>

        <Button title={loading ? 'Creating...' : 'Create Customer'} onPress={handleSave} disabled={loading} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </>
  );
}
