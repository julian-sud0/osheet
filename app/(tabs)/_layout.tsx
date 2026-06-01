import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { RadialFab } from '@/components/RadialFab';
import { colors } from '@/theme/tokens';

type IconName = 'home' | 'list' | 'trending-up' | 'user';

function tabIcon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Feather name={name} size={size ?? 22} color={color} />
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.cocoa,
          tabBarInactiveTintColor: colors.cocoa2,
          tabBarStyle: {
            backgroundColor: 'rgba(246,241,232,0.94)',
            borderTopColor: 'rgba(61,51,43,0.08)',
            height: 70,
            paddingBottom: 12,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: 2 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: tabIcon('home') }} />
        <Tabs.Screen name="timeline" options={{ title: 'Timeline', tabBarIcon: tabIcon('list') }} />
        <Tabs.Screen
          name="patterns"
          options={{ title: 'Patterns', tabBarIcon: tabIcon('trending-up') }}
        />
        <Tabs.Screen name="you" options={{ title: 'You', tabBarIcon: tabIcon('user') }} />
      </Tabs>

      {/* Persistent radial FAB — tap expands into Stool / Food / Meds / Stress;
          long-press is a fast path to /log/bristol. */}
      <RadialFab />
    </View>
  );
}
