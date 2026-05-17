/**
 * リサイクルステーションの開催日関連ヘルパー（純粋関数）。
 *
 * data/common/recycle-stations.json の各グループは `dates: string[]`
 * （ISO 形式 "YYYY-MM-DD"）を持つ。本モジュールはそこから
 * 「次回の開催日」「全グループ通しの最も近い開催日」を取り出す。
 *
 * 設計:
 * - schedule-calculator.ts と同じ朝7時カットオフ（COLLECTION_CUTOFF_HOUR）を共有
 * - 「年度内に残りがない」場合は null を返す（呼び出し側でフォールバック表示）
 * - React 依存なし、純粋関数のみ
 */

import { startOfDay } from 'date-fns';

import { COLLECTION_CUTOFF_HOUR } from '@/lib/schedule-calculator';
import type { RecycleStationGroup, RecycleStationsData } from '@/types';

// ============================================================
// 型
// ============================================================

export interface NextStationDate {
  group: RecycleStationGroup;
  date: Date;
  /** 当日朝 7 時前なら true */
  isToday: boolean;
}

// ============================================================
// 内部
// ============================================================

/** ISO "YYYY-MM-DD" を端末ローカルの 0:00 として Date 化 */
function parseIsoDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return new Date(NaN);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** from を基準に「今日も候補に含めるか」を朝 7 時境界で判定 */
function shouldIncludeToday(from: Date): boolean {
  return from.getHours() < COLLECTION_CUTOFF_HOUR;
}

// ============================================================
// 公開 API
// ============================================================

/**
 * 単一グループから「from 以降の最も近い開催日」を返す。
 * 年度内に残りがなければ null。
 *
 * @example
 * // from = 2026-05-17、group.dates = [..., "2026-04-04", "2026-06-06", ...]
 * // → 2026-06-06 (Date)
 */
export function getNextDateForGroup(
  group: RecycleStationGroup,
  from?: Date,
): Date | null {
  const base = from ?? new Date();
  const baseDayStart = startOfDay(base).getTime();
  const includeToday = shouldIncludeToday(base);

  const futureDates = group.dates
    .map(parseIsoDate)
    .filter((d) => !Number.isNaN(d.getTime()))
    .filter((d) => {
      const t = d.getTime();
      if (t > baseDayStart) return true;
      return includeToday && t === baseDayStart;
    })
    .sort((a, b) => a.getTime() - b.getTime());

  return futureDates[0] ?? null;
}

/**
 * 全グループから「次回開催日」を取得し、日付昇順で返す。
 * 年度内残りなしのグループは除外される。
 */
export function getUpcomingStationDates(
  data: RecycleStationsData,
  from?: Date,
): NextStationDate[] {
  const base = from ?? new Date();
  const baseDayStart = startOfDay(base).getTime();

  const result: NextStationDate[] = [];
  for (const group of data.groups) {
    const date = getNextDateForGroup(group, base);
    if (!date) continue;
    result.push({
      group,
      date,
      isToday: date.getTime() === baseDayStart,
    });
  }
  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
}

/**
 * 全 8 グループ通しで「最も近い次回開催日」を 1 件返す。
 * result.tsx の bottle_pet 表示で利用。
 */
export function getNextStationCollection(
  data: RecycleStationsData,
  from?: Date,
): NextStationDate | null {
  const upcoming = getUpcomingStationDates(data, from);
  return upcoming[0] ?? null;
}
