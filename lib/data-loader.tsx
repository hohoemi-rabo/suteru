/**
 * バンドル JSON のロードと、起動時のリモート版チェック・キャッシュ更新を担う。
 *
 * 設計:
 * - 起動時はバンドル版を**同期**で返す（loadBundledData）→ 即座に画面表示可能
 * - その後バックグラウンドで:
 *   1. AsyncStorage のキャッシュが bundle より新しければ採用
 *   2. リモート（EXPO_PUBLIC_DATA_HOST）が設定されていれば最新版を取得し、新しければキャッシュ＋state更新
 * - リモート未設定（MVP 初期段階）なら no-op で、バンドル版だけで動く
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import metaJson from '@/data/common/meta.json';
import basicRulesJson from '@/data/common/basic-rules.json';
import categoriesJson from '@/data/common/categories.json';
import itemsJson from '@/data/common/items.json';
import patternsJson from '@/data/common/patterns.json';
import specialDisposalJson from '@/data/common/special-disposal.json';
import facilitiesJson from '@/data/common/facilities.json';
import recycleStationsJson from '@/data/common/recycle-stations.json';
import areasJson from '@/data/areas/areas.json';

import { getCached, setCached, STORAGE_KEYS } from '@/lib/storage';
import type {
  AreasData,
  BasicRules,
  CategoriesData,
  FacilitiesData,
  ItemsData,
  Meta,
  PatternsData,
  RecycleStationsData,
  SpecialDisposalData,
} from '@/types';

// ============================================================
// 公開型
// ============================================================

export interface AppData {
  meta: Meta;
  basicRules: BasicRules;
  categories: CategoriesData;
  items: ItemsData;
  patterns: PatternsData;
  areas: AreasData;
  specialDisposal: SpecialDisposalData;
  facilities: FacilitiesData;
  recycleStations: RecycleStationsData;
  /** バンドルから来たか、AsyncStorage キャッシュから来たか */
  source: 'bundle' | 'remote-cache';
}

// ============================================================
// バンドル版同期ロード
// ============================================================

/**
 * 起動時に同期で呼ぶ。JSON は import で取り込んでいるので I/O なし。
 * 型は import 時に推論されるが構造が緩いため、明示的に as キャストで型を当てる。
 */
export function loadBundledData(): AppData {
  return {
    meta: metaJson as Meta,
    basicRules: basicRulesJson as unknown as BasicRules,
    categories: categoriesJson as unknown as CategoriesData,
    items: itemsJson as unknown as ItemsData,
    patterns: patternsJson as unknown as PatternsData,
    areas: areasJson as unknown as AreasData,
    specialDisposal: specialDisposalJson as unknown as SpecialDisposalData,
    facilities: facilitiesJson as unknown as FacilitiesData,
    recycleStations: recycleStationsJson as unknown as RecycleStationsData,
    source: 'bundle',
  };
}

// ============================================================
// バージョン比較
// ============================================================

/**
 * `0.1.0-draft` のような semver 風文字列を簡易比較。
 * 数値部のみ比較し、suffix（-draft 等）は無視する。
 * a > b なら正、a < b なら負、等しければ 0。
 */
