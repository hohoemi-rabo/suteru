# 12. 通知サービス（lib/notifications.ts）

> 関連: `REQUIREMENTS.md` §2.1 F6, §11.4
> ステータス: ✅ 完了（2026-05-17）

## 実装メモ

- `lib/notifications.ts` は React 依存ゼロの純粋 async モジュール
- React 側の駆動は `app/_layout.tsx` の `<NotificationsScheduler />`（DataProvider + UserSettingsProvider の子）
- 同一日複数カテゴリは 1 通にまとめる（"明日は燃やすごみとプラスチック資源の日です"）
- AppState 'active' でも再スケジュール（消化済み通知の補充）
- **Expo Go では実通知は出ない**（ハンドラのみ走る）。Dev Build / 本番ビルドで動作確認のこと
- 識別子衝突を避けるため、再スケジュール時は `cancelAllScheduledNotificationsAsync` で一括消し → 全件登録し直す方針（本アプリは他に通知種別を持たないので安全）

## 目的

`expo-notifications` を使って、ユーザーの地区の **次回収集日の前夜** にローカル通知を送る。プッシュサーバーは不要。

## 完了条件

- 通知許可後、次回収集日の前夜（デフォルト 20:00）に通知が来る
- 設定画面で ON/OFF・時刻変更ができる
- 地区変更時に通知スケジュールが再計算される
- データ更新（[[07_data_loader]]）でパターンが変わったら通知も更新される

## Todo

### 基本実装

- [×] `lib/notifications.ts` 作成
- [×] `requestPermission()`: 許可リクエスト（Expo Go ガード込み）
- [×] `getPermissionStatus()`: 現在の許可状態を返す（'granted' | 'denied' | 'undetermined'）
- [×] `rescheduleNotifications({ pattern, categoryLabels, notificationTime })`: 全削除→14日分予約
- [×] `cancelAllScheduled()`: 全予約をキャンセル
- [×] `getScheduledCount()`: 開発用（DevDiagnostics で表示）
- [×] `configureNotificationHandler()`: boot 時 1 回、Android チャンネル `garbage-reminders` 登録

### スケジュール計算

- [×] [[10_schedule_calculator]] の `getCollectionsInRange()` で 14 日分を日付単位に集約
- [×] 14 日分を先行予約（端末再起動でも消えない）
- [×] 重複予約を防ぐ識別子設計（毎回 cancelAll → 全件登録し直しで衝突回避）

### 通知内容

- [×] タイトル: 「明日は○○の日です」（同日複数カテゴリは「○○と○○」で連結）
- [×] 本文: 「○月○日（○） 集積所には朝7時までに出してください」
- [ ] カテゴリ色を通知バナーに反映（Android）（→ MVP では単一チャンネル `lightColor: #16A34A` のみ。カテゴリ別チャンネル分けは将来検討）

### 通知時刻のカスタマイズ

- [×] デフォルト 20:00（`DEFAULT_USER_SETTINGS.notificationTime`）
- [ ] 設定画面（[[21_settings_screen]]）から変更可能 — 21 でUI実装、`update({notificationTime})` で本サービスが自動再スケジュール
- [×] AsyncStorage 経由で保存（[[08_storage_layer]]）

### 再スケジュールのトリガー

- [×] アプリ起動時に再計算（`NotificationsScheduler` 初回 useEffect）
- [×] 地区変更時（settings.areaId 依存）
- [×] 通知時刻変更時（settings.notificationTime 依存）
- [×] 通知 OFF → ON 切替時（settings.notificationsEnabled 依存）
- [×] データ更新時（data.meta.version 依存）
- [×] AppState 'active' でフォアグラウンド復帰時に再実行

### 初回起動フロー

- [×] [[13_onboarding_screens]] の通知許可ダイアログを `requestPermission()` 経由に統一

### エラーハンドリング

- [×] 通知拒否時: settings.notificationsEnabled は false のまま、Alert で OS 設定誘導（Schedule 画面 Switch）
- [×] スケジュール登録失敗時: try/catch で個別失敗をスキップし戻り値カウントに反映（dev では console.warn）

## 注意点

- expo-notifications はローカル通知のみで動く（プッシュサーバー不要）
- Android 13+ は POST_NOTIFICATIONS パーミッション必須
- 大量予約は端末によって上限あり。**1〜2週間先までで十分**
- 「祝日休み」を考慮しない MVP では、まれに通知が出るが収集なし、というケースが起きる。今後の改善ポイント
