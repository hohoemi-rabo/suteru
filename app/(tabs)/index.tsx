import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AreaSelectorRow from '@/components/AreaSelectorRow';
import {
  getConfiguredApiUrl,
  identifyItem,
  type IdentifyResult,
} from '@/lib/api';
import { detectArea, type DetectionResult } from '@/lib/area-detector';
import { useData } from '@/lib/data-loader';
import { getScheduledCount } from '@/lib/notifications';
import {
  COLLECTION_CATEGORIES,
  formatNextCollection,
  getAllNextCollections,
} from '@/lib/schedule-calculator';
import { useUserSettings } from '@/lib/user-settings';
import type { Area, CollectionCategoryId } from '@/types';

export default function HomeScreen() {
  const data = useData();
  const { settings, isHydrated, reset } = useUserSettings();
  const router = useRouter();

  const currentArea = data.areas.areas.find((a) => a.id === settings.areaId) ?? null;

  const handleCameraPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/camera');
  };

  const handleSearchPress = () => {
    router.push('/search');
  };

  const handleAreaPress = async () => {
    await Haptics.selectionAsync();
    router.push('/(tabs)/settings');
  };

  const handleOpenOfficial = async () => {
    try {
      await Linking.openURL(data.meta.officialUrl);
    } catch {
      Alert.alert('リンクを開けませんでした', data.meta.officialUrl);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="pb-6">
        <HomeHeader area={currentArea} onPressArea={handleAreaPress} />
        <View className="px-4 gap-6">
          <SearchBarStub onPress={handleSearchPress} />
          <CameraHeroButton onPress={handleCameraPress} />
          <FooterLinks
            disclaimer={data.meta.disclaimer}
            onPressOfficial={handleOpenOfficial}
          />
        </View>
        {__DEV__ && (
          <DevDiagnostics
            data={data}
            settings={settings}
            isHydrated={isHydrated}
            onReset={() => {
              void reset();
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// サブコンポーネント
// ============================================================

function HomeHeader({ area, onPressArea }: { area: Area | null; onPressArea: () => void }) {
  return (
    <View className="px-4 pt-2 pb-4 gap-2">
      {/* 1 行目: アプリ名 + ベータ版 */}
      <View className="flex-row items-end gap-2">
        <Text className="text-xl text-ink-900 font-bold">これどう捨てる？</Text>
        <View className="rounded-full bg-brand-100 px-2 py-0.5 mb-0.5">
          <Text className="text-xs text-brand-600">ベータ版</Text>
        </View>
      </View>
      {/* 2 行目: 地区セレクタ（目立つ専用行） */}
      <AreaSelectorRow area={area} onPress={onPressArea} />
    </View>
  );
}

function SearchBarStub({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="品目を文字で検索"
      accessibilityRole="button"
      className="flex-row items-center gap-2 min-h-12 rounded-xl border border-ink-200 bg-bg px-4"
    >
      <Ionicons name="search" size={20} color="#6B7280" />
      <Text className="text-base text-ink-500 flex-1">
        品目名で探す（例: ペットボトル）
      </Text>
    </Pressable>
  );
}

function CameraHeroButton({ onPress }: { onPress: () => void }) {
  return (
    <View className="items-center my-4">
      <Pressable
        onPress={onPress}
        accessibilityLabel="写真で調べる"
        accessibilityRole="button"
        className="w-[70%] aspect-square rounded-3xl bg-brand-500 items-center justify-center"
      >
        <Ionicons name="camera" size={72} color="white" />
        <Text className="mt-4 text-2xl text-white font-bold">写真でしらべる</Text>
        <Text className="mt-1 text-sm text-white opacity-90">
          ごみを撮るだけで分別が分かる
        </Text>
      </Pressable>
    </View>
  );
}

function FooterLinks({
  disclaimer,
  onPressOfficial,
}: {
  disclaimer: string;
  onPressOfficial: () => void;
}) {
  return (
    <View className="rounded-2xl bg-ink-200/30 px-4 py-3 gap-2">
      <Text className="text-sm text-ink-500 leading-relaxed">{disclaimer}</Text>
      <Pressable
        onPress={onPressOfficial}
        accessibilityRole="link"
        className="flex-row items-center gap-1"
      >
        <Text className="text-sm text-brand-600 underline">飯田市公式サイトを開く</Text>
        <Ionicons name="open-outline" size={14} color="#166534" />
      </Pressable>
    </View>
  );
}

// ============================================================
// 開発時のみ表示する診断パネル
// ============================================================

type DetectionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: DetectionResult };

type PingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: IdentifyResult };

// 1×1 透明 PNG（疎通確認用、画像内容自体に意味はない）
const PING_TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function DevDiagnostics({
  data,
  settings,
  isHydrated,
  onReset,
}: {
  data: ReturnType<typeof useData>;
  settings: ReturnType<typeof useUserSettings>['settings'];
  isHydrated: boolean;
  onReset: () => void;
}) {
  const [detection, setDetection] = useState<DetectionState>({ status: 'idle' });
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);
  const [pingState, setPingState] = useState<PingState>({ status: 'idle' });

  const handlePingApi = async () => {
    setPingState({ status: 'loading' });
    const result = await identifyItem(PING_TINY_PNG_BASE64, 'image/png');
    setPingState({ status: 'done', result });
  };

  const refreshScheduledCount = async () => {
    setScheduledCount(await getScheduledCount());
  };

  useEffect(() => {
    void refreshScheduledCount();
  }, [settings.notificationsEnabled, settings.notificationTime, settings.areaId]);

  const displayAreaId = settings.areaId ?? data.areas.areas[0]?.id ?? null;
  const displayArea = data.areas.areas.find((a) => a.id === displayAreaId) ?? null;
  const pattern = displayArea ? data.patterns.patterns[displayArea.patternId] : undefined;

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

  const handleDetect = async () => {
    setDetection({ status: 'loading' });
    const result = await detectArea(data.areas.areas);
    setDetection({ status: 'done', result });
  };

  return (
    <View className="px-4 mt-8 gap-4">
      <View className="rounded-xl bg-warn-100 px-3 py-2">
        <Text className="text-sm text-warn-600">
          以下は開発ビルドのみ表示される診断パネルです
        </Text>
      </View>

      <View className="rounded-2xl border border-ink-200 p-4 gap-2">
        <Text className="text-sm text-ink-500">データローダー</Text>
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
      </View>

      <View className="rounded-2xl border border-ink-200 p-4 gap-2">
        <Text className="text-sm text-ink-500">UserSettings</Text>
        <Text className="text-base text-ink-900">areaId: {settings.areaId ?? '未設定'}</Text>
        <Text className="text-base text-ink-900">
          通知: {settings.notificationsEnabled ? 'ON' : 'OFF'}
        </Text>
        <Text className="text-base text-ink-900">通知時刻: {settings.notificationTime}</Text>
        <Text className="text-base text-ink-900">hydrated: {isHydrated ? 'yes' : 'no'}</Text>
      </View>

      <View className="rounded-2xl border border-ink-200 p-4 gap-2">
        <Text className="text-sm text-ink-500">
          次回収集日（地区: {displayAreaId ?? '—'}
          {settings.areaId === null && ' / フォールバック'}）
        </Text>
        {displayArea && <Text className="text-xs text-ink-500">{displayArea.name}</Text>}
        {pattern ? (
          nextCollections.map((nc) => (
            <View key={nc.categoryId} className="flex-row justify-between">
              <Text className="text-base text-ink-900">{nc.categoryName}</Text>
              <Text className="text-base text-ink-900">{formatNextCollection(nc.date)}</Text>
            </View>
          ))
        ) : (
          <Text className="text-base text-warn-600">パターン未確定</Text>
        )}
      </View>

      <View className="rounded-2xl border border-ink-200 p-4 gap-2">
        <Text className="text-sm text-ink-500">地区判定（GPS）</Text>
        <Pressable
          onPress={handleDetect}
          disabled={detection.status === 'loading'}
          className="min-h-11 rounded-xl bg-brand-500 px-4 py-2 items-center justify-center"
        >
          <Text className="text-base text-white">
            {detection.status === 'loading' ? '判定中…' : '現在地で判定'}
          </Text>
        </Pressable>
        {detection.status === 'done' && <DetectionResultView result={detection.result} />}
      </View>

      <View className="rounded-2xl border border-ink-200 p-4 gap-2">
        <Text className="text-sm text-ink-500">Worker 疎通確認</Text>
        <Text className="text-xs text-ink-500">
          URL: {getConfiguredApiUrl() ?? '未設定（EXPO_PUBLIC_API_URL）'}
        </Text>
        <Pressable
          onPress={() => {
            void handlePingApi();
          }}
          disabled={pingState.status === 'loading'}
          className="min-h-11 rounded-xl bg-brand-500 px-4 py-2 items-center justify-center"
        >
          <Text className="text-base text-white">
            {pingState.status === 'loading' ? '送信中…' : '1×1 PNG を /api/identify に投げる'}
          </Text>
        </Pressable>
        {pingState.status === 'done' && <PingResultView result={pingState.result} />}
      </View>

      <View className="rounded-2xl border border-ink-200 p-4 gap-2">
        <Text className="text-sm text-ink-500">通知スケジュール</Text>
        <Text className="text-base text-ink-900">
          予約済み: {scheduledCount === null ? '—' : `${scheduledCount} 件`}
        </Text>
        <Pressable
          onPress={() => {
            void refreshScheduledCount();
          }}
          className="min-h-11 rounded-xl bg-brand-500 px-4 py-2 items-center justify-center"
        >
          <Text className="text-base text-white">再読込</Text>
        </Pressable>
      </View>

      <View className="rounded-2xl border border-warn-600 p-4 gap-2">
        <Text className="text-sm text-warn-600">設定リセット</Text>
        <Pressable
          onPress={onReset}
          className="min-h-11 rounded-xl border-2 border-warn-600 px-4 py-2 items-center justify-center"
        >
          <Text className="text-base text-warn-600">
            設定をリセット（オンボーディング再表示）
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function PingResultView({ result }: { result: IdentifyResult }) {
  if (!result.ok) {
    return (
      <Text className="text-base text-warn-600">
        ERR {result.errorCode}: {result.userMessage}
      </Text>
    );
  }
  if (result.identifiedName === null) {
    return (
      <Text className="text-base text-ink-900">
        OK: null（{result.reason}）
      </Text>
    );
  }
  return (
    <Text className="text-base text-ink-900">OK: {result.identifiedName}</Text>
  );
}

function DetectionResultView({ result }: { result: DetectionResult }) {
  if (!result.ok) {
    return (
      <Text className="text-base text-warn-600">
        エラー: {detectionErrorLabel(result.error)}
      </Text>
    );
  }
  if (result.area === null) {
    return (
      <View className="gap-1">
        <Text className="text-base text-warn-600">対応エリア外</Text>
        <Text className="text-sm text-ink-500">
          最寄り地区まで {result.nearestDistanceKm.toFixed(2)} km
        </Text>
      </View>
    );
  }
  return (
    <View className="gap-1">
      <Text className="text-base text-ink-900">
        {result.area.name}（{result.area.id}）
      </Text>
      <Text className="text-sm text-ink-500">距離: {result.distanceKm.toFixed(2)} km</Text>
    </View>
  );
}

function detectionErrorLabel(error: string): string {
  switch (error) {
    case 'permission_denied':
      return '位置情報の許可が必要です（設定アプリから許可してください）';
    case 'timeout':
      return '位置情報の取得がタイムアウトしました';
    case 'unavailable':
      return '位置情報が利用できません';
    default:
      return '不明なエラー';
  }
}
