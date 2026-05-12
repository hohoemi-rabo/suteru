# 01. データ整備（フェーズ0）

> 関連: `REQUIREMENTS.md` §5（データ構造）, §8（データ運用）, §9 フェーズ0, §11.1
> ステータス: 進行中

## 目的

MVPで配布する `data/common/*.json` と `data/areas/areas.json` を、公開できる品質に仕上げる。AI生成草稿のままでは行政アピールに耐えないので、PDF原本との照合と拡充が必要。

## 現状

- `data/common/items.json`, `patterns.json` と `data/areas/areas.json` は草稿あり
- `data/common/` 配下の `meta.json` / `basic-rules.json` / `categories.json` / `special-disposal.json` / `facilities.json` / `recycle-stations.json` は **未作成**（REQUIREMENTS.md §5.1の構成図にあるのみ）
- No.36（丹保・北条・飯沼南）の `patternId` は `TBD_NEEDS_VERIFICATION` のまま

## 完了条件

- 全市共通8ファイル + 地区別1ファイルが揃い、PDFと照合済み
- `meta.json` の `version` が `1.0.0` に到達、`lastUpdated` 更新
- 各画面に「ベータ版／公式情報を参照」のディスクレイマー表示で公開可

## Todo

### 全市共通ファイルの作成・整備

- [ ] `data/common/meta.json` 作成（version, lastUpdated, dataSource, disclaimer, officialUrl）
- [ ] `data/common/basic-rules.json` 作成（袋・証紙・サイズ・重さ・販売所など §5.3 BasicRules）
- [ ] `data/common/categories.json` 作成（8カテゴリ定義、色・アイコン・袋種別・証紙要否）
- [ ] `data/common/special-disposal.json` 作成（家電リサイクル法・パソコン特別処分）
- [ ] `data/common/facilities.json` 作成（クリーンセンター・最終処分場・家電引取業者）
- [ ] `data/common/recycle-stations.json` 作成（ア〜ク 8グループ、開催日、各拠点）

### 既存ファイルの拡充・校正

- [ ] `data/common/items.json` を主要50〜100品目に拡充（PDF 1ページ目から精読）
- [ ] `items.json` のプラ資源 vs プラ製品の区分を校正（OCR崩れで自信なし）
- [ ] `data/common/patterns.json` を PDF と突き合わせて校正
- [ ] **No.36（丹保・北条・飯沼南）の収集パターン確認**、`areas.json` の `patternId` 確定

### 座標データ

- [ ] `data/areas/areas.json` の8地区 `representativePoint` を Google Maps で確認・確定
- [ ] `facilities.json` の各施設に正確な lat/lng を付与
- [ ] `recycle-stations.json` の各拠点に lat/lng を付与（地図表示するもののみで可）

### 公開準備

- [ ] 全 JSON を JSON Schema または TypeScript 型で検証可能にする（[[05_type_definitions]] と整合）
- [ ] `meta.json` の `disclaimer` 文面を確定（ベータ版・公式情報を参照のうらない）
- [ ] `meta.json` の `officialUrl` を飯田市公式ページに設定

## 注意点

- 「燃やすごみ」「燃やせるごみ」は表記揺れあり。**アプリ内表記は「燃やすごみ」で統一**
- 行政アピール時に「全市分のカレンダーを電子データで頂きたい」と交渉カードにする（§10.2）
- 草稿は AI 生成。**人間（まさゆきさん）の目視校正必須**
