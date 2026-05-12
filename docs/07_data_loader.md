# 07. データローダー（lib/data-loader.ts）

> 関連: `REQUIREMENTS.md` §5.5（データ更新の流れ）, §8.2
> ステータス: 未着手

## 目的

バンドルされた `data/common/*.json` と `data/areas/areas.json` をアプリ起動時にロードし、起動時にリモートの最新バージョンを確認してダウンロードする仕組みを提供する。

## 完了条件

- アプリ起動から1秒以内にバンドル版データが使える
- リモートに新バージョンがあれば、次回起動から反映される
- リモート取得失敗時はバンドル版にフォールバック
- 設定画面（[[21_settings_screen]]）から手動更新が可能

## Todo

### 基本実装

- [ ] `lib/data-loader.ts` 作成
- [ ] バンドル JSON のインポート（`import items from '@/data/common/items.json'` 形式）
- [ ] [[05_type_definitions]] の型を適用してエクスポート
- [ ] 起動時に同期的にバンドル版を返す `loadBundledData()` 関数
- [ ] グローバルなデータシングルトン（React Context経由でアプリに提供）

### リモート更新ロジック

- [ ] リモートホスト（GitHub raw or Cloudflare R2）の URL を環境変数で持つ
- [ ] `meta.json` をフェッチし、ローカル AsyncStorage の version と比較
- [ ] 新バージョンなら全 JSON をダウンロード
- [ ] AsyncStorage に保存（[[08_storage_layer]] のラッパー経由）
- [ ] ダウンロード失敗時はバンドル版にフォールバック
- [ ] タイムアウト・ネットワーク切断時のハンドリング

### 起動時統合

- [ ] root layout（`app/_layout.tsx`）でバンドル版を即時提供
- [ ] バックグラウンドでリモート更新チェック（UIブロックしない）
- [ ] 更新成功時のフィードバック（再起動を促すか、次回起動で適用するか方針決定）

### 手動更新

- [ ] 設定画面用のエクスポート関数 `checkForDataUpdate()` を提供
- [ ] 更新中のローディング状態を返せるようにする

### キャッシュ整合性

- [ ] AsyncStorage 内の各ファイル version を `meta.json.version` で揃える
- [ ] 部分的に古いデータが残るケースの回避（all-or-nothingで更新）
- [ ] バージョン不整合時のリセット手段

## 注意点

- アプリ起動の最速パスは **バンドル版を同期で返す**。リモート確認は非同期で背景実行
- 起動時にリモート確認を待つと UX が悪化する。**初回画面表示後にチェック開始**
- `meta.json` の `dataSource` と `disclaimer` は UI 表示に使う（[[16_result_screen]] のディスクレイマー）
- 全データを AsyncStorage に入れるとサイズが膨らむ可能性あり。必要なら FileSystem に保存も検討
