import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useData } from '@/lib/data-loader';
import {
  getUpcomingStationDates,
  type NextStationDate,
} from '@/lib/recycle-station-utils';
import { formatNextCollection } from '@/lib/schedule-calculator';
import type { RecycleStationGroup, RecycleStationLocation } from '@/types';

export default function RecycleStationsScreen() {
  const data = useData();
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());

  const upcoming = getUpcomingStationDates(data.recycleStations);
  const next = upcoming[0] ?? null;

  // 次回開催日順に並べる（未開催なしのグループは末尾）
  const upcomingMap = new Map(upcoming.map((u) => [u.group.id, u]));
  const orderedGroups = [...data.recycleStations.groups].sort((a, b) => {
    const aDate = upcomingMap.get(a.id)?.date.getTime() ?? Number.POSITIVE_INFINITY;
    const bDate = upcomingMap.get(b.id)?.date.getTime() ?? Number.POSITIVE_INFINITY;
    return aDate - bDate;
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
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
      <Header onPressBack={() => router.back()} />
      <ScrollView contentContainerClassName="px-4 pb-8 gap-4">
        <InfoCard
          openTime={data.recycleStations.openTime}
          description={data.recycleStations.description}
          items={data.recycleStations.items}
          cancellationRule={data.recycleStations.cancellationRule}
        />

        {next && <NextOverallCard next={next} />}

        <View className="gap-3">
          <Text className="text-base text-ink-900 font-bold">グループ一覧（ア〜ク）</Text>
          <Text className="text-xs text-ink-500">
            次回開催日が近い順に表示しています。市内どこのステーションも利用できます。
          </Text>
          <View className="gap-2">
            {orderedGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                next={upcomingMap.get(group.id) ?? null}
                isExpanded={expandedGroupIds.has(group.id)}
                onToggle={() => toggleGroup(group.id)}
              />
            ))}
          </View>
        </View>

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
    <View className="flex-row items-center gap-2 px-2 pt-2 pb-3">
      <Pressable
        onPress={onPressBack}
        accessibilityRole="button"
        accessibilityLabel="戻る"
        className="w-11 h-11 items-center justify-center rounded-full"
      >
        <Ionicons name="chevron-back" size={24} color="#1F2937" />
      </Pressable>
      <Text className="text-xl text-ink-900 font-bold">リサイクルステーション</Text>
    </View>
  );
}

// ============================================================
// セクション: 情報カード（開催時間、品目、中止条件）
// ============================================================

function InfoCard({
  openTime,
  description,
  items,
  cancellationRule,
}: {
  openTime: string;
  description: string;
  items: string[];
  cancellationRule: string;
}) {
  return (
    <View className="rounded-2xl border border-accent-500/30 bg-accent-500/10 p-4 gap-3">
      <View className="flex-row items-center gap-2">
        <Ionicons name="information-circle" size={20} color="#0EA5E9" />
        <Text className="text-base text-ink-900 font-bold">市内どこでも利用できます</Text>
      </View>
      <Text className="text-sm text-ink-900 leading-relaxed">{description}</Text>

      <View className="gap-1">
        <Text className="text-xs text-ink-500">開催時間</Text>
        <Text className="text-base text-ink-900">{openTime}</Text>
      </View>

      <View className="gap-1">
        <Text className="text-xs text-ink-500">出せるもの</Text>
        <Text className="text-base text-ink-900">{items.join('・')}</Text>
      </View>

      <View className="rounded-xl bg-warn-100 px-3 py-2 flex-row items-start gap-2">
        <Ionicons name="warning" size={14} color="#DC2626" style={{ marginTop: 2 }} />
        <Text className="flex-1 text-xs text-warn-600 leading-relaxed">
          {cancellationRule}
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// セクション: 全体の次回開催ハイライト
// ============================================================

function NextOverallCard({ next }: { next: NextStationDate }) {
  return (
    <View className="rounded-2xl bg-brand-100 p-5 gap-2">
      <Text className="text-sm text-brand-600 font-bold">次の開催</Text>
      <Text className="text-3xl text-ink-900 font-bold">
        {formatNextCollection(next.date)}
      </Text>
      <Text className="text-base text-ink-900">
        {next.group.label} グループ（{next.group.schedulePattern}）
      </Text>
    </View>
  );
}

// ============================================================
// セクション: グループカード（展開可能）
// ============================================================

function GroupCard({
  group,
  next,
  isExpanded,
  onToggle,
}: {
  group: RecycleStationGroup;
  next: NextStationDate | null;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="rounded-2xl border border-ink-200 overflow-hidden">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${group.label}グループ、${
          isExpanded ? '閉じる' : '拠点一覧を開く'
        }`}
        className="px-4 py-3 flex-row items-center gap-3"
      >
        <View className="w-10 h-10 rounded-full bg-brand-500 items-center justify-center">
          <Text className="text-lg text-white font-bold">{group.label}</Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base text-ink-900 font-bold">
            {group.schedulePattern}
          </Text>
          {next ? (
            <Text className="text-sm text-ink-900">
              次回: {formatNextCollection(next.date)}
            </Text>
          ) : (
            <Text className="text-sm text-ink-500">今年度の開催は終了</Text>
          )}
          <Text className="text-xs text-ink-500">{group.locations.length} 拠点</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6B7280"
        />
      </Pressable>

      {isExpanded && <LocationList locations={group.locations} />}
    </View>
  );
}

function LocationList({ locations }: { locations: RecycleStationLocation[] }) {
  return (
    <View className="border-t border-ink-200 bg-bg">
      {locations.map((loc, idx) => (
        <LocationRow
          key={`${loc.name}-${idx}`}
          location={loc}
          isFirst={idx === 0}
        />
      ))}
    </View>
  );
}

function LocationRow({
  location,
  isFirst,
}: {
  location: RecycleStationLocation;
  isFirst: boolean;
}) {
  const handleOpenMap = async () => {
    const query =
      location.lat !== undefined && location.lng !== undefined
        ? `${location.lat},${location.lng}`
        : encodeURIComponent(`${location.name} ${location.address}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('地図アプリを開けませんでした', url);
    }
  };

  return (
    <Pressable
      onPress={handleOpenMap}
      accessibilityRole="link"
      accessibilityLabel={`${location.name}を地図で開く`}
      className={`px-4 py-3 gap-1 ${isFirst ? '' : 'border-t border-ink-200'}`}
    >
      <Text className="text-sm text-ink-900 font-bold">{location.name}</Text>
      <View className="flex-row items-center gap-1">
        <Ionicons name="location-outline" size={12} color="#6B7280" />
        <Text className="flex-1 text-xs text-ink-500" numberOfLines={2}>
          {location.address}
        </Text>
        <Ionicons name="open-outline" size={12} color="#16A34A" />
      </View>
    </Pressable>
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
