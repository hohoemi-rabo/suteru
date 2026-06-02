import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { FontSize, Palette } from '@/constants/Colors';
import { useUserSettings } from '@/lib/user-settings';

export default function TabLayout() {
  const { settings, isHydrated } = useUserSettings();

  // 永続化値の読み込み中は何も表示しない（AsyncStorage は数十ms）
  if (!isHydrated) return null;

  // 地区未設定ならオンボーディングへ強制リダイレクト
  if (!settings.areaId) return <Redirect href="/(onboarding)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.green[400],
        tabBarInactiveTintColor: Palette.text.tertiary,
        tabBarLabelStyle: { fontSize: FontSize.caption },
        tabBarStyle: {
          backgroundColor: Palette.bg.surface,
          borderTopColor: Palette.border.light,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: '収集日',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="facilities"
        options={{
          title: '施設',
          tabBarIcon: ({ color, size }) => <Ionicons name="location" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
