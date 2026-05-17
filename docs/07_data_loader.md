# 07. データローダー（lib/data-loader.tsx）

> 関連: `REQUIREMENTS.md` §5.5（データ更新の流れ）, §8.2
> ステータス: 実装完了（リモートホスト未設定のため remote 部分は no-op）。実ファイル名は `lib/data-loader.tsx`（JSX を含むため）

## 目的

バンドルされた `data/common/*.json` と `data/areas/areas.json` をアプリ起動時にロードし、起動時にリモートの最新バージョンを確認してダウンロードする仕組みを提供する。

## 完了条件

- アプリ起動から1秒以内にバンドル版データが使える
- リモートに新バージョンがあれば、次回起動から反映される
- リモート取得失敗時はバンドル版にフォールバック
- 設定画面（[[21_settings_screen]]）から手動更新が可能

## Todo

### 基本実装

- [×] `lib/data-loader.tsx` 作成（JSX含むため .tsx）
- [×] バンドル JSON のインポート（9ファイル全て静的 import）
- [×] [[05_type_definitions]] の型を適用してエクスポート
- [×] 起動時に同期的にバンドル版を返す `loadBundledData()` 関数
- [×] グローバルなデータシングルトン（React Context経由でアプリに提供）

### リモート更新ロジック

- [×] リモートホスト（GitHub raw or Cloudflare R2）の URL を環境変数で持つ（`EXPO_PUBLIC_DATA_HOST`、未設定なら no-op）
- [×] `meta.json` をフェッチし、ローカル AsyncStorage の version と比較（`compareVersion`）
- [×] 新バージョンなら全 JSON をダウンロード（Promise.all で並行）
- [×] AsyncStorage に保存（[[08_storage_layer]] の `getCached`/`setCached` 経由）
- [×] ダウンロード失敗時はバンドル版にフォールバック
- [×] タイムアウト・ネットワーク切断時のハンドリング（AbortController で10秒）

### 起動時統合

- [×] root layout（`app/_layout.tsx`）でバンドル版を即時提供
- [×] バックグラウンドでリモート更新チェック（UIブロックしない）
- [×] 更新成功時のフィードバック → state 自動更新で次回レンダーから反映、再起動不要

### 手動更新

- [×] 設定画面用のエクスポート関数 `useDataUpdater()` を提供（check メソッドが `'updated' | 'no-change' | 'no-host' | 'error'` を返す）
- [×] 更新中のローディング状態を返せるようにする（`isChecking`）

### キャッシュ整合性

- [×] AsyncStorage 内の各ファイル version を `meta.json.version` で揃える（all-or-nothing で AppData 全体を1キーで保存）
- [×] 部分的に古いデータが残るケースの回避（all-or-nothing で setCached）
- [ ] バージョン不整合時のリセット手段 ← 設定画面（21）のリセットボタンで `clearCached(STORAGE_KEYS.CACHED_DATA_BUNDLE)` 呼ぶ予定

### 不足 JSON ファイルの作成（07 実装に必要だったので併せて実施、本来は [[01_data_preparation]] のスコープ）

- [×] `data/common/meta.json` 本実装
- [×] `data/common/categories.json` 本実装（13エントリ、Tailwindパレット連携）
- [×] `data/common/basic-rules.json` skeleton（`_status: skeleton`）
- [×] `data/common/special-disposal.json` skeleton
- [×] `data/common/facilities.json` skeleton
- [×] `data/common/recycle-stations.json` skeleton

## 注意点

- アプリ起動の最速パスは **バンドル版を同期で返す**。リモート確認は非同期で背景実行
- 起動時にリモート確認を待つと UX が悪化する。**初回画面表示後にチェック開始**
- `meta.json` の `dataSource` と `disclaimer` は UI 表示に使う（[[16_result_screen]] のディスクレイマー）
- 全データを AsyncStorage に入れるとサイズが膨らむ可能性あり。必要なら FileSystem に保存も検討