export function compareVersion(a: string, b: string): number {
  const parse = (v: string): number[] =>
    v
      .split('-')[0]
      .split('.')
      .map((n) => Number.parseInt(n, 10) || 0);
  const ap = parse(a);
  const bp = parse(b);
  const len = Math.max(ap.length, bp.length);
  for (let i = 0; i < len; i++) {
    const diff = (ap[i] ?? 0) - (bp[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

// ============================================================
// キャッシュ読み出し
// ============================================================

/**
 * AsyncStorage にキャッシュ済みデータがあり、かつバンドルより新しければ返す。
 * なければ null（呼び出し側はバンドルを使い続ける）。
 */
export async function loadCachedDataIfNewer(bundle: AppData): Promise<AppData | null> {
  const cached = await getCached<AppData>(STORAGE_KEYS.CACHED_DATA_BUNDLE);
  if (!cached) return null;
  if (compareVersion(cached.meta.version, bundle.meta.version) > 0) {
    return { ...cached, source: 'remote-cache' };
  }
  return null;
}

// ============================================================
// リモート更新
// ============================================================

const REMOTE_FETCH_TIMEOUT_MS = 10_000;

const REMOTE_FILE_MAP = {
  meta: 'common/meta.json',
  basicRules: 'common/basic-rules.json',
  categories: 'common/categories.json',
  items: 'common/items.json',
  patterns: 'common/patterns.json',
  areas: 'areas/areas.json',
  specialDisposal: 'common/special-disposal.json',
  facilities: 'common/facilities.json',
  recycleStations: 'common/recycle-stations.json',
} as const;

function getRemoteHost(): string | null {
  const host = process.env.EXPO_PUBLIC_DATA_HOST;
  return host && host.length > 0 ? host.replace(/\/$/, '') : null;
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * リモートが現状より新しければ全 9 ファイルを取得して AppData を返す。
 * 古い・同じ・エラー・ホスト未設定なら null（呼び出し側は現状維持）。
 *
 * 取得した AppData は AsyncStorage に保存する（次回起動時に loadCachedDataIfNewer で拾われる）。
 */
export async function checkForDataUpdate(currentData: AppData): Promise<AppData | null> {
  const host = getRemoteHost();
  if (!host) return null;

  try {
    // 1. meta.json だけ先に取って version 比較
    const remoteMeta = await fetchJsonWithTimeout<Meta>(
      `${host}/${REMOTE_FILE_MAP.meta}`,
      REMOTE_FETCH_TIMEOUT_MS,
    );
    if (compareVersion(remoteMeta.version, currentData.meta.version) <= 0) {
      return null;
    }

    // 2. 新しい → 残り 8 ファイルを並行取得（all-or-nothing）
    const [basicRules, categories, items, patterns, areas, specialDisposal, facilities, recycleStations] =
      await Promise.all([
        fetchJsonWithTimeout<BasicRules>(`${host}/${REMOTE_FILE_MAP.basicRules}`, REMOTE_FETCH_TIMEOUT_MS),
        fetchJsonWithTimeout<CategoriesData>(`${host}/${REMOTE_FILE_MAP.categories}`, REMOTE_FETCH_TIMEOUT_MS),
        fetchJsonWithTimeout<ItemsData>(`${host}/${REMOTE_FILE_MAP.items}`, REMOTE_FETCH_TIMEOUT_MS),
        fetchJsonWithTimeout<PatternsData>(`${host}/${REMOTE_FILE_MAP.patterns}`, REMOTE_FETCH_TIMEOUT_MS),
        fetchJsonWithTimeout<AreasData>(`${host}/${REMOTE_FILE_MAP.areas}`, REMOTE_FETCH_TIMEOUT_MS),
        fetchJsonWithTimeout<SpecialDisposalData>(
          `${host}/${REMOTE_FILE_MAP.specialDisposal}`,
          REMOTE_FETCH_TIMEOUT_MS,
        ),
        fetchJsonWithTimeout<FacilitiesData>(
          `${host}/${REMOTE_FILE_MAP.facilities}`,
          REMOTE_FETCH_TIMEOUT_MS,
        ),
        fetchJsonWithTimeout<RecycleStationsData>(
          `${host}/${REMOTE_FILE_MAP.recycleStations}`,
          REMOTE_FETCH_TIMEOUT_MS,
        ),
      ]);

    const next: AppData = {
      meta: remoteMeta,
      basicRules,
      categories,
      items,
      patterns,
      areas,
      specialDisposal,
      facilities,
      recycleStations,
      source: 'remote-cache',
    };

    // 3. all-or-nothing でキャッシュ保存
    await setCached(STORAGE_KEYS.CACHED_DATA_BUNDLE, next);
    return next;
  } catch (err) {
    if (__DEV__) console.warn('[data-loader] remote update failed:', err);
    return null;
  }
}

// ============================================================
// React Context
// ============================================================

const DataContext = createContext<AppData | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadBundledData());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 起動直後: キャッシュがバンドルより新しければ即適用
      const cached = await loadCachedDataIfNewer(data);
      if (!cancelled && cached) {
        setData(cached);
      }

      // バックグラウンド: リモートチェック（未設定なら即 null）
      const remote = await checkForDataUpdate(cached ?? data);
      if (!cancelled && remote) {
        setData(remote);
      }
    })();

    return () => {
      cancelled = true;
    };
    // 起動時に一度だけ実行（data 自身に依存させない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useData(): AppData {
  const data = useContext(DataContext);
  if (!data) {
    throw new Error('useData() must be used within <DataProvider>');
  }
  return data;
}

// ============================================================
// 手動更新フック（設定画面 21 で利用予定）
// ============================================================

export type UpdateResult = 'updated' | 'no-change' | 'no-host' | 'error';

export function useDataUpdater(): {
  isChecking: boolean;
  check: () => Promise<UpdateResult>;
} {
  const data = useData();
  const [isChecking, setIsChecking] = useState(false);

  const check = async (): Promise<UpdateResult> => {
    if (!getRemoteHost()) return 'no-host';
    setIsChecking(true);
    try {
      const next = await checkForDataUpdate(data);
      return next ? 'updated' : 'no-change';
    } catch {
      return 'error';
    } finally {
      setIsChecking(false);
    }
  };

  return { isChecking, check };
}
