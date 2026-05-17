import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { detectArea, type DetectionResult } from '@/lib/area-detector';
import { useData } from '@/lib/data-loader';
import {
  COLLECTION_CATEGORIES,
  formatNextCollection,
  getNextCollectionDate,
} from '@/lib/schedule-calculator';
import { normalizeJa } from '@/lib/text-search';
import { useUserSettings } from '@/lib/user-settings';
import type {
  Area,
  CategoriesData,
  CategoryId,
  CollectionCategoryId,
  Item,
} from '@/types';

const COLLECTION_CATEGORY_SET = new Set<CategoryId>(COLLECTION_CATEGORIES);

const SPECIAL_HANDLING: Record<
  Exclude<CategoryId, CollectionCategoryId>,
  { label: string; hint: string }
> = {
  bottle_pet: {
    label: 'リサイクルステーションへ',
    hint: '毎月決まった日にリサイクルステーション（ア〜ク）に持ち込みます。袋のまま入れず分別してください。',
  },
  oversized: {
    label: '大型ごみ',
    hint: '1m × 1m × 30cm を超える大きさのものは集積所に出せません。クリーンセンターへの持ち込みまたは個別申込が必要です。',
  },
  home_appliances: {
    label: '家電リサイクル法対象',
    hint: 'テレビ・冷蔵庫・冷凍庫・洗濯機・衣類乾燥機・エアコンは家電リサイクル法により、引取業者へ依頼します。',
  },
  pc: {
    label: 'パソコン回収',
    hint: 'メーカー回収または小型家電回収ボックス（市役所など）へ。',
  },
  small_appliances: {
    label: '小型家電回収ボックスへ',
    hint: '市役所などに設置された回収ボックスに入れてください。',
  },
  plastic_product: {
    label: 'プラ製品（プラ資源とは別袋）',
    hint: '指定のプラ製品袋に入れて出します。プラスチック資源とは別の袋で出してください。',
  },
  not_accepted: {
    label: '飯田市では受け付けていません',
    hint: '販売店または専門業者にご相談ください。',
  },
};

