# 05. 型定義（types/index.ts）

> 関連: `REQUIREMENTS.md` §5.3（主要な型定義）
> ステータス: 未着手

## 目的

REQUIREMENTS.md §5.3 にある型定義を `types/index.ts` に集約し、データ層・lib層・画面層から共通参照できるようにする。

## 完了条件

- `types/index.ts` が存在し、全 JSON データに対する型がエクスポートされている
- `data/common/*.json` を import した時に型推論が効く（または明示的に as cast できる）
- アプリ内コードで `any` を使わずデータを参照できる

## Todo

### 型のエクスポート

- [ ] `types/index.ts` を新規作成
- [ ] `Meta` 型（`meta.json` 対応）
- [ ] `BasicRules` 型（`basic-rules.json` 対応）
- [ ] `Category` 型（`categories.json` 対応）
- [ ] `Item` 型（`items.json` 対応、`aliases` 配列含む）
- [ ] `SpecialDisposal` 型（`special-disposal.json` 対応）
- [ ] `Facility` 型（`facilities.json` 対応）
- [ ] `RecycleStationsData` / `RecycleStationGroup` / `RecycleStationLocation` 型
- [ ] `Pattern` / `CollectionPattern` / `WeekDay` 型（`patterns.json` 対応）
- [ ] `Area` 型（`areas.json` 対応）
- [ ] `CategoryId` 型（カテゴリIDの literal union: `'burnable' | 'plastic_resource' | ...`）

### API・lib層用の型

- [ ] `IdentifyRequest` / `IdentifyResponse` 型（Worker `/api/identify` 対応、`worker/src/types.ts` と整合）
- [ ] `UserSettings` 型（地区ID、通知ON/OFF、通知時刻など、AsyncStorageに入れるもの）
- [ ] `NextCollection` 型（次回収集日の表示用：日付・カテゴリID・カテゴリ名）

### JSON データのインポート方針

- [ ] `tsconfig.json` の `resolveJsonModule` 確認（Expo テンプレートでは有効のはず）
- [ ] バンドル JSON を読む `lib/data-loader.ts`（[[07_data_loader]]）が、これらの型を返す形にする
- [ ] 必要に応じて型ガード関数（`isItem(value): value is Item`）を提供

### 命名・整合性

- [ ] カテゴリIDは patterns.json のキー（`burnable`, `plastic_resource`, ...）と完全一致
- [ ] WeekDay の値（`mon`〜`sun`）が patterns.json と完全一致
- [ ] パスエイリアス `@/types` で参照できる（tsconfig 確認）

## 注意点

- ソース・オブ・トゥルースは REQUIREMENTS.md §5.3。JSON の構造を変えたら、ここの型も同時に更新する
- `worker/src/types.ts` は Worker 専用。アプリの型とは分離（Workerは独立サブプロジェクト）
- カテゴリIDを誤って string で持つと patternId 参照が壊れる。**literal union で保護**
