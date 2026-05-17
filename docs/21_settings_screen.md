# 21. 設定画面

> 関連: `REQUIREMENTS.md` §6.1, §3.2
> ステータス: ✅ 完了（2026-05-17）

## 目的

地区変更・通知設定・データ更新確認・利用規約／プライバシーポリシー閲覧を提供する。

## 完了条件

- 地区を8地区から選び直せる
- 通知 ON/OFF・時刻設定ができる
- 「データ更新を確認」ボタンが動く
- 利用規約・プライバシーポリシーが読める
- ベータ版・バージョン表示がある

## Todo

### 基本実装

- [×] `app/(tabs)/settings.tsx` 作成
- [×] グルーピング（地区／通知／データ／アプリ情報／開発者）

### 地区変更

- [×] 現在地区名を表示
- [×] 8地区インライン選択（onboarding と同じカード UI を流用）
- [×] 誤タップ防止に Alert 確認後、`setAreaId` で保存
- [×] 変更後 [[12_notifications]] の再スケジュールは `NotificationsScheduler` が自動実行

### 通知設定

- [×] 通知 ON/OFF スイッチ
- [×] OFF→ON 時: `requestPermission()` で OS ダイアログ、拒否なら revert + Alert 案内
- [×] 通知時刻プリセット（18/19/20/21/22 の 5 ボタン、デフォルト 20:00）
- [×] 通知 OFF 時はプリセットを薄く・disabled に
- [×] 変更時の通知再スケジュールは `NotificationsScheduler` が自動実行（`settings` 依存）

### データ更新

- [×] 「データ更新を確認」ボタン
- [×] 押下で [[07_data_loader]] の `useDataUpdater().check()` を呼び出し
- [×] 更新中ローディング（ボタン disabled + "確認中…"）、結果を Alert
- [×] 現在の data version + 最終更新日 表示

### 情報セクション

- [×] アプリバージョン（`Constants.expoConfig?.version`）
- [×] ベータ版表示はホーム/Scheduleで実施済みのため Settings では割愛（公式リンクで担保）
- [×] [[22_legal_documents]] のプライバシーポリシーリンク（「準備中」と表記、タップで Alert）
- [×] 利用規約リンク（「準備中」と表記、タップで Alert）
- [×] 「公式情報」リンク（`meta.json.officialUrl`）
- [×] 運営: ほほ笑みラボ

### 開発者向け（`__DEV__` のみ）

- [×] 設定リセット（オンボーディング再表示） — 確認 Alert あり
- [×] データキャッシュをクリア — 確認 Alert + 完了 Alert（再起動案内）
- [×] 開発ビルドでのみ表示（`__DEV__` ガード）

### アクセシビリティ

- [×] 各スイッチ・ボタンに `accessibilityLabel` / `accessibilityRole` / `accessibilityState`
- [×] タップ領域は `min-h-11`（44pt）で統一

## 注意点

- 地区変更は **アプリ全体の挙動に影響**（収集日、通知）。**保存後すぐに反映**
- 通知時刻変更は予約済み通知を全部キャンセル → 再予約
- 利用規約・プライバシーポリシーは [[22_legal_documents]] で完成させてからリンクを張る
- React Compiler 環境なので、スイッチの onValueChange を `useCallback` でラップしない
