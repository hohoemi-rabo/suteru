# 08. ストレージ層（lib/storage.ts + lib/user-settings.tsx）

> 関連: `CLAUDE.md` §コーディング規約, `REQUIREMENTS.md` §7.1
> ステータス: 完了（UserSettings 永続化、React Context、初回起動判定まで実装）

## 実装ファイルの分割

当初は `lib/storage.ts` 1 ファイルで全部抱える設計だったが、汎用 AsyncStorage ラッパーとドメイン特化のUserSettings を分けた:

- **`lib/storage.ts`**: 汎用 AsyncStorage ラッパー（`getCached` / `setCached` / `clearCached` + `STORAGE_KEYS`）。React 依存なし
- **`lib/user-settings.tsx`**: UserSettings 永続化 + React Context（`UserSettingsProvider` / `useUserSettings`）。`storage.ts` 経由でしか AsyncStorage に触らない

これにより、storage.ts は将来の他ドメイン（例: 履歴・お気に入り）追加時にも再利用できる純粋ラッパーになる。AsyncStorage 直アクセス禁止のルールは両ファイル経由で担保。

## 目的

AsyncStorage への直アクセスを禁じ、型安全で集約されたラッパーを提供する。設定値のスキーマを一元管理し、マイグレーション時の影響範囲を小さく保つ。

## 完了条件

- `lib/storage.ts` 経由でしか AsyncStorage に触らない（CLAUDE.md §コーディング規約）
- 型付きの get/set 関数で `UserSettings` を読み書きできる
- 初回起動判定（地区未設定）ができる

## Todo

### 基本ラッパー

- [×] `lib/storage.ts` 作成（07で先行作成）
- [×] AsyncStorage のキー一覧を const で定義（`STORAGE_KEYS` に `CACHED_DATA_BUNDLE` / `USER_SETTINGS`）
- [×] JSON シリアライズ・パースの共通化（`getCached<T>` / `setCached<T>`）
- [×] 型 `UserSettings` を [[05_type_definitions]] から import

### ユーザー設定（`lib/user-settings.tsx`）

- [×] `getUserSettings()`: 未保存・スキーマ不一致なら `null` を返す
- [×] `setUserSettings(next)`: 完全置換で永続化（部分更新はProviderの `update()` で対応）
- [×] `setAreaId(id)`: 地区ID専用ヘルパー（hook 経由）
- [×] `setNotificationsEnabled(bool)`: 通知ON/OFF専用ヘルパー
- [×] `setNotificationTime("HH:mm")`: 通知時刻専用ヘルパー
- [×] `update(partial)`: 部分更新（マージ＋永続化＋state反映）
- [×] `reset()`: DEFAULT に戻す（`clearUserSettings()` 経由）
- [×] React Context（`UserSettingsProvider` / `useUserSettings`）で画面から利用可能に
- [×] `isHydrated` フラグで「永続化値が読めたか」を公開（13 のルーティング判定で利用予定）

### データキャッシュ用キー

- [×] [[07_data_loader]] が使う各 JSON のキー定義（`CACHED_DATA_BUNDLE` 1 キーで AppData 全体をまとめる）
- [×] `getCached(key)`, `setCached(key, data)` のジェネリック関数
- [×] `clearCached(key)`: トラブル時のリセット用

### 初回起動判定

- [×] `isFirstLaunch()`: 地区未設定なら true
- [ ] [[13_onboarding_screens]] の Welcome 画面起動判定に使う ← 13 で配線

### Secure Store の方針

- [×] **方針決定**: `lib/storage.ts` (AsyncStorage) と `lib/secure-storage.ts`（仮、09 で作成） に **分離**する。混在を避けて責務を明確化
- [ ] ハッシュ済みデバイスID（X-Device-Id 用）は 09 API クライアントで `expo-secure-store` 経由実装

### エラーハンドリング

- [×] AsyncStorage 失敗時のフォールバック: `getCached` は null、`setCached` は false を返す
- [×] エラーは `__DEV__` で console.warn、本番では握りつぶす
- [×] JSON パース失敗時: null を返す（壊れたキーは次回 setCached で上書きされる）
- [×] スキーマバージョン不一致時: 警告ログ + null（DEFAULT 戻し）

### マイグレーション（MVP最小）

- [×] `_schemaVersion` フィールドで保存。バージョン違いは DEFAULT 戻し
- [ ] フィールド追加の都度 `USER_SETTINGS_SCHEMA_VERSION` を bump する運用 ← フィールド追加時に対応

## 注意点

- **設定値の構造を変える時は migration が必要**。`USER_SETTINGS_SCHEMA_VERSION` を bump すると保存済み値は DEFAULT に戻る（MVP では許容、ユーザー影響は地区再選択のみ）
- `@react-native-async-storage/async-storage` が [[04_project_setup]] で導入済み
- パス: 汎用ラッパーは `@/lib/storage`、UserSettings は `@/lib/user-settings`
- **Provider 入れ子順**: `DataProvider` の内側に `UserSettingsProvider`（`app/_layout.tsx`）
- **ハイドレーション前の値**: `useUserSettings()` の `settings` は Provider マウント直後は `DEFAULT_USER_SETTINGS`。永続化値の反映は `isHydrated === true` 後。13 オンボーディングのルーティング判定では `isHydrated && !settings.areaId` を使う
- **設定変更の副作用は呼び出し側で**: 通知再スケジュール等は 21 設定画面の `useEffect` で実施。08 は永続化＋state更新まで
