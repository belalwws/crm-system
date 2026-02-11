import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useIsDark } from '@/lib/utils';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';

const CLERK_KEY = Constants.expoConfig?.extra?.clerkPublishableKey || '';

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

function AuthGate() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const setToken = useAppStore((s) => s.setToken);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, isLoaded, segments]);

  // Set API token when signed in
  useEffect(() => {
    if (!isSignedIn) {
      api.setToken(null);
      setToken(null);
      return;
    }
    (async () => {
      const token = await getToken();
      api.setToken(token);
      setToken(token);
    })();
  }, [isSignedIn]);

  return <Slot />;
}

export default function RootLayout() {
  const isDark = useIsDark();

  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AuthGate />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
