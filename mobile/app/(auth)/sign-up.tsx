import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/lib/utils';
import { Input, Button } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';

export default function SignUpScreen() {
  const colors = useThemeColors();
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const handleSignUp = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const [firstName, ...rest] = name.trim().split(' ');
      await signUp.create({
        emailAddress: email,
        password,
        firstName: firstName || '',
        lastName: rest.join(' ') || '',
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  }, [name, email, password, isLoaded]);

  const handleVerify = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }, [code, isLoaded]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 64, height: 64, borderRadius: BorderRadius.xl,
            backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="business" size={32} color="#fff" />
          </View>
          <Text style={{ fontSize: FontSize.xxl, fontWeight: '800', color: colors.text }}>
            {pendingVerification ? 'Verify Email' : 'Create Account'}
          </Text>
          <Text style={{ fontSize: FontSize.md, color: colors.textSecondary, marginTop: 4 }}>
            {pendingVerification
              ? 'Enter the code sent to your email'
              : 'Start managing your business today'}
          </Text>
        </View>

        <View style={{ gap: Spacing.lg }}>
          {error !== '' && (
            <View style={{
              backgroundColor: colors.dangerLight, padding: Spacing.md,
              borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 8,
            }}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={{ color: colors.danger, fontSize: FontSize.sm, flex: 1 }}>{error}</Text>
            </View>
          )}

          {pendingVerification ? (
            <>
              <Input
                label="Verification Code"
                value={code}
                onChangeText={setCode}
                placeholder="Enter 6-digit code"
                keyboardType="numeric"
                icon="key-outline"
              />
              <Button title="Verify" onPress={handleVerify} loading={loading} size="lg" />
            </>
          ) : (
            <>
              <Input label="Full Name" value={name} onChangeText={setName} placeholder="John Doe" icon="person-outline" />
              <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" icon="mail-outline" />
              <Input label="Password" value={password} onChangeText={setPassword} placeholder="Min 8 characters" secureTextEntry icon="lock-closed-outline" />
              <Button title="Create Account" onPress={handleSignUp} loading={loading} size="lg" />
            </>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.md }}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: FontSize.md }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
