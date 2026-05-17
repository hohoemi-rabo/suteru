/**
 * 地区判定（GPS）の UI フィードバック共通ヘルパー。
 *
 * lib/area-detector.ts は「権限→GPS→最寄り判定」までの純粋ロジック。
 * このモジュールは、その結果に対して Alert ダイアログを出し、
 * 必要なら UserSettings の地区を永続化更新する流れを共通化する。
 *
 * 利用先:
 * - app/result.tsx: 「現在地から地区を設定」ボタン
 * - app/(tabs)/index.tsx: ホームヘッダーの GPS ボタン
 *
 * 設計:
 * - React 依存なし。Alert / Linking を直接使う（lib/notifications.ts と同じ流儀）
 * - 同じ地区が判定された場合は「変更不要」メッセージで終了
 * - 異なる地区なら「○○ から △△ に変更しますか？」と確認してから setAreaId 呼出
 */

import { Alert, Linking } from 'react-native';

import type { Area } from '@/types';

import type { DetectionResult } from './area-detector';

export type SetAreaIdFn = (id: string) => Promise<void>;

/**
 * GPS 判定結果を受け取り、ユーザ確認の上で地区を永続化更新する。
 *
 * @param result detectArea() の戻り値
 * @param currentArea 現在の設定地区（無ければ null）
 * @param setAreaId useUserSettings().setAreaId を渡す
 */
export function handleDetectionResultWithConfirm(
  result: DetectionResult,
  currentArea: Area | null,
  setAreaId: SetAreaIdFn,
): void {
  if (!result.ok) {
    if (result.error === 'permission_denied') {
      Alert.alert(
        '位置情報の許可が必要です',
        '端末の設定アプリ → アプリ → 位置情報 で許可してください。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '設定を開く', onPress: () => void Linking.openSettings() },
        ],
      );
    } else {
      Alert.alert(
        '位置情報を取得できませんでした',
        detectionErrorLabel(result.error),
      );
    }
    return;
  }

  if (result.area === null) {
    Alert.alert(
      '対応エリア外です',
      `最寄り地区まで ${result.nearestDistanceKm.toFixed(1)} km。設定の地区はそのままです。`,
    );
    return;
  }

  const detected = result.area;

  // 現在の設定と同じ地区なら、変更不要のメッセージを出して終了
  if (currentArea?.id === detected.id) {
    Alert.alert(
      '現在地を確認しました',
      `現在地は「${detected.name}」です。設定済みの地区と同じため、変更はありません。`,
    );
    return;
  }

  // 異なる地区が判定された場合は、確認の上で永続化
  Alert.alert(
    '地区を変更しますか？',
    currentArea
      ? `現在地は「${detected.name}」と判定されました。\n地区を「${currentArea.name}」から「${detected.name}」に変更しますか？`
      : `現在地は「${detected.name}」と判定されました。\nこの地区を設定しますか？`,
    [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '変更する',
        onPress: () => {
          void setAreaId(detected.id);
        },
      },
    ],
  );
}

function detectionErrorLabel(error: string): string {
  switch (error) {
    case 'timeout':
      return '位置情報の取得がタイムアウトしました。電波状況をご確認ください。';
    case 'unavailable':
      return 'この端末では位置情報が利用できません。';
    default:
      return '不明なエラーが発生しました。';
  }
}
