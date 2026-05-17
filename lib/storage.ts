/**
 * AsyncStorage の薄いラッパー。
 *
 * - すべての AsyncStorage アクセスはこのモジュール経由で行う（直接 import 禁止）
 * - 現状は 07 データローダー用の cache helpers のみ実装
 * - 08 ストレージ層チケットで UserSettings ヘルパー（getUserSettings, setAreaId など）を追加予定
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'suteru:';

export const STORAGE_KEYS = {
  /** 07: リモート更新でダウンロードした AppData 全体（JSONシリアライズ） */
  CACHED_DATA_BUNDLE: `${KEY_PREFIX}data.bundle.v1`,
  /** 08: UserSettings（areaId, 通知ON/OFFなど）。08で実装 */
  USER_SETTINGS: `${KEY_PREFIX}settings.user.v1`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * 任意の JSON シリアライズ可能な値を取得。
 * パース失敗・キー未存在時は null。例外は伝播させない。
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    if (__DEV__) console.warn(`[storage] getCached failed for ${key}:`, err);
    return null;
  }
}

/**
 * 任意の JSON シリアライズ可能な値を保存。
 * 失敗時は false、成功時は true。
 */
export async function setCached<T>(key: string, value: T): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    if (__DEV__) console.warn(`[storage] setCached failed for ${key}:`, err);
    return false;
  }
}

/**
 * 単一キーを削除。
 */
export async function clearCached(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    if (__DEV__) console.warn(`[storage] clearCached failed for ${key}:`, err);
  }
}
