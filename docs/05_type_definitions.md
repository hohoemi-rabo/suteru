# 05. 型定義（types/index.ts）

> 関連: `REQUIREMENTS.md` §5.3（主要な型定義）
> ステータス: 完了（`types/index.ts` 完成、`@/types` で参照可能）

## 目的

REQUIREMENTS.md §5.3 にある型定義を `types/index.ts` に集約し、データ層・lib層・画面層から共通参照できるようにする。

## 完了条件

- `types/index.ts` が存在し、全 JSON データに対する型がエクスポートされている
- `data/common/*.json` を import した時に型推論が効く（または明示的に as cast できる）
- アプリ内コードで `any` を使わずデータを参照できる

## Todo

### 型のエクスポート

- [×] `types/index.ts` を新規作成
- [×] `Meta` 型（`meta.json` 対応）
- [×] `BasicRules` 型（`basic-rules.json` 対応）
- [×] `Category` 型（`categories.json` 対応）→ `CategoriesData` も併設
- [×] `Item` 型（`items.json` 対応、`aliases` 配列含む）→ `ItemsData` も併設
- [×] `SpecialDisposal` 型（`special-disposal.json` 対応）→ `SpecialDisposalEntry` / `SpecialDisposalData`
- [×] `Facility` 型（`facilities.json` 対応）→ `FacilitiesData` も併設
- [×] `RecycleStationsData` / `RecycleStationGroup` / `RecycleStationLocation` 型
- [×] `Pattern` / `CollectionPattern` / `WeekDay` 型（`patterns.json` 対応）→ `PatternsData` も併設
- [×] `Area` 型（`areas.json` 対応）→ `AreasData` も併設
- [×] `CategoryId` 型（実データ準拠の literal union、13値）
- [×] `CollectionCategoryId` 型（定期収集カテゴリ6値、`patterns.json` キーと一致）

### API・lib層用の型

- [×] `IdentifyRequest` / `IdentifyResponse` 型（`worker/src/types.ts` と同形）
- [×] `UserSettings` 型（areaId, notificationsEnabled, notificationTime, dataVersion）
- [×] `NextCollection` 型（categoryId, categoryName, date）

### JSON データのインポート方針

- [×] `tsconfig.json` の `resolveJsonModule` 確認（`expo/tsconfig.base` で有効）
- [ ] バンドル JSON を読む `lib/data-loader.ts`（[[07_data_loader]]）が、これらの型を返す形にする
- [ ] 必要に応じて型ガード関数（`isItem(value): value is Item`）を提供

### 命名・整合性

- [×] CollectionCategoryId は patterns.json のキー（burnable, plastic_resource, ...）と完全一致
- [×] WeekDay の値（mon〜sun）が patterns.json と完全一致
- [×] パスエイリアス `@/types` で参照できる（import smoke test 実施）

## 注意点

- ソース・オブ・トゥルースは REQUIREMENTS.md §5.3 + `data/` 配下の実JSON。**実JSON のカテゴリIDが §5.3 の8カテゴリより多い13値だったため、`CategoryId` は実データ準拠にした**。`categories.json` を新規作成する際（[[01_data_preparation]]）は 13カテゴリに合わせるか、定義する8カテゴリに `items.json` を寄せ直すか決定が必要
- `worker/src/types.ts` は Worker 専用。アプリの型とは分離（Workerは独立サブプロジェクト）。`IdentifyRequest`/`Response` は手動で同期する
- カテゴリIDを誤って string で持つと patternId 参照が壊れる。**literal union で保護**
