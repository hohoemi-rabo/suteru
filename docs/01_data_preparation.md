# 01. データ整備（フェーズ0）

> 関連: `REQUIREMENTS.md` §5（データ構造）, §8（データ運用）, §9 フェーズ0, §11.1
> ステータス: ✅ 完了（2026-05-17）

## 目的

MVPで配布する `data/common/*.json` と `data/areas/areas.json` を、公開できる品質に仕上げる。AI生成草稿のままでは行政アピールに耐えないので、PDF原本との照合と拡充が必要。

## 完了条件（達成）

- ✅ 全市共通8ファイル + 地区別1ファイル、PDFと照合済み
- ✅ `meta.json` の `version` が `1.0.0` に到達、`lastUpdated` 更新
- ✅ 各画面の「ベータ版／公式情報を参照」ディスクレイマーは disclaimer フィールドに集約

## Todo

### 全市共通ファイルの作成・整備

- [×] `data/common/meta.json` 作成（version 1.0.0, dataSource を令和8年度PDF照合済みに更新）
- [×] `data/common/basic-rules.json` 作成（袋・証紙・サイズ・重さ・販売所をPDFから抽出）
- [×] `data/common/categories.json` 作成（13カテゴリ定義、Phase 3 で本実装済み・version 1.0.0 に昇格）
- [×] `data/common/special-disposal.json` 作成（パソコン・家電リサイクル・粗大ごみ・蛍光管・小型家電・市非回収・事業ごみの 7 エントリ）
- [×] `data/common/facilities.json` 作成（稲葉クリーンセンター・グリーンバレー千代・前田産業・マエダ・ナカタ商事・丸齒商店の 6 施設）
- [×] `data/common/recycle-stations.json` 作成（ア〜ク 8 グループ × 6 日程 × 計 119 拠点）

### 既存ファイルの拡充・校正

- [×] `data/common/items.json` は Phase 3 で 95 品目に拡充済み。今回 PDF と全件照合し以下を修正:
  - スプレー缶・カセットボンベを `hazardous` → `metal_resource` に訂正（飯田市 PDF では 資源(金属)）
  - 蛍光管の instruction を「特定ごみへ」→「市内電気店・ホームセンターで無料リサイクル回収」に訂正
- [×] `items.json` のプラ資源 vs プラ製品の区分校正（PDF 例示と照合、現状の区分で問題なしと確認）
- [×] `data/common/patterns.json` を PDF と突き合わせて校正 → **既存ドラフトは「埋立=金属=紙が同じ日」前提だったが、実際は 8 区中 6 区で別曜日。8 パターン全て新規作成、命名規則も改定**
- [×] **No.36（丹保・北条・飯沼南）の収集パターン確認**（pattern_tf_thu_n24wed_n13thu）

### 座標データ

- [×] `data/areas/areas.json` の 8 地区 `representativePoint` を OpenStreetMap Nominatim で照合・確定
- [×] `facilities.json` の各施設に lat/lng を付与（6 件中 5 件、丸齒商店のみPDFに住所詳細なし）
- [ ] `recycle-stations.json` の各拠点 (119 件) への lat/lng 付与 — Phase 4 リリース後の追加チケットに切り出し（地図表示は MVP では一覧表示のみで可）

### 公開準備

- [×] 全 JSON を `types/index.ts` で型検証可能（型変更なしで全データ収まることを確認）
- [×] `meta.json` の `disclaimer` 文面確定
- [×] `meta.json` の `officialUrl` を飯田市公式ページ（`https://www.city.iida.lg.jp/site/gomi/`）に設定

## 重要発見（実装中）

1. **MVP の対象 8 区が差し替わった**
   - 旧（OCRベース推測）: No.01, 10, 15, 17, 23, 25, 27, 36
   - 新（PDF原本照合済み）: **No.01, 15, 32, 33, 34, 35, 36, 37**
   - 差し替え理由: 既存 5 区（No.10, 17, 23, 25, 27）は PDF が未入手で検証不可。設計原則「ハルシネーション・ゼロ」に従い、検証可能な区のみ実装

2. **No.37 の存在**
   - REQUIREMENTS.md §2.3 は「No.36 まで」と記載していたが、実際は No.37 まで存在（南条・別府上・別府下）
   - REQUIREMENTS.md の修正が必要

3. **patterns.json 構造**
   - 型定義 `Pattern` は各カテゴリ独立な構造だったので変更不要
   - 既存ドラフトは「埋立=特定=金属=紙が全て同じ日」を前提にデータ入力していた（不正確）
   - 実際: 8 区中 6 区で 埋立特定 と 金属紙 が別の曜日。8 パターン全て新規作成し、命名規則を `pattern_<燃やす>_<プラ>_<埋立特定>[_<金属紙>]` に統一

4. **スプレー缶 = 金属資源（飯田市ルール）**
   - 多くの自治体で「特定ごみ」だが、飯田市 PDF では明確に「資源(金属)」セクションに掲載
   - items.json と categories.json で訂正済み

## 統計（最終）

| ファイル | 件数 |
|---|---:|
| areas | 8 区 |
| patterns | 8 パターン |
| items | 95 品目（13 カテゴリ） |
| facilities | 6 施設（うち 5 件に座標） |
| recycle-stations | 8 グループ × 6 日程 × 119 拠点 |
| special-disposal | 7 エントリ |

## 後続作業

- [ ] `recycle-stations.json` 各拠点の lat/lng 付与（Phase 4 追加チケットに切り出し）
- [ ] REQUIREMENTS.md §2.3 の「No.36 まで」を「No.37 まで」に修正
- [ ] 実機 GPS 検証で代表点 lat/lng の精度確認（誤判定があれば微調整）

## 注意点

- 「燃やすごみ」「燃やせるごみ」は表記揺れあり。**アプリ内表記は「燃やすごみ」で統一**（PDF 表記も「燃やすごみ」）
- 行政アピール時に「全市分のカレンダーを電子データで頂きたい」と交渉カードにする（§10.2）
- 原本 PDF は `data/_sources/` に保管、`.gitignore` で除外（コミットしない）
- 座標は OpenStreetMap Nominatim 由来（© OpenStreetMap contributors, ODbL 1.0）
