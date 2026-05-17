/**
 * 地区判定（GPS）モジュール。純粋関数中心の lib モジュール。
 *
 * 設計:
 * - on-demand 取得（ボタン押下時のみ）。常時監視はしない（プライバシー要件 §7.1）
 * - 取得した座標はメモリのみ、Storage に永続化しない
 * - サーバーには送信しない（端末内完結）
 *
 * 主な利用先:
 * - 16 結果画面: 「現在地で確認」ボタン → 最寄り地区のルールで再表示
 * - 19 施設画面 / 20 リサイクルステーション画面: 地図中心化（任意）
 */

import * as Location from 'expo-location';

import type { Area } from '@/types';

// ============================================================
// 定数
// ============================================================

/** 最寄り地区との距離がこれ以上なら「対応エリア外」と判定（km） */
export const OUT_OF_AREA_DISTANCE_KM = 10;

/** GPS 取得のデフォルトタイムアウト（ms） */
export const DEFAULT_LOCATION_TIMEOUT_MS = 10_000;

/** 地球半径（km）。Haversine 用 */
const EARTH_RADIUS_KM = 6371;

// ============================================================
// 型
// ============================================================

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export type DetectionError =
  | 'permission_denied'
  | 'timeout'
  | 'unavailable' // GPS 無効・屋内など
  | 'unknown';

export interface Coords {
  lat: number;
  lng: number;
}

/** detectArea() の結果。discriminated union で「成功・対応エリア外・エラー」を区別 */
export type DetectionResult =
  | { ok: true; area: Area; distanceKm: number; coords: Coords }
  | {
      ok: true;
      area: null;
      reason: 'out_of_area';
      nearestDistanceKm: number;
      coords: Coords;
    }
  | { ok: false; error: DetectionError };

// ============================================================
// 距離計算
// ============================================================

/**
 * 2点間距離（km）。Haversine 公式。
 *
 * @example
 * // 同じ点 → 0
 * haversineDistanceKm({lat:35.5, lng:137.8}, {lat:35.5, lng:137.8}) // 0
 *
 * @example
 * // 飯田市内 area_01 ↔ area_25 はおおよそ 6〜7km
 * haversineDistanceKm({lat:35.514, lng:137.821}, {lat:35.487, lng:137.886})
 */
export function haversineDistanceKm(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * 与えられた座標から最も近い地区を返す。
 * areas が空配列なら null。距離閾値による「対応エリア外」判定は呼び出し側で行う。
 */
export function findNearestArea(
  coords: Coords,
  areas: Area[],
): { area: Area; distanceKm: number } | null {
  if (areas.length === 0) return null;
  let best: { area: Area; distanceKm: number } | null = null;
  for (const area of areas) {
    const d = haversineDistanceKm(coords, area.representativePoint);
    if (!best || d < best.distanceKm) {
      best = { area, distanceKm: d };
    }
  }
  return best;
}

// ============================================================
// 権限・GPS取得（低レベル）
// ============================================================

/**
 * 位置情報の権限を確認、未確定ならユーザーに要求。
 * 最終的な権限状態を返す。
 *
 * - granted: 取得可能
 * - denied: ユーザーが拒否（再度要求できないので設定アプリへの誘導が必要）
 * - undetermined: 想定外（通常 granted か denied に落ち着く）
 */
export async function ensureLocationPermission(): Promise<PermissionStatus> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return 'granted';
  if (current.status === Location.PermissionStatus.DENIED && !current.canAskAgain) {
    return 'denied';
  }
  const result = await Location.requestForegroundPermissionsAsync();
  if (result.granted) return 'granted';
  if (result.status === Location.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

/**
 * 1回限りの GPS 取得。タイムアウトで null。
 * 権限チェックは呼び出し側で行う（このフックは権限済みである前提）。
 */
export async function getCurrentCoords(
  timeoutMs: number = DEFAULT_LOCATION_TIMEOUT_MS,
): Promise<Coords | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  try {
    const positionPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }).then((pos): Coords => ({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
    const result = await Promise.race([positionPromise, timeoutPromise]);
    return result;
  } catch {
    return null;
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}

// ============================================================
// 高レベル統合
// ============================================================

/**
 * 「許可確認 → GPS取得 → 最寄り判定」をまとめて実行する。
 * UI 側は1回の await でこれを呼べば良い。
 *
 * @param areas data.areas.areas を渡す
 * @param timeoutMs GPS 取得のタイムアウト（ms、省略時 10秒）
 */
export async function detectArea(
  areas: Area[],
  timeoutMs: number = DEFAULT_LOCATION_TIMEOUT_MS,
): Promise<DetectionResult> {
  // 1. 権限
  const permission = await ensureLocationPermission();
  if (permission !== 'granted') {
    return { ok: false, error: 'permission_denied' };
  }

  // 2. GPS 取得
  let coords: Coords | null;
  try {
    coords = await getCurrentCoords(timeoutMs);
  } catch {
    return { ok: false, error: 'unknown' };
  }
  if (!coords) {
    return { ok: false, error: 'timeout' };
  }

  // 3. 最寄り判定
  const nearest = findNearestArea(coords, areas);
  if (!nearest) {
    return { ok: false, error: 'unavailable' };
  }
  if (nearest.distanceKm > OUT_OF_AREA_DISTANCE_KM) {
    return {
      ok: true,
      area: null,
      reason: 'out_of_area',
      nearestDistanceKm: nearest.distanceKm,
      coords,
    };
  }
  return { ok: true, area: nearest.area, distanceKm: nearest.distanceKm, coords };
}
