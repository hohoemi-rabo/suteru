import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestPermission } from '@/lib/notifications';
import { useUserSettings } from '@/lib/user-settings';

export default function NotificationsScreen() {
  const { setNotificationsEnabled } = useUserSettings();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      await setNotificationsEnabled(granted);
    } finally {
      setIsRequesting(false);
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    await setNotificationsEnabled(false);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-6 pb-8 justify-between">
        <View className="gap-1">
          <Text className="text-sm text-ink-500">2 / 2</Text>
          <Text className="text-2xl text-ink-900 font-bold">通知を有効にしますか？</Text>
        </View>

        <View className="items-center gap-6 my-8">
          <View className="w-24 h-24 rounded-full bg-brand-100 items-center justify-center">
            <Ionicons name="notifications" size={48} color="#166534" />
          </View>
          <View className="gap-3 px-4">
            <Text className="text-base text-ink-900 text-center leading-relaxed">
              収集日の前日夜にお知らせします。
            </Text>
            <Text className="text-sm text-ink-500 text-center leading-relaxed">
              「明日は燃やすごみの日です」のような通知が届きます。後でいつでも設定から変更できます。
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <Pressable
            onPress={handleEnable}
            disabled={isRequesting}
            className="min-h-11 rounded-xl bg-brand-500 px-6 py-3 items-center justify-center"
          >
            <Text className="text-lg text-white font-bold">
              {isRequesting ? '...' : '通知を有効にする'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSkip}
            disabled={isRequesting}
            className="min-h-11 rounded-xl border-2 border-ink-200 px-6 py-3 items-center justify-center"
          >
            <Text className="text-lg text-ink-500">後で</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
