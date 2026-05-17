import { SafeAreaView, ScrollView, Text, View } from 'react-native';

import { useData } from '@/lib/data-loader';
import {
  COLLECTION_CATEGORIES,
  formatNextCollection,
  getAllNextCollections,
} from '@/lib/schedule-calculator';
import { useUserSettings } from '@/lib/user-settings';
import type { CollectionCategoryId } from '@/types';

export default function HomeScreen() {
  const data = useData();
  const { settings, isHydrated } = useUserSettings();

  // 表示地区: 設定値があればそれ、なければ最初の地区にフォールバック（診断用）
  const displayAreaId = settings.areaId ?? data.areas.areas[0]?.id ?? null;
  const displayArea = data.areas.areas.find((a) => a.id === displayAreaId) ?? null;
  const pattern = displayArea ? data.patterns.patterns[displayArea.patternId] : undefined;

  // カテゴリ名マップ（CollectionCategoryId → 表示名）
  const categoryNameMap = data.categories.categories.reduce<Record<string, string>>(
    (acc, c) => {
      acc[c.id] = c.name;
      return acc;
    },
    {},
  );
  const collectionLabels = COLLECTION_CATEGORIES.reduce<Record<CollectionCategoryId, string>>(
    (acc, id) => {
      acc[id] = categoryNameMap[id] ?? id;
      return acc;
    },
    {} as Record<CollectionCategoryId, string>,
  );

  const nextCollections = pattern ? getAllNextCollections(pattern, collectionLabels) : [];

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

        {/* schedule-calculator 動作確認用（18_schedule_screen で本実装される） */}
        <View className="rounded-2xl border border-ink-200 p-4 gap-2">
          <Text className="text-sm text-ink-500">
            次回収集日（地区: {displayAreaId ?? '—'}
            {settings.areaId === null && ' / 診断用フォールバック'}）
          </Text>
          {displayArea && (
            <Text className="text-xs text-ink-500">{displayArea.name}</Text>
          )}
          {pattern ? (
            nextCollections.map((nc) => (
              <View key={nc.categoryId} className="flex-row justify-between">
                <Text className="text-base text-ink-900">{nc.categoryName}</Text>
                <Text className="text-base text-ink-900">
                  {formatNextCollection(nc.date)}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-base text-warn-600">
              パターン未確定（patternId: {displayArea?.patternId}）
            </Text>
          )}
          <Text className="text-xs text-ink-500 mt-2">
            ※ 祝日休止は MVP 未対応。曜日ベースの計算結果のみ。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
