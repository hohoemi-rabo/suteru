import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildCategoryMaps } from '@/lib/category-maps';
import { useData } from '@/lib/data-loader';
import { requestPermission } from '@/lib/notifications';
import {
  formatNextCollection,
  getAllNextCollections,
  getCollectionsInRange,
  groupByWeek,
} from '@/lib/schedule-calculator';
import { useUserSettings } from '@/lib/user-settings';
import type {
  Area,
  CollectionCategoryId,
  NextCollection,
  Pattern,
} from '@/types';

const UPCOMING_DAYS = 28;
const WEEK_COUNT = 4;
const WEEK_LABELS = ['今週', '来週', '再来週', '4 週目'] as const;

export default function ScheduleScreen() {
  const data = useData();
  const { settings, setNotificationsEnabled } = useUserSettings();
  const router = useRouter();

  const area = data.areas.areas.find((a) => a.id === settings.areaId) ?? null;
  const patternId = area?.patternId;
  const pattern =
    patternId && patternId !== 'TBD_NEEDS_VERIFICATION'
      ? data.patterns.patterns[patternId]
      : undefined;

  const { nameMap: categoryLabelMap, colorMap: categoryColorMap } =
    buildCategoryMaps(data.categories);

  const handleOpenSettings = () => {
    router.push('/(tabs)/settings');
  };

  const handleOpenOfficial = async () => {
    try {
      await Linking.openURL(data.meta.officialUrl);
    } catch {
      Alert.alert('リンクを開けませんでした', data.meta.officialUrl);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (!value) {
      await setNotificationsEnabled(false);
      return;
    }
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        '通知が許可されていません',
        '端末の設定アプリ → アプリ → 通知 から「これどう捨てる？」の通知を許可してください。',
      );
      return;
    }
    await setNotificationsEnabled(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="pb-8">
        <Header area={area} pattern={pattern} onPressChange={handleOpenSettings} />

        <View className="px-4 gap-6">
          {pattern ? (
            <>
              <NextHighlight
                pattern={pattern}
                categoryLabelMap={categoryLabelMap}
                categoryColorMap={categoryColorMap}
              />
              <CategoryCards
                pattern={pattern}
                categoryLabelMap={categoryLabelMap}
                categoryColorMap={categoryColorMap}
              />
              <UpcomingList
                pattern={pattern}
                categoryLabelMap={categoryLabelMap}
                categoryColorMap={categoryColorMap}
              />
            </>
          ) : (
            <TbdFallback onPressOfficial={handleOpenOfficial} />
          )}

          <NotificationsRow
            enabled={settings.notificationsEnabled}
            time={settings.notificationTime}
            onToggle={(value) => {
              void handleToggleNotifications(value);
            }}
          />

          <Footer onPressOfficial={handleOpenOfficial} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// セクション: ヘッダー
// ============================================================

function Header({
  area,
  pattern,
  onPressChange,
}: {
  area: Area | null;
  pattern: Pattern | undefined;
  onPressChange: () => void;
}) {
  return (
    <View className="px-4 pt-2 pb-4 gap-1">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-end gap-2 flex-1">
          <Text className="text-xl text-ink-900 font-bold" numberOfLines={1}>
            {area ? truncate(area.name, 12) : '地区未設定'}
          </Text>
          <View className="rounded-full bg-brand-100 px-2 py-0.5">
            <Text className="text-xs text-brand-600">ベータ版</Text>
          </View>
        </View>
        <Pressable
          onPress={onPressChange}
          accessibilityLabel="地区を変更する（設定画面を開く）"
          accessibilityRole="button"
          className="flex-row items-center gap-1 rounded-full bg-brand-100 px-3 py-1.5"
        >
          <Ionicons name="location" size={14} color="#166534" />
          <Text className="text-sm text-brand-600">変更</Text>
          <Ionicons name="chevron-forward" size={14} color="#166534" />
        </Pressable>
      </View>
      {pattern && (
        <Text className="text-sm text-ink-500">{pattern.description}</Text>
      )}
    </View>
  );
}

// ============================================================
// セクション: 次回ハイライト
// ============================================================

function NextHighlight({
  pattern,
  categoryLabelMap,
  categoryColorMap,
}: {
  pattern: Pattern;
  categoryLabelMap: Record<CollectionCategoryId, string>;
  categoryColorMap: Record<CollectionCategoryId, string>;
}) {
  const next = getAllNextCollections(pattern, categoryLabelMap)[0];
  if (!next) return null;
  const color = categoryColorMap[next.categoryId];

  return (
    <View className="rounded-2xl bg-brand-100 p-5 gap-2">
      <Text className="text-sm text-brand-600 font-bold">次の収集</Text>
      <Text className="text-3xl text-ink-900 font-bold">
        {formatNextCollection(next.date)}
      </Text>
      <View className="flex-row items-center gap-2">
        <View
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <Text className="text-base text-ink-900">{next.categoryName}</Text>
      </View>
    </View>
  );
}

// ============================================================
// セクション: カテゴリ別 次回収集日カード
// ============================================================

function CategoryCards({
  pattern,
  categoryLabelMap,
  categoryColorMap,
}: {
  pattern: Pattern;
  categoryLabelMap: Record<CollectionCategoryId, string>;
  categoryColorMap: Record<CollectionCategoryId, string>;
}) {
  const list = getAllNextCollections(pattern, categoryLabelMap);
  return (
    <View className="gap-2">
      <Text className="text-base text-ink-900 font-bold">カテゴリ別 次回収集日</Text>
      <View className="rounded-2xl border border-ink-200 overflow-hidden">
        {list.map((nc, idx) => (
          <View
            key={nc.categoryId}
            className={`flex-row items-center justify-between px-4 py-3 ${idx > 0 ? 'border-t border-ink-200' : ''}`}
          >
            <View className="flex-row items-center gap-3 flex-1">
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: categoryColorMap[nc.categoryId] }}
              />
              <Text className="text-base text-ink-900">{nc.categoryName}</Text>
            </View>
            <Text className="text-base text-ink-900">
              {formatNextCollection(nc.date)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================
// セクション: 今後の予定リスト（4週間・週ごと見出し）
// ============================================================

function UpcomingList({
  pattern,
  categoryLabelMap,
  categoryColorMap,
}: {
  pattern: Pattern;
  categoryLabelMap: Record<CollectionCategoryId, string>;
  categoryColorMap: Record<CollectionCategoryId, string>;
}) {
  const now = new Date();
  const days = getCollectionsInRange(pattern, categoryLabelMap, now, UPCOMING_DAYS);
  const weeks = groupByWeek(days, now, WEEK_COUNT);

  return (
    <View className="gap-3">
      <Text className="text-base text-ink-900 font-bold">今後の予定（4 週間）</Text>
      <View className="gap-4">
        {weeks.map((week) => (
          <WeekSection
            key={week.weekOffset}
            label={WEEK_LABELS[week.weekOffset] ?? `${week.weekOffset + 1} 週目`}
            weekStart={week.weekStart}
            days={week.days}
            categoryColorMap={categoryColorMap}
          />
        ))}
      </View>
    </View>
  );
}

function WeekSection({
  label,
  weekStart,
  days,
  categoryColorMap,
}: {
  label: string;
  weekStart: Date;
  days: { date: Date; entries: NextCollection[] }[];
  categoryColorMap: Record<CollectionCategoryId, string>;
}) {
  const range = formatWeekRange(weekStart);
  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-base text-ink-900 font-bold">{label}</Text>
        <Text className="text-xs text-ink-500">{range}</Text>
      </View>
      {days.length === 0 ? (
        <Text className="text-sm text-ink-500 px-1">予定なし</Text>
      ) : (
        <View className="rounded-xl border border-ink-200 overflow-hidden">
          {days.map((day, idx) => (
            <View
              key={day.date.toISOString()}
              className={`px-4 py-3 gap-1 ${idx > 0 ? 'border-t border-ink-200' : ''}`}
            >
              <Text className="text-sm text-ink-500">{formatDayHeader(day.date)}</Text>
              <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                {day.entries.map((entry) => (
                  <View
                    key={entry.categoryId}
                    className="flex-row items-center gap-1.5"
                  >
                    <View
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: categoryColorMap[entry.categoryId] }}
                    />
                    <Text className="text-base text-ink-900">{entry.categoryName}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================
// セクション: 通知設定行
// ============================================================

function NotificationsRow({
  enabled,
  time,
  onToggle,
}: {
  enabled: boolean;
  time: string;
  onToggle: (value: boolean) => void;
}) {
  return (
    <View className="rounded-2xl border border-ink-200 p-4 gap-2">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text className="text-base text-ink-900 font-bold">
            明日のごみ出しを通知する
          </Text>
          <Text className="text-sm text-ink-500">
            前日 {time} に「明日は○○の日です」とお知らせします
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          accessibilityLabel="明日のごみ出し通知のオン・オフ"
        />
      </View>
    </View>
  );
}

// ============================================================
// セクション: TBD（No.36 等）フォールバック
// ============================================================

function TbdFallback({ onPressOfficial }: { onPressOfficial: () => void }) {
  return (
    <View className="rounded-2xl bg-warn-100 p-5 gap-3">
      <View className="flex-row items-center gap-2">
        <Ionicons name="alert-circle" size={20} color="#991B1B" />
        <Text className="text-base text-warn-600 font-bold">
          このエリアの収集パターンは準備中です
        </Text>
      </View>
      <Text className="text-sm text-ink-900 leading-relaxed">
        収集日データの確認が完了していないため、表示できません。
        お手元の収集カレンダーまたは飯田市公式サイトをご確認ください。
      </Text>
      <Pressable
        onPress={onPressOfficial}
        accessibilityRole="link"
        className="flex-row items-center gap-1 self-start"
      >
        <Text className="text-sm text-brand-600 underline">飯田市公式サイトを開く</Text>
        <Ionicons name="open-outline" size={14} color="#166534" />
      </Pressable>
    </View>
  );
}

// ============================================================
// セクション: フッター
// ============================================================

function Footer({ onPressOfficial }: { onPressOfficial: () => void }) {
  return (
    <View className="rounded-2xl bg-ink-200/30 px-4 py-3 gap-2">
      <Text className="text-sm text-ink-500 leading-relaxed">
        データは令和 8 年度ベース・ベータ版です。
      </Text>
      <Text className="text-sm text-ink-500 leading-relaxed">
        祝日休止は反映されていません。お住まいの地区の案内も合わせてご確認ください。
      </Text>
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

function formatDayHeader(date: Date): string {
  return format(date, 'M月d日（E）', { locale: ja });
}

function formatWeekRange(weekStart: Date): string {
  const start = format(weekStart, 'M/d', { locale: ja });
  const end = format(
    new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    'M/d',
    { locale: ja },
  );
  return `${start} 〜 ${end}`;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}
