/**
 * 収集日カレンダー（月グリッド）生成の純粋関数。
 *
 * 収集日の算出ロジックは lib/schedule-calculator.ts に集約済みなので、
 * ここはその getCollectionsInRange を月グリッド用に整形するだけ。
 *
 * 利用先: components/ScheduleCalendar.tsx（収集日画面のカレンダー表示）
 */

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import { getCollectionsInRange, toIsoDate } from '@/lib/schedule-calculator';
import type { CollectionCategoryId, NextCollection, Pattern } from '@/types';

/** 月曜始まり。曜日ヘッダ・週開始の基準として使う */
export const WEEK_STARTS_ON = 1 as const;

/** カレンダーの曜日見出し（月曜始まり） */
export const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'] as const;

export interface CalendarDay {
  date: Date;
  /** 表示中の月に属するか（前後の月のはみ出し日は false → 淡色表示） */
  inCurrentMonth: boolean;
  /** その日に収集があるカテゴリ（収集順）。無ければ空配列 */
  entries: NextCollection[];
}

/**
 * 指定年月のカレンダーグリッド（月曜始まり、前後の月を含む完全な週）を返す。
 *
 * @param year 西暦（例 2026）
 * @param monthIndex 0始まりの月（0=1月, 4=5月）
 * @param pattern 地区の収集パターン
 * @param labels CollectionCategoryId → 表示名
 *
 * @example
 * // 2026年5月のグリッド（4/27月〜5/31日 など、6週分の Date 配列）
 * buildMonthGrid(2026, 4, pattern, labels)
 */
export function buildMonthGrid(
  year: number,
  monthIndex: number,
  pattern: Pattern,
  labels: Record<CollectionCategoryId, string>,
): CalendarDay[] {
  const monthStart = startOfMonth(new Date(year, monthIndex, 1));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // グリッド全体の収集を 1 回で算出し、ISO 日付で引けるよう Map 化
  const collections = getCollectionsInRange(pattern, labels, gridStart, days.length);
  const byIso = new Map<string, NextCollection[]>();
  for (const c of collections) {
    byIso.set(toIsoDate(c.date), c.entries);
  }

  return days.map((date) => ({
    date,
    inCurrentMonth: date.getMonth() === monthIndex,
    entries: byIso.get(toIsoDate(date)) ?? [],
  }));
}

/** グリッドを 7 日ずつの週配列に分割（描画用） */
export function chunkIntoWeeks(days: CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}
