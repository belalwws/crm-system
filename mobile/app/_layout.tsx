import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Image, Text, useColorScheme } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '@/lib/theme';
import { useIsDark, useThemeColors } from '@/lib/utils';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { FontSize, FontWeight, BorderRadius } from '@/lib/theme';

// Read Clerk key from environment variable
const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

// Secure token cache for Clerk
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
};

// Standalone loading splash - no external hooks to avoid issues during init
function SplashLoading() {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Image
        source={require('@/assets/logo.png')}
        style={{ width: 120, height: 120, borderRadius: 20, marginBottom: 24 }}
        resizeMode="contain"
      />
      <Text style={{
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
      }}>
        Nexus CRM
      </Text>
      <ActivityIndicator size="large" color={colors.text} />
      <Text style={{
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 16,
      }}>
        Loading...
      </Text>
    </View>
  );
}

function AuthGate() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const setToken = useAppStore((s) => s.setToken);
  const demoToken = useAppStore((s) => s.demoToken);
  const [isNavigating, setIsNavigating] = useState(false);

  // Consider user "authenticated" if Clerk is signed in OR demo mode is active
  const isAuthenticated = isSignedIn || !!demoToken;

  useEffect(() => {
    if (!isLoaded || isNavigating) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isAuthenticated && inAuthGroup) {
      setIsNavigating(true);
      router.replace('/(tabs)');
      setTimeout(() => setIsNavigating(false), 500);
    } else if (!isAuthenticated && !inAuthGroup) {
      setIsNavigating(true);
      router.replace('/(auth)/sign-in');
      setTimeout(() => setIsNavigating(false), 500);
    }
  }, [isAuthenticated, isLoaded, segments]);

  // Set API token when signed in via Clerk
  useEffect(() => {
    // Don't clear token if demo mode is active
    if (demoToken) return;

    if (!isSignedIn) {
      api.setToken(null);
      setToken(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!cancelled) {
          api.setToken(token);
          setToken(token);
          if (!token) {
            console.warn('[AuthGate] getToken returned null despite isSignedIn=true');
          }
        }
      } catch (err) {
        console.error('[AuthGate] Failed to get token:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [isSignedIn, demoToken]);

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return <SplashLoading />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';

  // Show error if no Clerk key
  if (!CLERK_KEY) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: 'red', textAlign: 'center' }}>
          Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env file
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGate />
    </ClerkProvider>
  );
}
