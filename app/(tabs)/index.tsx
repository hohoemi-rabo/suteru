import { SafeAreaView, ScrollView, Text, View } from 'react-native';

import { useData } from '@/lib/data-loader';
import { useUserSettings } from '@/lib/user-settings';

export default function HomeScreen() {
  const data = useData();
  const { settings, isHydrated } = useUserSettings();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="px-4 py-6 gap-6">
        <View>
          <Text className="text-2xl text-ink-900 font-bold">これどう捨てる？</Text>
          <Text className="mt-2 text-base text-ink-500">飯田市のごみ分別を、写真一枚で。</Text>
        </View>

        <View className="rounded-2xl bg-brand-100 px-4 py-3">
          <Text className="text-brand-600 text-lg">ベータ版 - 開発中</Text>
        </View>

        {/* データローダー動作確認用（14_home_screen で本実装される） */}
        <View className="rounded-2xl border border-ink-200 p-4 gap-2">
          <Text className="text-sm text-ink-500">データローダー稼働確認</Text>
          <Text className="text-base text-ink-900">version: {data.meta.version}</Text>
          <Text className="text-base text-ink-900">source: {data.source}</Text>
          <Text className="text-base text-ink-900">地区数: {data.areas.areas.length}</Text>
          <Text className="text-base text-ink-900">
            カテゴリ数: {data.categories.categories.length}
          </Text>
          <Text className="text-base text-ink-900">品目数: {data.items.items.length}</Text>
          <Text className="text-base text-ink-900">
            収集パターン数: {Object.keys(data.patterns.patterns).length}
          </Text>
          <Text className="text-xs text-ink-500 mt-2">{data.meta.disclaimer}</Text>
        </View>

        {/* UserSettings 動作確認用（21_settings_screen で本実装される） */}
        <View className="rounded-2xl border border-ink-200 p-4 gap-2">
          <Text className="text-sm text-ink-500">UserSettings 稼働確認</Text>
          <Text className="text-base text-ink-900">
            areaId: {settings.areaId ?? '未設定'}
          </Text>
          <Text className="text-base text-ink-900">
            通知: {settings.notificationsEnabled ? 'ON' : 'OFF'}
          </Text>
          <Text className="text-base text-ink-900">通知時刻: {settings.notificationTime}</Text>
          <Text className="text-base text-ink-900">
            hydrated: {isHydrated ? 'yes' : 'no'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
