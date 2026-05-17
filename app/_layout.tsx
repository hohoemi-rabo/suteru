import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import 'react-native-reanimated';

import '../global.css';
import { DataProvider, useData, type AppData } from '@/lib/data-loader';
import {
  cancelAllScheduled,
  configureNotificationHandler,
  getPermissionStatus,
  rescheduleNotifications,
} from '@/lib/notifications';
import { COLLECTION_CATEGORIES } from '@/lib/schedule-calculator';
import { UserSettingsProvider, useUserSettings } from '@/lib/user-settings';
import type { CollectionCategoryId, UserSettings } from '@/types';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <DataProvider>
      <UserSettingsProvider>
        <NotificationsScheduler />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(onboarding)" />
        </Stack>
        <StatusBar style="dark" />
      </UserSettingsProvider>
    </DataProvider>
  );
}

// ============================================================
// 通知スケジューラ（lib/notifications.ts を Provider 配下から駆動）
// ============================================================

function NotificationsScheduler() {
  const data = useData();
  const { settings, isHydrated } = useUserSettings();

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    void syncSchedule(data, settings);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') void syncSchedule(data, settings);
    });
    return () => sub.remove();
  }, [
    isHydrated,
    settings,
    data,
  ]);

  return null;
}

async function syncSchedule(data: AppData, settings: UserSettings): Promise<void> {
  if (!settings.notificationsEnabled || !settings.areaId) {
    await cancelAllScheduled();
    return;
  }

  const area = data.areas.areas.find((a) => a.id === settings.areaId);
  const pattern =
    area && area.patternId !== 'TBD_NEEDS_VERIFICATION'
      ? data.patterns.patterns[area.patternId]
      : undefined;
  if (!pattern) {
    await cancelAllScheduled();
    return;
  }

  const status = await getPermissionStatus();
  if (status !== 'granted') {
    await cancelAllScheduled();
    return;
  }

  await rescheduleNotifications({
    pattern,
    categoryLabels: buildCategoryLabels(data),
    notificationTime: settings.notificationTime,
  });
}

function buildCategoryLabels(data: AppData): Record<CollectionCategoryId, string> {
  const nameMap = data.categories.categories.reduce<Record<string, string>>(
    (acc, c) => {
      acc[c.id] = c.name;
      return acc;
    },
    {},
  );
  return COLLECTION_CATEGORIES.reduce<Record<CollectionCategoryId, string>>(
    (acc, id) => {
      acc[id] = nameMap[id] ?? id;
      return acc;
    },
    {} as Record<CollectionCategoryId, string>,
  );
}
