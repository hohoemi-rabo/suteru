/**
 * 通知サービス（expo-notifications ベース、ローカル通知のみ）。
 *
 * 設計:
 * - React 依存ゼロの純粋 async モジュール。React 側からは app/_layout.tsx の
 *   NotificationsScheduler コンポーネント経由で呼ばれる
 * - 同一日に複数カテゴリ収集なら 1 通にまとめる（例: 「明日は燃やすごみとプラスチック資源の日です」）
 * - 14 日先まで先行予約し、AppState foreground / 設定変化のたびに全削除→再登録
 * - Expo Go では requestPermissionsAsync が SDK 53+ で動かないため、許可済み扱いで通すが
 *   scheduleNotificationAsync の実動作はビルド環境依存（dev build / 本番では正常）
 */

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  COLLECTION_CATEGORIES,
  getCollectionsInRange,
} from '@/lib/schedule-calculator';
import type { CollectionCategoryId, Pattern } from '@/types';

const NOTIFICATION_CHANNEL_ID = 'garbage-reminders';
const DEFAULT_RANGE_DAYS = 14;
const FALLBACK_NOTIFY_HOUR_MINUTE: [number, number] = [20, 0];

const isExpoGo = Constants.appOwnership === 'expo';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

// ============================================================
// boot 時 1 回
// ============================================================

let handlerConfigured = false;

/**
 * 通知ハンドラーと Android チャンネルを 1 度だけ登録。
 * アプリ起動直後（_layout マウント時）に呼ぶ。多重呼び出しは安全。
 */
export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'ごみ収集リマインダー',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#166534',
      sound: 'default',
    });
  }
}

// ============================================================
// 権限
// ============================================================

/** 現在の通知許可状態。Expo Go では常に 'granted'（OS API が動かないため許可前提）。 */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  if (isExpoGo) return 'granted';
  const res = await Notifications.getPermissionsAsync();
  if (res.granted) return 'granted';
  if (res.canAskAgain) return 'undetermined';
  return 'denied';
}

/**
 * 通知許可をリクエスト。許可なら true。
 * Expo Go では OS ダイアログをスキップして true を返す（既存 onboarding の挙動と整合）。
 */
export async function requestPermission(): Promise<boolean> {
  if (isExpoGo) return true;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

// ============================================================
// スケジュール
// ============================================================

export interface RescheduleParams {
  pattern: Pattern;
  categoryLabels: Record<CollectionCategoryId, string>;
  notificationTime: string; // "HH:mm"
  rangeDays?: number;
  now?: Date;
}

/**
 * 既存予約を全削除してから、rangeDays 日先までの収集について「前日 HH:mm」に通知を予約。
 *
 * - 同一日に複数カテゴリが収集される日は 1 通にまとめる
 * - 「前日 HH:mm」が既に過去ならその日はスキップ
 *
 * 戻り値: 実際に登録された通知数
 */
export async function rescheduleNotifications(
  params: RescheduleParams,
): Promise<{ scheduled: number }> {
  const {
    pattern,
    categoryLabels,
    notificationTime,
    rangeDays = DEFAULT_RANGE_DAYS,
    now = new Date(),
  } = params;

  await cancelAllScheduled();

  const days = getCollectionsInRange(pattern, categoryLabels, now, rangeDays);
  const [hour, minute] = parseHHmm(notificationTime);
  const nowMs = now.getTime();
  let scheduled = 0;

  for (const day of days) {
    const notifyAt = new Date(day.date);
    notifyAt.setDate(notifyAt.getDate() - 1);
    notifyAt.setHours(hour, minute, 0, 0);
    if (notifyAt.getTime() <= nowMs) continue;

    const sortedEntries = [...day.entries].sort(
      (a, b) =>
        COLLECTION_CATEGORIES.indexOf(a.categoryId) -
        COLLECTION_CATEGORIES.indexOf(b.categoryId),
    );
    const names = sortedEntries.map((e) => e.categoryName).join('と');
    const dateLabel = format(day.date, 'M月d日（E）', { locale: ja });

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `明日は${names}の日です`,
          body: `${dateLabel} 集積所には朝7時までに出してください`,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notifyAt,
          channelId: NOTIFICATION_CHANNEL_ID,
        },
      });
      scheduled += 1;
    } catch (err) {
      if (__DEV__) console.warn('[notifications] schedule failed:', err);
    }
  }

  return { scheduled };
}

/** すべての予約をキャンセル。本アプリは他の通知種別を持たないため一括で安全。 */
export async function cancelAllScheduled(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    if (__DEV__) console.warn('[notifications] cancelAll failed:', err);
  }
}

/** 開発用: 現在 OS に登録されている予約通知の件数を返す。 */
export async function getScheduledCount(): Promise<number> {
  try {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    return list.length;
  } catch {
    return 0;
  }
}

// ============================================================
// ヘルパー
// ============================================================

function parseHHmm(time: string): [number, number] {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) return FALLBACK_NOTIFY_HOUR_MINUTE;
  const hour = Math.max(0, Math.min(23, Number.parseInt(m[1], 10)));
  const minute = Math.max(0, Math.min(59, Number.parseInt(m[2], 10)));
  return [hour, minute];
}
