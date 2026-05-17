/**
 * 収集日計算ロジック（純粋関数）。
 *
 * data/common/patterns.json の CollectionPattern 定義から、任意の基準日に対する
 * 「次回収集日」「次回通知時刻」「表示用フォーマット」を算出する。
 *
 * 制約・前提:
 * - タイムゾーンは端末ローカル（飯田市ユーザー = JST 想定）。date-fns-tz は使わない
 * - 祝日休止は MVP 未対応。曜日ベースのみ
 * - 収集日当日の朝7時（COLLECTION_CUTOFF_HOUR）を過ぎたら次回 occurrence へ進む
 *   （basic-rules.json「収集日の当日午前7時まで」に準拠）
 */

import {
  addDays,
  addMonths,
  format,
  getDate,
  getDay,
  isSameDay,
  setDate,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { ja } from 'date-fns/locale';

import type {
  CollectionCategoryId,
  CollectionPattern,
  NextCollection,
  Pattern,
  WeekDay,
} from '@/types';

// ============================================================
// 定数
// ============================================================

/** 収集日当日のカットオフ時刻（時、24h）。これより前なら「今日」を候補に含める */
export const COLLECTION_CUTOFF_HOUR = 7;

/** UI 表示順としても使われる、定期収集カテゴリの順序 */
export const COLLECTION_CATEGORIES: readonly CollectionCategoryId[] = [
  'burnable',
  'plastic_resource',
  'landfill',
  'hazardous',
  'metal_resource',
  'paper_resource',
];

/** WeekDay リテラルから Date.getDay の整数値（日曜=0...土曜=6） */
const WEEKDAY_TO_INT: Record<WeekDay, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

// ============================================================
// 内部ヘルパー
// ============================================================

/** from が当日収集日のとき「今日も候補に含める」かを朝7時境界で判定 */
function shouldIncludeToday(from: Date): boolean {
  return from.getHours() < COLLECTION_CUTOFF_HOUR;
}

/**
 * 指定の曜日（複数可）のうち、from 以降で最も近い未来日を返す。
 * includeToday=true なら from 自身も候補。
 */
function findNextWeekday(from: Date, days: WeekDay[], includeToday: boolean): Date {
  const base = startOfDay(from);
  const targetInts = days.map((d) => WEEKDAY_TO_INT[d]);
  const startOffset = includeToday ? 0 : 1;
  for (let i = startOffset; i < startOffset + 14; i++) {
    const candidate = addDays(base, i);
    if (targetInts.includes(getDay(candidate))) {
      return candidate;
    }
  }
  // 14日以内に必ず見つかるが、保険として最後の候補を返す
  return addDays(base, 7);
}

/**
 * 指定月の n 番目（1〜5）の特定曜日を返す。該当が無い場合（第5曜日が存在しない月など）は null。
 */
function nthWeekdayOfMonth(year: number, monthIdx: number, n: number, weekdayInt: number): Date | null {
  // 月初日
  const firstOfMonth = new Date(year, monthIdx, 1);
  const firstDayInt = getDay(firstOfMonth);
  // 月初から見た最初の対象曜日のオフセット
  const firstOccurrenceOffset = (weekdayInt - firstDayInt + 7) % 7;
  const day = 1 + firstOccurrenceOffset + (n - 1) * 7;
  const candidate = setDate(firstOfMonth, day);
  // 月をまたいでいたら null
  if (candidate.getMonth() !== monthIdx) return null;
  return startOfDay(candidate);
}

/**
 * 第N曜日（複数 N を許容）のうち、from 以降で最も近い未来日を返す。
 * 当月になければ翌月以降を最大12ヶ月探索。
 */
function findNextNthWeekdayOfMonth(
  from: Date,
  nth: number[],
  day: WeekDay,
  includeToday: boolean,
): Date {
  const base = startOfDay(from);
  const weekdayInt = WEEKDAY_TO_INT[day];

  for (let monthDelta = 0; monthDelta < 12; monthDelta++) {
    const target = addMonths(base, monthDelta);
    const year = target.getFullYear();
    const monthIdx = target.getMonth();

    // 当月の候補日を全て列挙して昇順ソート
    const candidates = nth
      .map((n) => nthWeekdayOfMonth(year, monthIdx, n, weekdayInt))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    for (const candidate of candidates) {
      const diff = candidate.getTime() - base.getTime();
      if (diff > 0) return candidate;
      if (diff === 0 && includeToday) return candidate;
    }
  }
  // ガード（実際には到達しない）
  return addMonths(base, 1);
}

// ============================================================
// 公開 API
// ============================================================

/**
 * 与えられた CollectionPattern について、from 以降の最も近い収集日を返す。
 *
 * @param pattern weekly または nth_day の CollectionPattern
 * @param from 基準日時。省略時は new Date()
 * @returns 次回収集日（時刻部分は startOfDay で正規化）
 *
 * @example
 * // 2026-05-11 (月) 06:00 基準、burnable: weekly [mon, thu]
 * // → 2026-05-11 (月) 当日（月曜は対象、まだ朝7時前）
 *
 * @example
 * // 2026-05-11 (月) 08:00 基準、同上
 * // → 2026-05-14 (木)（月曜だが7時過ぎなので次の木曜へ）
 *
 * @example
 * // 2026-05-12 (火) 任意時刻、landfill: nth_day [1,3] fri
 * // → 2026-05-15 (金、第3週) （第1金 2026-05-01 はもう過ぎている）
 */
export function getNextCollectionDate(pattern: CollectionPattern, from?: Date): Date {
  const base = from ?? new Date();
  const includeToday = shouldIncludeToday(base);

  if (pattern.type === 'weekly') {
    return findNextWeekday(base, pattern.days, includeToday);
  }
  return findNextNthWeekdayOfMonth(base, pattern.nth, pattern.day, includeToday);
}

/**
 * Pattern 全 6 カテゴリの NextCollection を日付昇順で返す。
 *
 * @param pattern data.patterns.patterns[areaPatternId]
 * @param categoryLabels CollectionCategoryId → 表示名のマップ（categories.json から作る）
 * @param from 基準日時。省略時は new Date()
 */
export function getAllNextCollections(
  pattern: Pattern,
  categoryLabels: Record<CollectionCategoryId, string>,
  from?: Date,
): NextCollection[] {
  const base = from ?? new Date();
  const result: NextCollection[] = COLLECTION_CATEGORIES.map((categoryId) => ({
    categoryId,
    categoryName: categoryLabels[categoryId] ?? categoryId,
    date: getNextCollectionDate(pattern[categoryId], base),
  }));
  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
}

/**
 * Pattern について from から days 日先までの全収集日を、日付単位で集約して返す。
 *
 * 同一日に複数カテゴリが収集される場合は entries にまとめる。
 * Schedule 画面の「今後の予定」リストで使う。
 *
 * @param pattern 地区の収集パターン
 * @param categoryLabels CollectionCategoryId → 表示名
 * @param from 基準日時
 * @param days 何日先まで列挙するか（例: 28 で 4 週間）
 */
export function getCollectionsInRange(
  pattern: Pattern,
  categoryLabels: Record<CollectionCategoryId, string>,
  from: Date,
  days: number,
): { date: Date; entries: NextCollection[] }[] {
  const base = startOfDay(from);
  const includeToday = shouldIncludeToday(from);
  const endTime = addDays(base, days).getTime();
  const byDate = new Map<number, NextCollection[]>();

  for (const categoryId of COLLECTION_CATEGORIES) {
    const categoryPattern = pattern[categoryId];
    // 当日含む基準日を起点にして繰り返し進める
    let cursor = includeToday ? base : addDays(base, 1);
    while (true) {
      const next = getNextCollectionDate(categoryPattern, cursor);
      if (next.getTime() >= endTime) break;
      const key = next.getTime();
      const list = byDate.get(key) ?? [];
      list.push({
        categoryId,
        categoryName: categoryLabels[categoryId] ?? categoryId,
        date: next,
      });
      byDate.set(key, list);
      // 翌日以降で再探索
      cursor = addDays(next, 1);
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, entries]) => ({
      date: entries[0].date,
      entries: entries.sort((a, b) => COLLECTION_CATEGORIES.indexOf(a.categoryId) - COLLECTION_CATEGORIES.indexOf(b.categoryId)),
    }));
}

