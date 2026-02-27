import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform,
  TouchableOpacity, ActivityIndicator, TextInput, Image
} from 'react-native';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useThemeColors, useIsDark } from '@/lib/utils';
import { Button } from '@/components/ui';
import { FontSize, Spacing, BorderRadius, FontWeight } from '@/lib/theme';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';

// Required for OAuth flow
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: githubOAuth } = useOAuth({ strategy: 'oauth_github' });
  const router = useRouter();
  const setDemoAuth = useAppStore((s) => s.setDemoAuth);
  const setToken = useAppStore((s) => s.setToken);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  // Demo Login (bypasses Clerk, uses backend's local JWT auth)
  const handleDemoLogin = useCallback(async () => {
    setDemoLoading(true);
    setError('');
    try {
      const result = await api.demoLogin();
      if (result.ok && result.token && result.user) {
        api.setToken(result.token);
        setToken(result.token);
        setDemoAuth(result.token, result.user);
        router.replace('/(tabs)');
      } else {
        setError(result.message || 'Demo login failed. Is the backend running?');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  }, []);
  const handleSignIn = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else if (result.status === 'needs_first_factor') {
        setPendingVerification(true);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }, [email, password, isLoaded]);

  // OAuth Sign In (Google/GitHub)
  const handleOAuthSignIn = useCallback(async (provider: 'google' | 'github') => {
    if (!isLoaded) return;
    setOauthLoading(provider);
    setError('');

    try {
      const oauth = provider === 'google' ? googleOAuth : githubOAuth;
      const { createdSessionId, setActive: oauthSetActive } = await oauth({
        redirectUrl: Linking.createURL('/(tabs)', { scheme: 'nexuscrm' }),
      });

      if (createdSessionId) {
        await oauthSetActive!({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      setError(err.errors?.[0]?.message || `${provider} sign in failed`);
    } finally {
      setOauthLoading(null);
    }
  }, [isLoaded, googleOAuth, githubOAuth]);

  // Verification Code
  const handleVerification = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid verification code');
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
        {/* Decorative gradient circles (like frontend) */}
        <View style={{
          position: 'absolute', top: -100, right: -100, width: 200, height: 200,
          borderRadius: 100, backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(59,130,246,0.08)',
        }} />
        <View style={{
          position: 'absolute', bottom: -80, left: -80, width: 160, height: 160,
          borderRadius: 80, backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(251,146,60,0.08)',
        }} />

        {/* Logo & Title */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          {/* Welcome Badge */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: colors.card, borderRadius: BorderRadius.full,
            paddingHorizontal: 16, paddingVertical: 8,
            borderWidth: 1, borderColor: colors.border,
            marginBottom: 24,
          }}>
            <Ionicons name="sparkles" size={16} color="#f59e0b" />
            <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: colors.textSecondary }}>
              Welcome back
            </Text>
          </View>

          {/* Logo */}
          <Image
            source={require('@/assets/logo.png')}
            style={{
              width: 100, height: 100, borderRadius: BorderRadius.xl,
              marginBottom: 20,
            }}
            resizeMode="contain"
          />

          <Text style={{ fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: colors.text, marginBottom: 8 }}>
            Sign in to Nexus
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: FontSize.md, color: colors.textSecondary }}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: colors.text }}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: BorderRadius.xl,
          padding: Spacing.xxl,
          borderWidth: 1, borderColor: colors.border,
          shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.08, shadowRadius: 24, elevation: 8,
        }}>
          {pendingVerification ? (
            // Verification Code Form
            <View style={{ gap: Spacing.lg }}>
              <Text style={{ fontSize: FontSize.md, color: colors.textSecondary, textAlign: 'center' }}>
                Enter the code sent to your email
              </Text>
              <View style={{
                backgroundColor: colors.inputBg, borderRadius: BorderRadius.lg,
                borderWidth: 1, borderColor: colors.border, paddingHorizontal: Spacing.lg, height: 52,
                flexDirection: 'row', alignItems: 'center',
              }}>
                <Ionicons name="key-outline" size={18} color={colors.textTertiary} style={{ marginRight: 10 }} />
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="Enter verification code"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  style={{ flex: 1, color: colors.text, fontSize: FontSize.md }}
                />
              </View>
              {error !== '' && (
                <View style={{
                  backgroundColor: colors.dangerLight, padding: Spacing.md,
                  borderRadius: BorderRadius.lg, flexDirection: 'row', alignItems: 'center', gap: 8,
                }}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: FontSize.sm, flex: 1 }}>{error}</Text>
                </View>
              )}
              <Button title="Verify" onPress={handleVerification} loading={loading} size="lg" />
              <TouchableOpacity onPress={() => setPendingVerification(false)}>
                <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: FontSize.sm }}>
                  ← Back to sign in
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Main Sign In Form
            <View style={{ gap: Spacing.md }}>
              {/* OAuth Buttons */}
              <TouchableOpacity
                onPress={() => handleOAuthSignIn('google')}
                disabled={oauthLoading !== null}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  height: 48, borderRadius: BorderRadius.lg,
                  backgroundColor: colors.inputBg,
                  borderWidth: 1, borderColor: colors.border, gap: 10,
                }}
              >
                {oauthLoading === 'google' ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 20, fontWeight: '700' }}>
                        <Text style={{ color: '#4285F4' }}>G</Text>
                        <Text style={{ color: '#EA4335' }}>o</Text>
                        <Text style={{ color: '#FBBC05' }}>o</Text>
                        <Text style={{ color: '#4285F4' }}>g</Text>
                        <Text style={{ color: '#34A853' }}>l</Text>
                        <Text style={{ color: '#EA4335' }}>e</Text>
                      </Text>
                    </View>
                    <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.medium, color: colors.text }}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOAuthSignIn('github')}
                disabled={oauthLoading !== null}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  height: 48, borderRadius: BorderRadius.lg,
                  backgroundColor: colors.inputBg,
                  borderWidth: 1, borderColor: colors.border, gap: 10,
                }}
              >
                {oauthLoading === 'github' ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Ionicons name="logo-github" size={20} color={colors.text} />
                    <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.medium, color: colors.text }}>
                      Continue with GitHub
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 8 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary }}>or continue with email</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </View>

              {/* Error Message */}
              {error !== '' && (
                <View style={{
                  backgroundColor: colors.dangerLight, padding: Spacing.md,
                  borderRadius: BorderRadius.lg, flexDirection: 'row', alignItems: 'center', gap: 8,
                  borderWidth: 1, borderColor: colors.danger + '30',
                }}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: FontSize.sm, flex: 1 }}>{error}</Text>
                </View>
              )}

              {/* Email Input */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: colors.text }}>
                  Email
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: colors.inputBg, borderRadius: BorderRadius.lg,
                  borderWidth: 1, borderColor: colors.border,
                  paddingHorizontal: Spacing.lg, height: 48,
                }}>
                  <Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={{ marginRight: 10 }} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ flex: 1, color: colors.text, fontSize: FontSize.md }}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: colors.text }}>
                    Password
                  </Text>
                  <TouchableOpacity>
                    <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: colors.inputBg, borderRadius: BorderRadius.lg,
                  borderWidth: 1, borderColor: colors.border,
                  paddingHorizontal: Spacing.lg, height: 48,
                }}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={{ marginRight: 10 }} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showPassword}
                    style={{ flex: 1, color: colors.text, fontSize: FontSize.md }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <Button title="Sign In" onPress={handleSignIn} loading={loading} size="lg" style={{ marginTop: 8 }} />
            </View>
          )}
        </View>

        {/* Demo Login */}
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary }}>or try instantly</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>
          <TouchableOpacity
            onPress={handleDemoLogin}
            disabled={demoLoading}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              height: 52, borderRadius: BorderRadius.lg,
              backgroundColor: '#10b981',
              gap: 10,
            }}
          >
            {demoLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#fff" />
                <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: '#fff' }}>
                  Quick Demo Login
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary, textAlign: 'center', marginTop: 8 }}>
            Sign in as demo@nexuscrm.com with sample data
          </Text>
        </View>

        {/* Footer */}
        <Text style={{
          fontSize: FontSize.xs, color: colors.textTertiary,
          textAlign: 'center', marginTop: 24, lineHeight: 18,
        }}>
          By continuing, you agree to Nexus's{'\n'}
          <Text style={{ color: colors.textSecondary }}>Terms of Service</Text> and{' '}
          <Text style={{ color: colors.textSecondary }}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