// ============================================================
// メイン画面
// ============================================================

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    identifiedName?: string;
    source?: 'camera' | 'search';
  }>();
  const data = useData();
  const { settings } = useUserSettings();
  const [overrideAreaId, setOverrideAreaId] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const rawName = params.identifiedName ?? '';
  const item = findItem(data.items.items, rawName);

  const handleBack = () => router.back();
  const handleHome = () => router.replace('/(tabs)');
  const handleOpenOfficial = async () => {
    try {
      await Linking.openURL(data.meta.officialUrl);
    } catch {
      Alert.alert('リンクを開けませんでした', data.meta.officialUrl);
    }
  };
  const handleGoToSearch = () => router.replace('/search');

  // 辞書外フォールバック
  if (!item) {
    return (
      <NotInDictionary
        rawName={rawName}
        onBack={handleBack}
        onSearch={handleGoToSearch}
        onHome={handleHome}
        onPressOfficial={handleOpenOfficial}
      />
    );
  }

  const colorMap = buildCategoryColorMap(data.categories);
  const nameMap = buildCategoryNameMap(data.categories);

  const effectiveAreaId = overrideAreaId ?? settings.areaId;
  const effectiveArea =
    data.areas.areas.find((a) => a.id === effectiveAreaId) ?? null;
  const pattern =
    effectiveArea && effectiveArea.patternId !== 'TBD_NEEDS_VERIFICATION'
      ? data.patterns.patterns[effectiveArea.patternId]
      : undefined;

  const isCollection = COLLECTION_CATEGORY_SET.has(item.categoryId);
  const nextDate =
    isCollection && pattern
      ? getNextCollectionDate(pattern[item.categoryId as CollectionCategoryId])
      : null;

  const handleDetectHere = async () => {
    setIsDetecting(true);
    try {
      const result = await detectArea(data.areas.areas);
      handleDetectionResult(result, setOverrideAreaId);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <Header onPressBack={handleBack} />
      <ScrollView contentContainerClassName="px-4 pb-8 gap-4">
        <ItemDetailCard
          item={item}
          color={colorMap[item.categoryId] ?? '#6B7280'}
          categoryName={nameMap[item.categoryId] ?? item.categoryId}
        />

        {isCollection ? (
          <CollectionSection
            nextDate={nextDate}
            effectiveArea={effectiveArea}
            overrideAreaId={overrideAreaId}
            isDetecting={isDetecting}
            onDetectHere={() => void handleDetectHere()}
            onClearOverride={() => setOverrideAreaId(null)}
            onChangeArea={() => router.replace('/(tabs)/settings')}
          />
        ) : (
          <SpecialHandlingSection
            categoryId={item.categoryId as Exclude<CategoryId, CollectionCategoryId>}
          />
        )}

        <Pressable
          onPress={handleHome}
          accessibilityRole="button"
          accessibilityLabel="ホームに戻る"
          className="min-h-11 rounded-xl bg-brand-500 px-6 py-3 items-center justify-center"
        >
          <Text className="text-lg text-white font-bold">ホームに戻る</Text>
        </Pressable>

        <Footer
          disclaimer={data.meta.disclaimer}
          onPressOfficial={handleOpenOfficial}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// セクション: ヘッダー
// ============================================================

function Header({ onPressBack }: { onPressBack: () => void }) {
  return (
    <View className="flex-row items-center gap-2 px-2 pt-2 pb-4">
      <Pressable
        onPress={onPressBack}
        accessibilityRole="button"
        accessibilityLabel="戻る"
        className="w-11 h-11 items-center justify-center rounded-full"
      >
        <Ionicons name="chevron-back" size={24} color="#1F2937" />
      </Pressable>
      <Text className="text-xl text-ink-900 font-bold">品目の詳細</Text>
    </View>
  );
}

// ============================================================
// セクション: 品目詳細カード
// ============================================================

function ItemDetailCard({
  item,
  color,
  categoryName,
}: {
  item: Item;
  color: string;
  categoryName: string;
}) {
  return (
    <View className="rounded-2xl border border-ink-200 p-5 gap-3">
      <View className="self-start rounded-full px-3 py-1.5" style={{ backgroundColor: color }}>
        <Text className="text-sm text-white font-bold">{categoryName}</Text>
      </View>
      <Text className="text-2xl text-ink-900 font-bold">{item.name}</Text>
      <Text className="text-base text-ink-900 leading-relaxed">{item.instruction}</Text>
      {item.warnings.length > 0 && (
        <View className="rounded-xl bg-warn-100 p-3 gap-1">
          {item.warnings.map((w) => (
            <Text key={w} className="text-sm text-warn-600">⚠ {w}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================
// セクション: 定期収集（次回日 + 現在地で確認）
// ============================================================

function CollectionSection({
  nextDate,
  effectiveArea,
  overrideAreaId,
  isDetecting,
  onDetectHere,
  onClearOverride,
  onChangeArea,
}: {
  nextDate: Date | null;
  effectiveArea: Area | null;
  overrideAreaId: string | null;
  isDetecting: boolean;
  onDetectHere: () => void;
  onClearOverride: () => void;
  onChangeArea: () => void;
}) {
  return (
    <View className="gap-3">
      {overrideAreaId && (
        <View className="rounded-xl bg-accent-500/15 px-3 py-2 flex-row items-center gap-2">
          <Ionicons name="location" size={14} color="#0EA5E9" />
          <Text className="flex-1 text-sm text-ink-900">
            現在地: {effectiveArea?.name ?? '—'}（一時的）
          </Text>
          <Pressable
            onPress={onClearOverride}
            accessibilityRole="button"
            accessibilityLabel="地区を元に戻す"
          >
            <Text className="text-sm text-accent-500 underline">解除</Text>
          </Pressable>
        </View>
      )}

      <View className="rounded-2xl border border-ink-200 p-4 gap-2">
        <Text className="text-sm text-ink-500">次回収集日</Text>
        {nextDate ? (
          <Text className="text-2xl text-ink-900 font-bold">
            {formatNextCollection(nextDate)}
          </Text>
        ) : (
          <Text className="text-base text-warn-600">
            このエリアの収集パターンは準備中です。
          </Text>
        )}
        <Text className="text-xs text-ink-500">
          地区: {effectiveArea?.name ?? '未設定'}
        </Text>
      </View>

      <View className="gap-2">
        <Pressable
          onPress={onDetectHere}
          disabled={isDetecting}
          accessibilityRole="button"
          accessibilityLabel="現在地で確認"
          className={`min-h-11 rounded-xl px-4 py-3 items-center justify-center ${
            isDetecting ? 'bg-ink-200' : 'bg-accent-500'
          }`}
        >
          <Text className={`text-base font-bold ${isDetecting ? 'text-ink-500' : 'text-white'}`}>
            {isDetecting ? '現在地を取得中…' : '現在地で確認'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onChangeArea}
          accessibilityRole="link"
          className="flex-row items-center gap-1 self-end"
        >
          <Text className="text-sm text-brand-600 underline">地区を変更（設定へ）</Text>
          <Ionicons name="chevron-forward" size={14} color="#16A34A" />
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================
// セクション: 特別ルール
// ============================================================

function SpecialHandlingSection({
  categoryId,
}: {
  categoryId: Exclude<CategoryId, CollectionCategoryId>;
}) {
  const handling = SPECIAL_HANDLING[categoryId];
  return (
    <View className="rounded-2xl border border-ink-200 p-4 gap-2">
      <Text className="text-sm text-ink-500">出し方</Text>
      <Text className="text-base text-ink-900 font-bold">{handling.label}</Text>
      <Text className="text-sm text-ink-900 leading-relaxed">{handling.hint}</Text>
      <Text className="text-xs text-ink-500">
        ※ 詳細な施設情報は近日公開予定です。
      </Text>
    </View>
  );
}

// ============================================================
// セクション: 辞書外フォールバック
// ============================================================

function NotInDictionary({
  rawName,
  onBack,
  onSearch,
  onHome,
  onPressOfficial,
}: {
  rawName: string;
  onBack: () => void;
  onSearch: () => void;
  onHome: () => void;
  onPressOfficial: () => void;
}) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <Header onPressBack={onBack} />
      <ScrollView contentContainerClassName="px-4 pb-8 gap-4">
        <View className="rounded-2xl bg-warn-100 p-5 gap-3">
          <Text className="text-xl text-warn-600 font-bold">
            「{rawName || '指定なし'}」は辞書にありません
          </Text>
          <Text className="text-sm text-ink-900 leading-relaxed">
            この品目はまだ辞書に収録されていません。
            別の言い方で文字検索を試すか、公式情報でご確認ください。
          </Text>
        </View>
        <Pressable
          onPress={onSearch}
          className="min-h-11 rounded-xl bg-brand-500 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-white font-bold">文字検索を試す</Text>
        </Pressable>
        <Pressable
          onPress={onPressOfficial}
          accessibilityRole="link"
          className="flex-row items-center gap-1 self-center"
        >
          <Text className="text-sm text-brand-600 underline">飯田市公式サイトを開く</Text>
          <Ionicons name="open-outline" size={14} color="#16A34A" />
        </Pressable>
        <Pressable
          onPress={onHome}
          className="min-h-11 rounded-xl border-2 border-ink-200 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-ink-500">ホームに戻る</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// セクション: フッター
// ============================================================

function Footer({
  disclaimer,
  onPressOfficial,
}: {
  disclaimer: string;
  onPressOfficial: () => void;
}) {
  return (
    <View className="rounded-2xl bg-ink-200/30 px-4 py-3 gap-2">
      <Text className="text-xs text-ink-500 leading-relaxed">{disclaimer}</Text>
      <Pressable
        onPress={onPressOfficial}
        accessibilityRole="link"
        className="flex-row items-center gap-1"
      >
        <Text className="text-sm text-brand-600 underline">飯田市公式サイトを開く</Text>
        <Ionicons name="open-outline" size={14} color="#16A34A" />
      </Pressable>
    </View>
  );
}

// ============================================================
// ヘルパー
// ============================================================

function findItem(items: Item[], rawName: string): Item | null {
  if (!rawName) return null;
  const q = normalizeJa(rawName);
  return items.find((it) => normalizeJa(it.name) === q) ?? null;
}

function buildCategoryColorMap(data: CategoriesData): Record<CategoryId, string> {
  return data.categories.reduce<Record<CategoryId, string>>((acc, c) => {
    acc[c.id] = c.color;
    return acc;
  }, {} as Record<CategoryId, string>);
}

function buildCategoryNameMap(data: CategoriesData): Record<CategoryId, string> {
  return data.categories.reduce<Record<CategoryId, string>>((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {} as Record<CategoryId, string>);
}

function handleDetectionResult(
  result: DetectionResult,
  setOverrideAreaId: (id: string) => void,
): void {
  if (!result.ok) {
    if (result.error === 'permission_denied') {
      Alert.alert(
        '位置情報の許可が必要です',
        '端末の設定アプリ → アプリ → 位置情報 で許可してください。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '設定を開く', onPress: () => void Linking.openSettings() },
        ],
      );
    } else {
      Alert.alert('位置情報を取得できませんでした', detectionErrorLabel(result.error));
    }
    return;
  }
  if (result.area === null) {
    Alert.alert(
      '対応エリア外です',
      `最寄り地区まで ${result.nearestDistanceKm.toFixed(1)} km。設定の地区はそのままです。`,
    );
    return;
  }
  setOverrideAreaId(result.area.id);
}

function detectionErrorLabel(error: string): string {
  switch (error) {
    case 'timeout':
      return '位置情報の取得がタイムアウトしました。電波状況をご確認ください。';
    case 'unavailable':
      return 'この端末では位置情報が利用できません。';
    default:
      return '不明なエラーが発生しました。';
  }
}
