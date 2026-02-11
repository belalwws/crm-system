import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { LoadingScreen } from '@/components/ui';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <LoadingScreen />;

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
