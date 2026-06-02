import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { Palette } from '@/constants/Colors';

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
    <ScreenBackground edges={['top', 'bottom']}>
      <View className="flex-1 px-6 pt-6 pb-8 justify-between">
        <View className="gap-1">
          <Text className="text-sm text-muted">2 / 2</Text>
          <Text className="text-2xl text-body font-bold">通知を有効にしますか？</Text>
        </View>

        <View className="items-center gap-6 my-8">
          <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center">
            <Ionicons name="notifications" size={48} color={Palette.green[600]} />
          </View>
          <View className="gap-3 px-4">
            <Text className="text-base text-body text-center leading-relaxed">
              収集日の前日夜にお知らせします。
            </Text>
            <Text className="text-sm text-muted text-center leading-relaxed">
              「明日は燃やすごみの日です」のような通知が届きます。後でいつでも設定から変更できます。
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <Pressable
            onPress={handleEnable}
            disabled={isRequesting}
            className="min-h-11 rounded-full bg-green-400 px-6 py-3 items-center justify-center"
          >
            <Text className="text-lg text-white font-bold">
              {isRequesting ? '...' : '通知を有効にする'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSkip}
            disabled={isRequesting}
            className="min-h-11 rounded-full border-2 border-line px-6 py-3 items-center justify-center"
          >
            <Text className="text-lg text-muted">後で</Text>
          </Pressable>
        </View>
      </View>
    </ScreenBackground>
  );
}
