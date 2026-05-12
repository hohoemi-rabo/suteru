# 08. ストレージ層（lib/storage.ts）

> 関連: `CLAUDE.md` §コーディング規約, `REQUIREMENTS.md` §7.1
> ステータス: 未着手

## 目的

AsyncStorage への直アクセスを禁じ、型安全で集約されたラッパーを提供する。設定値のスキーマを一元管理し、マイグレーション時の影響範囲を小さく保つ。

## 完了条件

- `lib/storage.ts` 経由でしか AsyncStorage に触らない（CLAUDE.md §コーディング規約）
- 型付きの get/set 関数で `UserSettings` を読み書きできる
- 初回起動判定（地区未設定）ができる

## Todo

### 基本ラッパー

- [ ] `lib/storage.ts` 作成
- [ ] AsyncStorage のキー一覧を const で定義（`STORAGE_KEYS.USER_SETTINGS` 等）
- [ ] JSON シリアライズ・パースの共通化
- [ ] 型 `UserSettings` を [[05_type_definitions]] から import

### ユーザー設定

- [ ] `getUserSettings()`: 未設定なら `null` を返す
- [ ] `setUserSettings(partial)`: 部分更新可能
- [ ] `setAreaId(id)`, `getAreaId()`: 地区ID専用ヘルパー
- [ ] `setNotificationEnabled(bool)`, `getNotificationEnabled()`
- [ ] `setNotificationTime(hh:mm)`, `getNotificationTime()`

### データキャッシュ用キー

- [ ] [[07_data_loader]] が使う各 JSON のキー定義
- [ ] `getCachedData(key)`, `setCachedData(key, data)` のジェネリック関数
- [ ] `clearCachedData()`: トラブル時のリセット用

### 初回起動判定

- [ ] `isFirstLaunch()`: 地区未設定なら true
- [ ] [[13_onboarding_screens]] の Welcome 画面起動判定に使う

### Secure Store の方針

- [ ] ハッシュ済みデバイスIDは `expo-secure-store` 側に置く（[[09_api_client]] が使う）
- [ ] 地区・通知設定など機密でないものは AsyncStorage で OK
- [ ] storage.ts と secure-storage.ts を分けるか、内部で振り分けるかの方針決定

### エラーハンドリング

- [ ] AsyncStorage 失敗時のフォールバック（デフォルト値を返す）
- [ ] エラーは握りつぶさず、ログには出す
- [ ] JSON パース失敗時の挙動（壊れたキーをクリアする等）

## 注意点

- **設定値の構造を変える時は migration が必要**。AsyncStorage に永続化されたデータが古い形式で残るため、バージョンキーを持って読み込み時に変換する
- `@react-native-async-storage/async-storage` が [[04_project_setup]] で入っていることを確認
- パスは `@/lib/storage` でアクセス
