import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import api from '@/lib/api';
import { useThemeColors } from '@/lib/utils';
import { Card, Button, Input, LoadingScreen } from '@/components/ui';
import { FontSize, Spacing } from '@/lib/theme';
import type { Customer } from '@/lib/types';

const STATUSES = ['LEAD', 'PROSPECT', 'ACTIVE', 'INACTIVE'];

export default function EditCustomerScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', address: '', industry: '', website: '', status: 'LEAD', notes: '',
  });

  useEffect(() => {
    (async () => {
      const token = await getToken();
      api.setToken(token);
      const res = await api.getCustomer(id!);
      if (res.success && res.data) {
        setForm({
          name: res.data.name || '', email: res.data.email || '', phone: res.data.phone || '',
          company: res.data.company || '', address: res.data.address || '', industry: res.data.industry || '',
          website: res.data.website || '', status: res.data.status || 'LEAD', notes: res.data.notes || '',
        });
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    setSaving(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.updateCustomer(id!, { ...form, status: form.status as Customer['status'] });
      if (res.success) { router.back(); } else { Alert.alert('Error', res.error || 'Failed to update'); }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Customer' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Input label="Name *" value={form.name} onChangeText={v => update('name', v)} />
          <Input label="Email" value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Phone" value={form.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" />
          <Input label="Company" value={form.company} onChangeText={v => update('company', v)} />
          <Input label="Industry" value={form.industry} onChangeText={v => update('industry', v)} />
          <Input label="Website" value={form.website} onChangeText={v => update('website', v)} autoCapitalize="none" />
          <Input label="Address" value={form.address} onChangeText={v => update('address', v)} multiline />
          <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>Status</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {STATUSES.map(s => (
              <Button key={s} title={s} variant={form.status === s ? 'primary' : 'outline'} onPress={() => update('status', s)} style={{ flex: 0 }} />
            ))}
          </View>
          <Input label="Notes" value={form.notes} onChangeText={v => update('notes', v)} multiline numberOfLines={4} />
        </Card>
        <Button title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={saving} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </>
  );
}
