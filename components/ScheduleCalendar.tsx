import { Ionicons } from '@expo/vector-icons';
import { format, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import {
  buildMonthGrid,
  chunkIntoWeeks,
  WEEKDAY_LABELS,
  type CalendarDay,
} from '@/lib/calendar-utils';
import { COLLECTION_CATEGORIES, toIsoDate } from '@/lib/schedule-calculator';
import type { CollectionCategoryId, NextCollection, Pattern } from '@/types';

const MAX_DOTS = 4;

export default function ScheduleCalendar({
  pattern,
  categoryLabelMap,
  categoryColorMap,
}: {
  pattern: Pattern;
  categoryLabelMap: Record<CollectionCategoryId, string>;
  categoryColorMap: Record<CollectionCategoryId, string>;
}) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectedIso, setSelectedIso] = useState<string>(toIsoDate(today));

  const grid = buildMonthGrid(view.y, view.m, pattern, categoryLabelMap);
  const weeks = chunkIntoWeeks(grid);
  const selectedDay = grid.find((d) => toIsoDate(d.date) === selectedIso) ?? null;

  const goPrevMonth = () => {
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  };
  const goNextMonth = () => {
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
  };

  const monthLabel = `${view.y}年${view.m + 1}月`;

  return (
    <View className="gap-3">
      {/* 月送りヘッダー */}
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={goPrevMonth}
          accessibilityRole="button"
          accessibilityLabel="前の月"
          className="w-11 h-11 items-center justify-center rounded-full"
        >
          <Ionicons name="chevron-back" size={22} color={Palette.text.primary} />
        </Pressable>
        <Text className="text-lg text-body font-bold">{monthLabel}</Text>
        <Pressable
          onPress={goNextMonth}
          accessibilityRole="button"
          accessibilityLabel="次の月"
          className="w-11 h-11 items-center justify-center rounded-full"
        >
          <Ionicons name="chevron-forward" size={22} color={Palette.text.primary} />
        </Pressable>
      </View>

      {/* 曜日見出し */}
      <View className="flex-row">
        {WEEKDAY_LABELS.map((w, i) => (
          <View key={w} className="flex-1 items-center py-1">
            <Text
              className={`text-xs font-bold ${
                i === 0 ? 'text-danger' : i === 6 ? 'text-blue-600' : 'text-muted'
              }`}
            >
              {w}
            </Text>
          </View>
        ))}
      </View>

      {/* 日付グリッド */}
      <View className="rounded-2xl bg-bg shadow-card overflow-hidden">
        {weeks.map((week, wi) => (
          <View key={wi} className={`flex-row ${wi > 0 ? 'border-t border-line' : ''}`}>
            {week.map((day) => (
              <DayCell
                key={toIsoDate(day.date)}
                day={day}
                isSelected={toIsoDate(day.date) === selectedIso}
                categoryColorMap={categoryColorMap}
                onPress={() => setSelectedIso(toIsoDate(day.date))}
              />
            ))}
          </View>
        ))}
      </View>

      {/* 選択日の詳細 */}
      <SelectedDayDetail day={selectedDay} categoryColorMap={categoryColorMap} />

      {/* 凡例 */}
      <Legend
        categoryLabelMap={categoryLabelMap}
        categoryColorMap={categoryColorMap}
      />
    </View>
  );
}

// ============================================================
// 日セル
// ============================================================

function DayCell({
  day,
  isSelected,
  categoryColorMap,
  onPress,
}: {
  day: CalendarDay;
  isSelected: boolean;
  categoryColorMap: Record<CollectionCategoryId, string>;
  onPress: () => void;
}) {
  const todayCell = isToday(day.date);
  const dots = day.entries.slice(0, MAX_DOTS);
  // 今日は緑の丸数字で示すので、枠線（選択ハイライト）は今日以外の選択日にだけ付ける。
  // border は常時 2px 確保（未選択は透明）し、選択時の太さ変化でレイアウトがずれないようにする。
  const showRing = isSelected && !todayCell;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${format(day.date, 'M月d日（E）', { locale: ja })}${
        day.entries.length > 0
          ? '、' + day.entries.map((e) => e.categoryName).join('・')
          : '、収集なし'
      }`}
      className={`flex-1 min-h-14 items-center pt-1.5 pb-1 rounded-xl border-2 ${
        showRing ? 'border-green-400' : 'border-transparent'
      } ${day.inCurrentMonth ? '' : 'opacity-35'}`}
    >
      {/* 日付（今日は塗り円） */}
      <View
        className={`w-7 h-7 items-center justify-center rounded-full ${
          todayCell ? 'bg-green-400' : ''
        }`}
      >
        <Text
          className={`text-sm ${
            todayCell ? 'text-white font-bold' : 'text-body'
          }`}
        >
          {day.date.getDate()}
        </Text>
      </View>

      {/* 収集カテゴリの色ドット */}
      <View className="flex-row flex-wrap justify-center gap-0.5 mt-1 px-0.5">
        {dots.map((e) => (
          <View
            key={e.categoryId}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: categoryColorMap[e.categoryId] ?? Palette.text.secondary }}
          />
        ))}
      </View>
    </Pressable>
  );
}

// ============================================================
// 選択日の詳細
// ============================================================

function SelectedDayDetail({
  day,
  categoryColorMap,
}: {
  day: CalendarDay | null;
  categoryColorMap: Record<CollectionCategoryId, string>;
}) {
  // 収集がある日をタップしたときだけ詳細を出す。
  // 収集なし・未選択のときは何も出さない（縦の余白を節約し、凡例まで見やすくする）。
  if (!day || day.entries.length === 0) return null;

  const dateLabel = format(day.date, 'M月d日（E）', { locale: ja });

  return (
    <View className="rounded-2xl bg-bg shadow-card p-4 gap-2">
      <Text className="text-base text-body font-bold">{dateLabel}</Text>
      <View className="gap-1.5">
        {day.entries.map((e) => (
          <CategoryRow key={e.categoryId} entry={e} categoryColorMap={categoryColorMap} />
        ))}
      </View>
    </View>
  );
}

function CategoryRow({
  entry,
  categoryColorMap,
}: {
  entry: NextCollection;
  categoryColorMap: Record<CollectionCategoryId, string>;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <View
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: categoryColorMap[entry.categoryId] ?? Palette.text.secondary }}
      />
      <Text className="text-base text-body">{entry.categoryName}</Text>
    </View>
  );
}

// ============================================================
// 凡例
// ============================================================

function Legend({
  categoryLabelMap,
  categoryColorMap,
}: {
  categoryLabelMap: Record<CollectionCategoryId, string>;
  categoryColorMap: Record<CollectionCategoryId, string>;
}) {
  return (
    <View className="rounded-2xl bg-bg shadow-card px-4 py-3 gap-2">
      <Text className="text-xs text-muted">凡例</Text>
      <View className="flex-row flex-wrap justify-between gap-y-2">
        {COLLECTION_CATEGORIES.map((id) => (
          <View key={id} className="flex-row items-center gap-1.5 w-[48%]">
            <View
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: categoryColorMap[id] ?? Palette.text.secondary }}
            />
            <Text className="text-sm text-body shrink" numberOfLines={1}>
              {categoryLabelMap[id] ?? id}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