/**
 * 日付単位の収集配列を、月曜始まりの週で固定 4 週分にグルーピング。
 *
 * - from を含む週を weekOffset = 0、以降 1, 2, 3 と続く
 * - 該当週に収集が無くてもセクションは残す（days: []）
 *
 * Schedule 画面で「今週／来週／…」見出し付きで表示するため。
 */
export function groupByWeek(
  collections: { date: Date; entries: NextCollection[] }[],
  from: Date,
  weekCount = 4,
): { weekStart: Date; weekOffset: number; days: { date: Date; entries: NextCollection[] }[] }[] {
  const firstWeekStart = startOfWeek(from, { weekStartsOn: 1 });
  const weeks = Array.from({ length: weekCount }, (_, i) => ({
    weekStart: addDays(firstWeekStart, i * 7),
    weekOffset: i,
    days: [] as { date: Date; entries: NextCollection[] }[],
  }));

  for (const day of collections) {
    const dayStart = startOfDay(day.date).getTime();
    const offset = Math.floor((dayStart - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (offset >= 0 && offset < weekCount) {
      weeks[offset].days.push(day);
    }
  }

  for (const week of weeks) {
    week.days.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return weeks;
}

/**
 * 次回収集日の **前日** 指定時刻に予約すべき Date を返す（通知サービス用）。
 *
 * - 当日が収集日でも前日は対象外（次回の前日を返す）
 * - time は "HH:mm" 形式（UserSettings.notificationTime）。不正値は 20:00 にフォールバック
 *
 * @example
 * // 2026-05-12 (火) 任意時刻、burnable: weekly [mon, thu]、time = "20:00"
 * // 次回収集 = 2026-05-14 (木)
 * // → 2026-05-13 (水) 20:00 を返す
 */
export function getNextNotificationTime(
  pattern: CollectionPattern,
  time: string,
  from?: Date,
): Date {
  const base = from ?? new Date();
  // 通知は「前日夜」なので、当日収集日はもう間に合わない → includeToday=false 相当の動きが必要
  // ただし、当日朝7時前なら getNextCollectionDate は当日を返す。通知としては「今日の夜」では遅すぎ。
  // よって基準を「翌日 0時」にずらして次回検索することで、当日除外を達成する。
  const tomorrowBase = startOfDay(addDays(base, 1));
  const nextCollection = getNextCollectionDate(pattern, tomorrowBase);
  const prevDay = addDays(nextCollection, -1);

  const { hour, minute } = parseHHmm(time);
  const result = new Date(prevDay);
  result.setHours(hour, minute, 0, 0);
  return result;
}

function parseHHmm(time: string): { hour: number; minute: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) return { hour: 20, minute: 0 };
  const hour = Math.max(0, Math.min(23, Number.parseInt(m[1], 10)));
  const minute = Math.max(0, Math.min(59, Number.parseInt(m[2], 10)));
  return { hour, minute };
}

/**
 * 表示用フォーマット。
 * - 今日: "今日 5月14日（木）"
 * - 明日: "明日 5月15日（金）"
 * - 明後日: "明後日 5月16日（土）"
 * - それ以外: "5月17日（日）"
 *
 * @param date 表示対象日
 * @param from 比較基準。省略時は new Date()
 */
export function formatNextCollection(date: Date, from?: Date): string {
  const base = startOfDay(from ?? new Date());
  const target = startOfDay(date);
  const formatted = format(target, 'M月d日（E）', { locale: ja });

  if (isSameDay(target, base)) return `今日 ${formatted}`;
  if (isSameDay(target, addDays(base, 1))) return `明日 ${formatted}`;
  if (isSameDay(target, addDays(base, 2))) return `明後日 ${formatted}`;
  return formatted;
}

// ============================================================
// 開発用ヘルパー（呼び出し側がフォーマット文字列を組み立てる時の便利関数）
// ============================================================

/** ISO 短形式 (yyyy-MM-dd) で返す。デバッグや永続化用 */
export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** デバッグ用: 月の何番目の曜日かを返す（1 始まり） */
export function getNthOfMonth(date: Date): number {
  return Math.ceil(getDate(date) / 7);
}
