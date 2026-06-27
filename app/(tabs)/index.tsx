import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import ScreenBackground from '@/components/ScreenBackground';

import AreaSelectorRow from '@/components/AreaSelectorRow';
import BetaBadge from '@/components/BetaBadge';
import CalendarModal from '@/components/CalendarModal';
import { FontSize, Palette } from '@/constants/Colors';
import {
  getConfiguredApiUrl,
  identifyItem,
  type IdentifyResult,
} from '@/lib/api';
import { detectArea, type DetectionResult } from '@/lib/area-detector';
import { buildCategoryMaps } from '@/lib/category-maps';
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
  const [calendarOpen, setCalendarOpen] = useState(false);

  const currentArea = data.areas.areas.find((a) => a.id === settings.areaId) ?? null;
  const pattern =
    currentArea && currentArea.patternId !== 'TBD_NEEDS_VERIFICATION'
      ? data.patterns.patterns[currentArea.patternId]
      : undefined;
  const { nameMap: categoryLabelMap, colorMap: categoryColorMap } =
    buildCategoryMaps(data.categories);

  const handleCameraPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/camera');
  };

  const handleOpenCalendar = async () => {
    await Haptics.selectionAsync();
    setCalendarOpen(true);
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
    <ScreenBackground edges={['top']} colors={[Palette.green[100], Palette.bg.surface]}>
      <ScrollView contentContainerClassName="pb-6">
        <HomeHeader area={currentArea} onPressArea={handleAreaPress} />
        <View className="px-4 gap-6">
          <SearchBarStub onPress={handleSearchPress} />
          <CameraHeroButton onPress={handleCameraPress} />
          <CalendarButton onPress={() => void handleOpenCalendar()} />
          <FooterLinks
            notice={data.meta.betaNotice}
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

      <CalendarModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        pattern={pattern}
        categoryLabelMap={categoryLabelMap}
        categoryColorMap={categoryColorMap}
      />
    </ScreenBackground>
  );
}

// ============================================================
// サブコンポーネント
// ============================================================

function HomeHeader({ area, onPressArea }: { area: Area | null; onPressArea: () => void }) {
  return (
    <View className="px-4 pt-2 pb-4 gap-3">
      {/* 1 行目: アプリ名 + ベータ版 */}
      <View className="flex-row items-center gap-2">
        <Text className="text-green-900 font-bold" style={{ fontSize: FontSize.title }}>
          これどう捨てる？
        </Text>
        <BetaBadge />
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
      className="flex-row items-center gap-2 min-h-12 rounded-full border border-line bg-bg px-5"
    >
      <Ionicons name="search" size={20} color={Palette.text.tertiary} />
      <Text className="flex-1 text-hint" style={{ fontSize: FontSize.body }}>
        品目名で探す（例: ペットボトル）
      </Text>
    </Pressable>
  );
}

function CameraHeroButton({ onPress }: { onPress: () => void }) {
  return (
    <View className="items-center my-2 gap-3">
      <Pressable
        onPress={onPress}
        accessibilityLabel="写真で調べる"
        accessibilityRole="button"
        className="rounded-full bg-green-400 items-center justify-center"
        style={{ width: 188, height: 188 }}
      >
        <Ionicons name="camera" size={60} color="white" />
        <Text className="mt-2 text-white font-bold" style={{ fontSize: 20 }}>
          写真でしらべる
        </Text>
      </Pressable>
      <Text className="text-green-600 font-medium" style={{ fontSize: FontSize.body }}>
        ごみを撮るだけで分別が分かる
      </Text>
    </View>
  );
}

function CalendarButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="収集カレンダーを開く"
      className="flex-row items-center gap-3 rounded-2xl bg-bg border border-line px-4 py-3.5 shadow-card"
    >
      <View className="w-11 h-11 rounded-full bg-blue-50 items-center justify-center">
        <Ionicons name="calendar" size={24} color={Palette.blue[600]} />
      </View>
      <View className="flex-1">
        <Text className="text-body font-bold" style={{ fontSize: FontSize.subtitle }}>
          収集カレンダー
        </Text>
        <Text className="text-muted" style={{ fontSize: FontSize.small }}>
          今月のごみ収集日をまとめて見る
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Palette.text.tertiary} />
    </Pressable>
  );
}

