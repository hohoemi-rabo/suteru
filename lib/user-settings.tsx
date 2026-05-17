/**
 * UserSettings: 地区ID・通知設定・データバージョン等、ユーザー固有の永続化値。
 *
 * 構成:
 * - 非React な async ヘルパー（getUserSettings/setUserSettings/...）: lib層やバックグラウンドから利用
 * - React Context（UserSettingsProvider/useUserSettings）: 画面から利用、変更時に即再レンダー
 *
 * AsyncStorage 直アクセス禁止のため、`lib/storage.ts` 経由でのみ I/O する。
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { clearCached, getCached, setCached, STORAGE_KEYS } from '@/lib/storage';
import type { UserSettings } from '@/types';

// ============================================================
// 定数
// ============================================================

export const DEFAULT_USER_SETTINGS: UserSettings = {
  areaId: null,
  notificationsEnabled: false,
  notificationTime: '20:00',
  dataVersion: null,
};

/**
 * 永続化フォーマットのスキーマバージョン。
 * UserSettings 型のフィールドを変えたら bump して、読み込み時に DEFAULT へ戻す。
 */
export const USER_SETTINGS_SCHEMA_VERSION = 1;

interface PersistedShape extends UserSettings {
  _schemaVersion: number;
}

// ============================================================
// 非Reactヘルパー
// ============================================================

/**
 * 永続化済み UserSettings を取得。未保存・スキーマ不一致・破損時は null。
 * 呼び出し側は null を DEFAULT_USER_SETTINGS にフォールバックさせる。
 */
export async function getUserSettings(): Promise<UserSettings | null> {
  const raw = await getCached<PersistedShape>(STORAGE_KEYS.USER_SETTINGS);
  if (!raw) return null;
  if (raw._schemaVersion !== USER_SETTINGS_SCHEMA_VERSION) {
    if (__DEV__) {
      console.warn(
        `[user-settings] schema mismatch (stored=${raw._schemaVersion}, current=${USER_SETTINGS_SCHEMA_VERSION}). resetting to defaults`,
      );
    }
    return null;
  }
  // _schemaVersion を剥がして UserSettings として返す
  const { _schemaVersion: _ignored, ...settings } = raw;
  void _ignored;
  return settings;
}

/**
 * UserSettings を完全置換で保存。
 */
export async function setUserSettings(settings: UserSettings): Promise<boolean> {
  const persisted: PersistedShape = {
    _schemaVersion: USER_SETTINGS_SCHEMA_VERSION,
    ...settings,
  };
  return setCached(STORAGE_KEYS.USER_SETTINGS, persisted);
}

/**
 * UserSettings を削除（DEFAULT への戻し）。
 */
export async function clearUserSettings(): Promise<void> {
  await clearCached(STORAGE_KEYS.USER_SETTINGS);
}

/**
 * 初回起動判定。地区未設定なら true。
 * オンボーディング画面（[[13_onboarding_screens]]）の Welcome 表示判定に使う。
 */
export async function isFirstLaunch(): Promise<boolean> {
  const settings = await getUserSettings();
  return settings === null || settings.areaId === null;
}

// ============================================================
// React Context
// ============================================================

interface UserSettingsContextValue {
  /** 現在の設定値。Provider マウント直後は DEFAULT、ハイドレーション後に永続化値で上書き */
  settings: UserSettings;
  /** AsyncStorage 読み込みが完了したか。false の間は表示中の値が DEFAULT の可能性がある */
  isHydrated: boolean;
  /** 部分更新（マージ）して永続化＋state 反映 */
  update: (partial: Partial<UserSettings>) => Promise<void>;
  /** 地区ID専用ヘルパー */
  setAreaId: (id: string | null) => Promise<void>;
  /** 通知ON/OFF専用ヘルパー */
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  /** 通知時刻専用ヘルパー（"HH:mm" 24h） */
  setNotificationTime: (time: string) => Promise<void>;
  /** すべて DEFAULT に戻す */
  reset: () => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const persisted = await getUserSettings();
      if (cancelled) return;
      if (persisted) setSettings(persisted);
      setIsHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = async (partial: Partial<UserSettings>): Promise<void> => {
    const next: UserSettings = { ...settings, ...partial };
    const ok = await setUserSettings(next);
    if (ok) setSettings(next);
  };

  const value: UserSettingsContextValue = {
    settings,
    isHydrated,
    update,
    setAreaId: (id) => update({ areaId: id }),
    setNotificationsEnabled: (enabled) => update({ notificationsEnabled: enabled }),
    setNotificationTime: (time) => update({ notificationTime: time }),
    reset: async () => {
      await clearUserSettings();
      setSettings(DEFAULT_USER_SETTINGS);
    },
  };

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettings(): UserSettingsContextValue {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) {
    throw new Error('useUserSettings() must be used within <UserSettingsProvider>');
  }
  return ctx;
}
