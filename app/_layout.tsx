import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from '@/data/store';
import { colors } from '@/theme/tokens';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const onboarded = useAppStore((s) => s.onboarded);

  useEffect(() => {
    const inOnboarding = segments[0] === 'onboarding';
    if (!onboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboarded && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [onboarded, segments, router]);

  return <>{children}</>;
}

function HydrationBoot() {
  const hydrate = useAppStore((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <HydrationBoot />
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.cream },
              animation: 'slide_from_right',
            }}
          />
        </AuthGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
