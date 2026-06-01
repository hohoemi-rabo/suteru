import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import ScreenBackground from '@/components/ScreenBackground';

import LinkedText from '@/components/LinkedText';
import { detectArea } from '@/lib/area-detector';
import { handleDetectionResultWithConfirm } from '@/lib/area-detection-ui';
import { buildCategoryMaps } from '@/lib/category-maps';
import { useData } from '@/lib/data-loader';
import {
  getNextStationCollection,
  type NextStationDate,
} from '@/lib/recycle-station-utils';
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
  Category,
  CategoryId,
  CollectionCategoryId,
  FacilitiesData,
  Item,
  RecycleStationsData,
} from '@/types';

const COLLECTION_CATEGORY_SET = new Set<CategoryId>(COLLECTION_CATEGORIES);

/** カテゴリごとに参照すべき施設の purpose 文字列（部分一致） */
const FACILITY_PURPOSE_HINTS: Partial<
  Record<Exclude<CategoryId, CollectionCategoryId>, string>
> = {
  home_appliances: '家電リサイクル法対象品の引取業者',
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
  const { settings, setAreaId } = useUserSettings();
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

  const { colorMap, nameMap } = buildCategoryMaps(data.categories);

  const area = data.areas.areas.find((a) => a.id === settings.areaId) ?? null;
  const pattern =
    area && area.patternId !== 'TBD_NEEDS_VERIFICATION'
      ? data.patterns.patterns[area.patternId]
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
      handleDetectionResultWithConfirm(result, area, setAreaId);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <ScreenBackground edges={['top']}>
      <Header onPressBack={handleBack} />
      <ScrollView contentContainerClassName="px-4 pb-8 gap-4">
        <ItemDetailCard
          item={item}
          color={colorMap[item.categoryId] ?? '#475569'}
          categoryName={nameMap[item.categoryId] ?? item.categoryId}
        />

        {isCollection ? (
          <CollectionSection
            nextDate={nextDate}
            area={area}
            isDetecting={isDetecting}
            onDetectHere={() => void handleDetectHere()}
            onChangeArea={() => router.replace('/(tabs)/settings')}
          />
        ) : (
          <SpecialHandlingSection
            categoryId={item.categoryId as Exclude<CategoryId, CollectionCategoryId>}
            categories={data.categories}
            recycleStations={data.recycleStations}
            facilities={data.facilities}
          />
        )}

        <Pressable
          onPress={handleHome}
          accessibilityRole="button"
          accessibilityLabel="ホームに戻る"
          className="min-h-11 rounded-full bg-brand-500 px-6 py-3 items-center justify-center"
        >
          <Text className="text-lg text-white font-bold">ホームに戻る</Text>
        </Pressable>

        <Footer
          disclaimer={data.meta.disclaimer}
          onPressOfficial={handleOpenOfficial}
        />
      </ScrollView>
    </ScreenBackground>
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
        <Ionicons name="chevron-back" size={24} color="#0F172A" />
      </Pressable>
      <Text className="text-xl text-ink-900 font-bold flex-1">品目の詳細</Text>
      <View className="rounded-full bg-brand-100 px-2 py-0.5 mr-2">
        <Text className="text-xs text-brand-600">ベータ版</Text>
      </View>
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
    <View className="rounded-2xl bg-bg shadow-card p-5 gap-3">
      <View className="self-start rounded-full px-3 py-1.5" style={{ backgroundColor: color }}>
        <Text className="text-sm text-white font-bold">{categoryName}</Text>
      </View>
      <Text className="text-2xl text-ink-900 font-bold">{item.name}</Text>
      <LinkedText
        text={item.instruction}
        className="text-base text-ink-900 leading-relaxed"
      />
      {item.warnings.length > 0 && (
        <View className="rounded-xl bg-warn-100 p-3 gap-1">
          {item.warnings.map((w) => (
            <Text key={w} className="text-base text-warn-600">⚠ {w}</Text>
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
  area,
  isDetecting,
  onDetectHere,
  onChangeArea,
}: {
  nextDate: Date | null;
  area: Area | null;
  isDetecting: boolean;
  onDetectHere: () => void;
  onChangeArea: () => void;
}) {
  return (
    <View className="gap-3">
      <View className="rounded-2xl bg-bg shadow-card p-4 gap-2">
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
        <Text className="text-sm text-ink-500">
          地区: {area?.name ?? '未設定'}
        </Text>
      </View>

      <View className="gap-2">
        <Pressable
          onPress={onDetectHere}
          disabled={isDetecting}
          accessibilityRole="button"
          accessibilityLabel="現在地から地区を判定して設定を更新"
          className={`min-h-11 rounded-full px-4 py-3 items-center justify-center ${
            isDetecting ? 'bg-ink-200' : 'bg-accent-600'
          }`}
        >
          <Text className={`text-base font-bold ${isDetecting ? 'text-ink-500' : 'text-white'}`}>
            {isDetecting ? '現在地を取得中…' : '現在地から地区を設定'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onChangeArea}
          accessibilityRole="link"
          className="flex-row items-center gap-1 self-end"
        >
          <Text className="text-sm text-brand-600 underline">地区を変更（設定へ）</Text>
          <Ionicons name="chevron-forward" size={14} color="#166534" />
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================
// セクション: 特別ルール（カテゴリ別、データ駆動 + リンク導線）
// ============================================================

function SpecialHandlingSection({
  categoryId,
  categories,
  recycleStations,
  facilities,
}: {
  categoryId: Exclude<CategoryId, CollectionCategoryId>;
  categories: CategoriesData;
  recycleStations: RecycleStationsData;
  facilities: FacilitiesData;
}) {
  const category = categories.categories.find((c) => c.id === categoryId);
  // 万一カテゴリ定義が見つからない場合のフォールバック
  if (!category) {
    return (
      <View className="rounded-2xl bg-bg shadow-card p-4 gap-2">
        <Text className="text-sm text-ink-500">出し方</Text>
        <Text className="text-base text-ink-900">この品目の詳細は準備中です。</Text>
      </View>
    );
  }

  if (categoryId === 'bottle_pet') {
    const next = getNextStationCollection(recycleStations);
    return (
      <BottlePetSection
        category={category}
        next={next}
        onPressDetails={() => router.push('/recycle-stations')}
      />
    );
  }

  const relevantFacilities = pickRelevantFacilities(facilities, categoryId);
  return (
    <CategoryRuleSection
      category={category}
      facilities={relevantFacilities}
      onPressFacilities={
        relevantFacilities.length > 0
          ? () => router.push('/(tabs)/facilities')
          : null
      }
    />
  );
}

function BottlePetSection({
  category,
  next,
  onPressDetails,
}: {
  category: Category;
  next: NextStationDate | null;
  onPressDetails: () => void;
}) {
  return (
    <View className="rounded-2xl bg-bg shadow-card p-4 gap-3">
      <View className="gap-1">
        <Text className="text-sm text-ink-500">出し方</Text>
        <Text className="text-base text-ink-900 font-bold">
          リサイクルステーションへ
        </Text>
      </View>

      <Text className="text-sm text-ink-900 leading-relaxed">
        {category.description}
      </Text>

      {next ? (
        <View className="rounded-xl bg-accent-50 px-3 py-3 gap-1">
          <Text className="text-sm text-ink-500">次の開催</Text>
          <Text className="text-lg text-ink-900 font-bold">
            {formatNextCollection(next.date)}
          </Text>
          <Text className="text-sm text-ink-900">
            {next.group.label} グループ（{next.group.schedulePattern}）
          </Text>
        </View>
      ) : (
        <View className="rounded-xl bg-warn-100 px-3 py-3">
          <Text className="text-sm text-warn-600">
            今年度の開催はすべて終了しました。
          </Text>
        </View>
      )}

      {category.notes.length > 0 && (
        <View className="gap-1">
          {category.notes.map((note) => (
            <Text key={note} className="text-sm text-ink-500 leading-relaxed">
              ・{note}
            </Text>
          ))}
        </View>
      )}

      <Pressable
        onPress={onPressDetails}
        accessibilityRole="link"
        accessibilityLabel="リサイクルステーションの詳細を見る"
        className="min-h-11 rounded-full bg-accent-600 px-4 py-3 flex-row items-center justify-center gap-2"
      >
        <Text className="text-base text-white font-bold">
          リサイクルステーションを見る
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function CategoryRuleSection({
  category,
  facilities,
  onPressFacilities,
}: {
  category: Category;
  facilities: ReturnType<typeof pickRelevantFacilities>;
  onPressFacilities: (() => void) | null;
}) {
  return (
    <View className="rounded-2xl bg-bg shadow-card p-4 gap-3">
      <View className="gap-1">
        <Text className="text-sm text-ink-500">出し方</Text>
        <Text className="text-base text-ink-900 font-bold">{category.name}</Text>
      </View>

      <Text className="text-sm text-ink-900 leading-relaxed">
        {category.description}
      </Text>

      {category.notes.length > 0 && (
        <View className="gap-1">
          {category.notes.map((note) => (
            <Text key={note} className="text-sm text-ink-900 leading-relaxed">
              ・{note}
            </Text>
          ))}
        </View>
      )}

      {facilities.length > 0 && (
        <View className="rounded-xl bg-ink-200/30 px-3 py-3 gap-2">
          <Text className="text-sm text-ink-500">関連する連絡先</Text>
          {facilities.map((f) => (
            <FacilityQuickRow key={f.id} name={f.name} phone={f.phone} />
          ))}
        </View>
      )}

      {onPressFacilities && (
        <Pressable
          onPress={onPressFacilities}
          accessibilityRole="link"
          accessibilityLabel="施設一覧を見る"
          className="flex-row items-center gap-1 self-end"
        >
          <Text className="text-sm text-brand-600 underline">施設一覧を見る</Text>
          <Ionicons name="chevron-forward" size={14} color="#166534" />
        </Pressable>
      )}
    </View>
  );
}

function FacilityQuickRow({ name, phone }: { name: string; phone: string }) {
  const handleCall = async () => {
    const tel = `tel:${phone.replace(/[^0-9+]/g, '')}`;
    try {
      await Linking.openURL(tel);
    } catch {
      Alert.alert('電話を発信できませんでした', phone);
    }
  };

  return (
    <View className="flex-row items-center justify-between gap-2">
      <Text className="flex-1 text-sm text-ink-900" numberOfLines={1}>
        {name}
      </Text>
      <Pressable
        onPress={handleCall}
        accessibilityRole="button"
        accessibilityLabel={`${name}に電話する`}
        className="flex-row items-center gap-1 rounded-full bg-brand-500 px-3 py-1.5"
      >
        <Ionicons name="call" size={12} color="#FFFFFF" />
        <Text className="text-sm text-white font-bold">{phone}</Text>
      </Pressable>
    </View>
  );
}

function pickRelevantFacilities(
  facilities: FacilitiesData,
  categoryId: Exclude<CategoryId, CollectionCategoryId>,
) {
  const hint = FACILITY_PURPOSE_HINTS[categoryId];
  if (!hint) return [];
  return facilities.facilities.filter((f) => f.purpose.includes(hint));
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
    <ScreenBackground edges={['top']}>
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
          className="min-h-11 rounded-full bg-brand-500 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-white font-bold">文字検索を試す</Text>
        </Pressable>
        <Pressable
          onPress={onPressOfficial}
          accessibilityRole="link"
          className="flex-row items-center gap-1 self-center"
        >
          <Text className="text-sm text-brand-600 underline">飯田市公式サイトを開く</Text>
          <Ionicons name="open-outline" size={14} color="#166534" />
        </Pressable>
        <Pressable
          onPress={onHome}
          className="min-h-11 rounded-full border-2 border-ink-200 px-4 py-3 items-center justify-center"
        >
          <Text className="text-base text-ink-500">ホームに戻る</Text>
        </Pressable>
      </ScrollView>
    </ScreenBackground>
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
// ヘルパー
// ============================================================

function findItem(items: Item[], rawName: string): Item | null {
  if (!rawName) return null;
  const q = normalizeJa(rawName);
  return items.find((it) => normalizeJa(it.name) === q) ?? null;
}

