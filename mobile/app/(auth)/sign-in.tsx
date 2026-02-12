import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/lib/utils';
import { Input, Button } from '@/components/ui';
import { FontSize, Spacing, BorderRadius, FontWeight } from '@/lib/theme';

export default function SignInScreen() {
  const colors = useThemeColors();
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, password, isLoaded]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View style={{
            width: 64, height: 64, borderRadius: BorderRadius.xl,
            backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Ionicons name="business" size={32} color={colors.primaryText} />
          </View>
          <Text style={{ fontSize: FontSize.xxxl, fontWeight: FontWeight.semibold, color: colors.text }}>
            Nexus CRM
          </Text>
          <Text style={{ fontSize: FontSize.md, color: colors.textSecondary, marginTop: 8 }}>
            Sign in to your account
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: Spacing.lg }}>
          {error !== '' && (
            <View style={{
              backgroundColor: colors.dangerLight, padding: Spacing.lg,
              borderRadius: BorderRadius.lg, flexDirection: 'row', alignItems: 'center', gap: 10,
              borderWidth: 1, borderColor: colors.danger + '30',
            }}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={{ color: colors.danger, fontSize: FontSize.sm, flex: 1 }}>{error}</Text>
            </View>
          )}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            icon="mail-outline"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            icon="lock-closed-outline"
          />

          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            size="lg"
          />
        </View>

        {/* Sign up link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.md }}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={{ color: colors.text, fontWeight: FontWeight.semibold, fontSize: FontSize.md }}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