function FooterLinks({
  notice,
  onPressOfficial,
}: {
  notice: string;
  onPressOfficial: () => void;
}) {
  return (
    <View className="rounded-2xl bg-bg border border-line px-4 py-3 gap-1.5">
      <View className="flex-row gap-2">
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={Palette.text.tertiary}
          style={{ marginTop: 1 }}
        />
        <Text className="flex-1 text-muted leading-relaxed" style={{ fontSize: FontSize.small }}>
          {notice}
        </Text>
      </View>
      <Pressable
        onPress={onPressOfficial}
        accessibilityRole="link"
        accessibilityLabel="飯田市公式サイトで確認"
        className="flex-row items-center gap-0.5 self-start pl-6"
      >
        <Text className="text-blue-600 underline" style={{ fontSize: FontSize.small }}>
          公式サイトで確認
        </Text>
        <Ionicons name="chevron-forward" size={13} color={Palette.blue[600]} />
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
      <View className="rounded-xl bg-danger-bg px-3 py-2">
        <Text className="text-sm text-danger">
          以下は開発ビルドのみ表示される診断パネルです
        </Text>
      </View>

      <View className="rounded-2xl bg-bg shadow-card p-4 gap-2">
        <Text className="text-sm text-muted">データローダー</Text>
        <Text className="text-base text-body">version: {data.meta.version}</Text>
        <Text className="text-base text-body">source: {data.source}</Text>
        <Text className="text-base text-body">地区数: {data.areas.areas.length}</Text>
        <Text className="text-base text-body">
          カテゴリ数: {data.categories.categories.length}
        </Text>
        <Text className="text-base text-body">品目数: {data.items.items.length}</Text>
        <Text className="text-base text-body">
          収集パターン数: {Object.keys(data.patterns.patterns).length}
        </Text>
      </View>

      <View className="rounded-2xl bg-bg shadow-card p-4 gap-2">
        <Text className="text-sm text-muted">UserSettings</Text>
        <Text className="text-base text-body">areaId: {settings.areaId ?? '未設定'}</Text>
        <Text className="text-base text-body">
          通知: {settings.notificationsEnabled ? 'ON' : 'OFF'}
        </Text>
        <Text className="text-base text-body">通知時刻: {settings.notificationTime}</Text>
        <Text className="text-base text-body">hydrated: {isHydrated ? 'yes' : 'no'}</Text>
      </View>

      <View className="rounded-2xl bg-bg shadow-card p-4 gap-2">
        <Text className="text-sm text-muted">
          次回収集日（地区: {displayAreaId ?? '—'}
          {settings.areaId === null && ' / フォールバック'}）
        </Text>
        {displayArea && <Text className="text-xs text-muted">{displayArea.name}</Text>}
        {pattern ? (
          nextCollections.map((nc) => (
            <View key={nc.categoryId} className="flex-row justify-between">
              <Text className="text-base text-body">{nc.categoryName}</Text>
              <Text className="text-base text-body">{formatNextCollection(nc.date)}</Text>
            </View>
          ))
        ) : (
          <Text className="text-base text-danger">パターン未確定</Text>
        )}
      </View>

      <View className="rounded-2xl bg-bg shadow-card p-4 gap-2">
        <Text className="text-sm text-muted">地区判定（GPS）</Text>
        <Pressable
          onPress={handleDetect}
          disabled={detection.status === 'loading'}
          className="min-h-11 rounded-full bg-green-400 px-4 py-2 items-center justify-center"
        >
          <Text className="text-base text-white">
            {detection.status === 'loading' ? '判定中…' : '現在地で判定'}
          </Text>
        </Pressable>
        {detection.status === 'done' && <DetectionResultView result={detection.result} />}
      </View>

      <View className="rounded-2xl bg-bg shadow-card p-4 gap-2">
        <Text className="text-sm text-muted">Worker 疎通確認</Text>
        <Text className="text-xs text-muted">
          URL: {getConfiguredApiUrl() ?? '未設定（EXPO_PUBLIC_API_URL）'}
        </Text>
        <Pressable
          onPress={() => {
            void handlePingApi();
          }}
          disabled={pingState.status === 'loading'}
          className="min-h-11 rounded-full bg-green-400 px-4 py-2 items-center justify-center"
        >
          <Text className="text-base text-white">
            {pingState.status === 'loading' ? '送信中…' : '1×1 PNG を /api/identify に投げる'}
          </Text>
        </Pressable>
        {pingState.status === 'done' && <PingResultView result={pingState.result} />}
      </View>

      <View className="rounded-2xl bg-bg shadow-card p-4 gap-2">
        <Text className="text-sm text-muted">通知スケジュール</Text>
        <Text className="text-base text-body">
          予約済み: {scheduledCount === null ? '—' : `${scheduledCount} 件`}
        </Text>
        <Pressable
          onPress={() => {
            void refreshScheduledCount();
          }}
          className="min-h-11 rounded-full bg-green-400 px-4 py-2 items-center justify-center"
        >
          <Text className="text-base text-white">再読込</Text>
        </Pressable>
      </View>

      <View className="rounded-2xl border border-danger p-4 gap-2">
        <Text className="text-sm text-danger">設定リセット</Text>
        <Pressable
          onPress={onReset}
          className="min-h-11 rounded-full border-2 border-danger px-4 py-2 items-center justify-center"
        >
          <Text className="text-base text-danger">
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
      <Text className="text-base text-danger">
        ERR {result.errorCode}: {result.userMessage}
      </Text>
    );
  }
  if (result.identifiedName === null) {
    return (
      <Text className="text-base text-body">
        OK: null（{result.reason}）
      </Text>
    );
  }
  return (
    <Text className="text-base text-body">OK: {result.identifiedName}</Text>
  );
}

function DetectionResultView({ result }: { result: DetectionResult }) {
  if (!result.ok) {
    return (
      <Text className="text-base text-danger">
        エラー: {detectionErrorLabel(result.error)}
      </Text>
    );
  }
  if (result.area === null) {
    return (
      <View className="gap-1">
        <Text className="text-base text-danger">対応エリア外</Text>
        <Text className="text-sm text-muted">
          最寄り地区まで {result.nearestDistanceKm.toFixed(2)} km
        </Text>
      </View>
    );
  }
  return (
    <View className="gap-1">
      <Text className="text-base text-body">
        {result.area.name}（{result.area.id}）
      </Text>
      <Text className="text-sm text-muted">距離: {result.distanceKm.toFixed(2)} km</Text>
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
