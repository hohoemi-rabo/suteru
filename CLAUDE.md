# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> セッション開始時に最初に読むプロジェクト入口です。プロジェクト全体の地図、設計原則、進捗、チケット運用をまとめています。
> 仕様の正本は `REQUIREMENTS.md`。本ファイルとずれがあれば `REQUIREMENTS.md` を優先し、本ファイルを更新する。

## プロジェクト概要

**「これどう捨てる？」(仮称)** - 飯田市のごみ分別を、カメラで撮るだけで教えてくれるAndroidアプリ。

- **ターゲット**: 飯田市在住者全般（シニア・新住民・若年層問わず）
- **目的**: 「ゴミの捨て方が分からない」を写真一枚で解決し、市役所の問い合わせ業務軽減にも寄与
- **フェーズ1スコープ**: Android、日本語、8地区対応、認証なし、画像保存なし

詳しい仕様は `REQUIREMENTS.md` に記載。

## プロジェクト構造

このリポジトリは **ルート直下が Expo アプリ本体**で、`worker/` のみ独立したサブプロジェクト（別 `package.json` / `tsconfig.json` / `wrangler.toml`）。

```
.
├── CLAUDE.md                   ← このファイル（プロジェクト入口）
├── REQUIREMENTS.md             ← アプリ仕様の正本
│
├── .claude/rules/              ← 詳細ルール集（必要時に参照）
│   ├── expo-app.md             ← Expoアプリ規約・コマンド・SDKベストプラクティス
│   ├── worker.md               ← Worker規約・コマンド・プライバシー要件
│   └── gotchas.md              ← 注意点・ハマりどころ
│
├── docs/                       ← 機能・要件単位のチケット
│   └── 00_INDEX.md             ← チケット索引・Phase 進捗（最初に見る）
│
├── app/                        ← Expo Router のページ
│   ├── _layout.tsx             ← root Stack: DataProvider + UserSettingsProvider + NotificationsScheduler
│   ├── camera.tsx              ← カメラ撮影＋判定（CameraView + ImageManipulator + identifyItem）
│   ├── search.tsx              ← 手動品目検索（一覧、ヒットタップで /result へ push）
│   ├── result.tsx              ← F1/F2 共通の結果画面（カテゴリ別表示 + 次回収集日 + GPS判定で地区永続化）
│   ├── recycle-stations.tsx    ← リサイクルステーション 8グループ一覧（タブ外、Facilities から push）
│   ├── (tabs)/                 ← ホーム / 収集日 / 施設 / 設定 の 4 タブ + areaId ガード
│   ├── (onboarding)/           ← Welcome / area-select / notifications
│   └── legal/                  ← プライバシーポリシー / 利用規約（設定から push）
├── lib/                        ← 業務ロジック（純粋関数 or React Context）
│   ├── data-loader.tsx         ← AppData の bundle 即返却 + リモート更新（DataProvider/useData）
│   ├── storage.ts              ← 汎用 AsyncStorage ラッパー（getCached/setCached/clearCached）
│   ├── user-settings.tsx       ← UserSettings 永続化 + Provider/useUserSettings
│   ├── schedule-calculator.ts  ← 次回収集日算出（純粋関数、date-fns）
│   ├── recycle-station-utils.ts ← リサイクルステーション次回開催日（dates 配列スキャン）
│   ├── area-detector.ts        ← GPS 最寄り地区判定（純粋関数、Haversine）
│   ├── area-detection-ui.ts    ← GPS判定結果の確認ダイアログ→setAreaId 共通フロー
│   ├── notifications.ts        ← 通知サービス（expo-notifications、14日先までローカル予約）
│   ├── text-search.ts          ← 品目検索の正規化＋スコアリング（純粋関数、ひらがな⇄カナ吸収）
│   ├── category-maps.ts        ← categoryId → name/color マップを 1 loop で構築（純粋関数）
│   ├── legal-documents.ts      ← プライバシーポリシー / 利用規約の本文（LegalDocument 型）
│   └── api.ts                  ← Worker /api/identify クライアント（10秒タイムアウト、デバイスIDハッシュ送信）
├── types/index.ts              ← 全 JSON / API / UserSettings の型定義
├── components/                 ← 再利用コンポーネント
│   └── LegalDocumentScreen.tsx ← 法務文書の共通レンダラ（privacy-policy / terms-of-use 両方で使う）
├── assets/                     ← 画像・フォント
├── scripts/                    ← Expoテンプレートのスクリプト
├── tailwind.config.js          ← NativeWind v4 設定（brand/accent/warn/ink/cat カラー）
├── global.css                  ← NativeWind の @tailwind directives
├── babel.config.js             ← babel-preset-expo + nativewind/babel
├── metro.config.js             ← withNativeWind ラップ
├── nativewind-env.d.ts         ← NativeWind 型サポート
├── package.json
├── app.json                    ← reactCompiler/typedRoutes 有効、各種 plugins 設定済み
├── tsconfig.json               ← パスエイリアス: "@/*" → "./*"、worker/ 除外
│
├── data/                       ← バンドル用 JSON（品目辞書は公式さんあ〜る、収集日系は PDF）
│   ├── common/                 ← meta / categories / items / patterns / basic-rules /
│   │                              special-disposal / facilities / recycle-stations
│   ├── areas/                  ← areas.json（MVP 対象 8 区: No.01/15/32/33/34/35/36/37）
│   └── _sources/               ← 原本 PDF + さんあ〜る抽出/変換 JSON（.gitignore 済、コミットしない）
│
├── docs/legal/                 ← 法務文書 Markdown ミラー（GitHub Pages 公開用、lib/legal-documents.ts と同期）
│
└── worker/                     ← Cloudflare Workers（Gemini APIプロキシ、独立サブプロジェクト）
    ├── README.md               ← Workerのセットアップ・API仕様
    ├── docs/prompt-design.md   ← プロンプト設計の根拠
    ├── src/                    ← index.ts / prompt.ts / gemini.ts / rate-limit.ts / types.ts
    ├── wrangler.toml
    ├── package.json
    └── tsconfig.json
```

実装の進行状況・次に何をやるかは `docs/00_INDEX.md` を参照（Phase 1〜4 の構成と各チケット状態を一覧化）。

## どこを見ればいいか（タスク別ガイド）

| やりたいこと | 最初に読むファイル |
|---|---|
| 次にやるべき作業を選ぶ | `docs/00_INDEX.md`（チケット索引・Phase 進捗） |
| Expoアプリのコードを書く | `.claude/rules/expo-app.md` |
| Worker のコードを書く・デプロイする | `.claude/rules/worker.md` → `worker/README.md` |
| ハマったときの解決ヒント | `.claude/rules/gotchas.md` |
| アプリの新しい画面を作る | `REQUIREMENTS.md` §6 + 該当チケット（13/14/16/18/19/20/21） |
| データ構造を変える | `REQUIREMENTS.md` §5 + `types/index.ts` |
| データを画面から使う | `lib/data-loader.tsx` の `useData()` を使う |
| 設定値（地区・通知）を読み書き | `lib/user-settings.tsx` の `useUserSettings()` |
| カテゴリ ID → 表示名/色を引く | `lib/category-maps.ts` の `buildCategoryMaps(data.categories)` |
| 次回収集日の計算 | `lib/schedule-calculator.ts` の `getNextCollectionDate` / `getAllNextCollections` |
| リサイクルステーションの次回開催日 | `lib/recycle-station-utils.ts` の `getNextStationCollection` / `getUpcomingStationDates` |
| GPS で最寄り地区判定 | `lib/area-detector.ts` の `detectArea()` |
| GPS判定後に確認ダイアログ→設定永続化 | `lib/area-detection-ui.ts` の `handleDetectionResultWithConfirm()` |
| 法務文書（プライバシー/利用規約）を編集 | `lib/legal-documents.ts` + 同期して `docs/legal/*.md` も更新 |
| Workerのプロンプトを調整する | `worker/docs/prompt-design.md` → `worker/src/prompt.ts` |
| 行政アピールの材料 | `REQUIREMENTS.md` §10、`docs/02_admin_pitch_materials.md` |
| 何ができていて何が残っているか | `docs/00_INDEX.md`（各チケットに ✅/⏳ マーク） |

## 設計原則（変えてはいけないもの）

`REQUIREMENTS.md` §2.4 にもあるが、以下は実装中に揺らがせない:

1. **ハルシネーション・ゼロ**: AIに「飯田市のルールでは...」を答えさせない。AIの役割は品目名の特定だけ
2. **プライバシー最優先**: 画像はサーバーに保存しない、ログにも残さない
3. **オフラインでも基本機能**: カメラ判定以外はオフラインで動く
4. **ベータ表示**: データは未確定なので、各画面に「ベータ版」「公式情報を参照」のディスクレイマー

## 進捗（2026-05-17 時点）

**Phase 4 を 4/7 完了**。残りは 02 行政アピール資料 / 23 EAS Build / 24 ユーザーテストの 3 本。詳しい状態は `docs/00_INDEX.md` を参照。

### 完了済みチケット（21 本）

- **Phase 1〜3**: 03〜18, 21（17 本）
- **Phase 4 完了分（4 本）**:
  - 01 データ整備（全 9 JSON v1.0.0、PDF 原本照合済み、MVP 区差し替え）
  - 19 Facilities（タブ実装、外部 Google Maps リンク、リサイクルステーションへの動線）
  - 20 RecycleStations（push 画面、8 グループ × 119 拠点を次回開催日順で展開）
  - 22 法務文書（プライバシーポリシー + 利用規約、設定タブから push、Markdown ミラー）

### 残り Phase 4 チケット（3 本）

| # | 内容 | 備考 |
|---|---|---|
| **02** | 行政アピール資料 | 飯田市環境課向け 1 ページ資料、コード変更なし |
| **23** | EAS Build / Play 配布 | preview APK、`docs/legal/*.md` を GitHub Pages 等で公開し URL 化、データセーフティフォーム |
| **24** | ユーザーテスト | ほほ笑みラボ生徒約 20 名、23 で APK 配布後に着手 |

### 実機検証済み（2026-05-17）

- カメラ撮影 → Worker → Gemini → 品目判定 → /result 表示の一連がフロー動作
- Worker ログに画像データが残らないこと（プライバシー設計の実証）
- 電池→「乾燥剤」と Gemini が見間違うケース 1 件（データは両品目とも正常、AI ハルシネーション）。MVP 許容範囲として 24 番チケット観察項目に記録済み

### Worker デプロイ状態

- dev:  `https://kore-dou-suteru-api-dev.rabo-hohoemi.workers.dev`
- prod: `https://kore-dou-suteru-api-production.rabo-hohoemi.workers.dev`
- AI モデル: **`gemini-3.1-flash-lite`**（`worker/wrangler.toml`、dev/prod 共通）
- KV ネームスペース: dev/prod 共有（レート制限は端末 ID 別キー）
- `[env.X]` 配下に `kv_namespaces` と `vars` を明示する必要あり（上書きしない！ → `.claude/rules/gotchas.md` 参照）

### データ整備状況

- **品目辞書（items.json）は飯田市公式アプリ「さんあ〜る」589品目に全置換**（81d0200、version 1.1.0）
  - 出典: `https://manage.delight-system.com/threeR/web/bunbetsu?jichitaiId=iidashi`（飯田市公式の分別検索アプリ）。利用許諾は 02 行政アピールで対応予定
  - 旧 95 品目（手作り）→ 589 品目。検索でヒットしない品目が激減
  - `categoryId` は公式の主区分（先頭区分）を 11 値にマップ。複数区分の部品別の捨て方は `instruction` に保持（【埋】【特】等）
  - 別名（aliases）は公式の `data-keyword` から抽出（検索品質維持）。5品目は公式に別名データが無く空
  - 生データ・変換中間ファイルは `data/_sources/sanaru-bunbetsu.json` / `items-converted.json`（gitignore）
- **カテゴリが 13 → 11 に**（categories.json version 1.1.0）: `plastic_product`（公式はプラを資源(プラ)1本化）と `oversized`（公式は大型品も素材別分類）を削除。`types/index.ts` の CategoryId も 11 値
- **収集日・施設・リサイクルステーションは引き続き令和8年度 PDF ベース**（8区: No.01/15/32-37）
  - facilities 6 施設 / recycle-stations 8 グループ × 119 拠点 / special-disposal 7 エントリ / patterns 8 種 / basic-rules
- **MVP 対象 8 区**: No.01 / 15 / 32 / 33 / 34 / 35 / 36 / 37（01 市街中心、15 座光寺、32〜35 下黒田周辺、36 丹保・北条・飯沼南、37 南条・別府上・別府下）
- **patterns.json**: 8 区中 6 区で「埋立 と 金属/紙 が別曜日」。命名規則 `pattern_<燃やす>_<プラ>_<埋立特定>[_<金属紙>]`
- **No.37 の存在**: REQUIREMENTS.md §2.3 は「No.36 まで」だが実態は No.37 まで（要修正）
- **注意: PDF とさんあ〜るで分類体系が一部異なる**（プラの分け方など）。品目辞書はさんあ〜る、収集パターンは PDF が正本

### result.tsx の GPS 地区判定（11be98a で変更）

- 旧仕様: 「現在地で確認」ボタン → 一時的に地区を上書き表示、ホームに戻ると元の地区に戻る
- 新仕様: 「現在地から地区を設定」ボタン → 確認ダイアログ → `UserSettings.areaId` を永続化更新
- 共通フローは `lib/area-detection-ui.ts` の `handleDetectionResultWithConfirm()` に集約（将来ホーム画面などに同じ動線を追加する場合も再利用可）

### UI/UX ブラッシュアップ（0d8c53b）

- **WCAG AA カラーパス**: `tailwind.config.js` の brand-500 `#15803D` / brand-600 `#166534` / warn-600 `#991B1B` に変更（白文字・リンク文字が全て AA 通過）。ハードコード hex も全置換
- **文字サイズ底上げ**: disclaimer/警告/住所/施設情報など重要情報を text-xs→sm / sm→base に。ベータ版バッジは全画面統一（settings 含む）
- **カメラ判定枠**: `app/camera.tsx` に中央の正方形枠（75%）+ 暗幕 + 角ブラケット + ヒント文。撮影時に枠サイズで中心クロップしてから Gemini 送信 → 枠外は判定対象外
- 方針: シニア専用ではなく「誰でも使いやすい」ユニバーサルデザイン

### コードレビュー指摘の状態（vercel-react-best-practices）

- ✅ #2 カテゴリ Map ヘルパー DRY 化（`lib/category-maps.ts` 作成、3 ファイルの重複削除、97c911c）
- ✅ #3 `app/camera.tsx` の no-op `onCameraReady` コールバック削除（カメラ枠実装時に対応、0d8c53b）
- ⏳ #1 `router` 直接 import vs `useRouter()` Hook の混在統一（軽微、未着手）

### 後続作業（チケット未切り出し）

- **さんあ〜る品目データの利用許諾**（飯田市・delight-system）— 02 行政アピールで対応。リリース前必須
- items.json の警告（warnings）整備 — 公式変換では全 warnings 空。重要注意（火災・けが等）は instruction 内にあるが、別フィールド化は未
- recycle-stations.json 各拠点 119 件への lat/lng 付与（MapView 導入と「最寄りグループ推定」の前提）
- 法務文書の外部 URL 公開（23 EAS Build 直前）
- 法務文書の弁護士・行政書士確認（本格リリース前推奨）
- 飯田市公式情報の利用許諾打診（02 と並行）
- PDF とさんあ〜るのプラ分類体系の差異の最終確認（現状はさんあ〜る優先）
- REQUIREMENTS.md §2.3 の「No.36 まで」→「No.37 まで」修正

## チケット管理（`docs/` 配下）

要件・機能ごとに `docs/` 配下に連番付きチケットファイルを置いている。`docs/00_INDEX.md` が索引なので、作業開始前にまず参照する。

### Todo記法のルール（**重要**）

各チケットファイル内の Todo は以下の記法で管理する:

- 未完了: `- [ ] タスク内容`
- **完了: `- [×] タスク内容`**（`×` は **全角の乗算記号 U+00D7**）

タスクを完了させたら、必ず `- [ ]` を `- [×]` に書き換えること。通常の Markdown チェックボックスの `- [x]`（半角小文字 x）ではなく、**全角 × 記号** を使う点に注意。

例:
```
- [ ] まだやってないこと
- [×] 完了したこと
```

新しい Todo が発生したらそのチケットの該当セクションに `- [ ]` 形式で追記する。スコープが既存チケットを超える場合は、新しい連番のチケットを `docs/` に切ること。

## 詳細ルールへの参照

サブ領域固有の規約は `.claude/rules/` 配下の個別ファイルに分けている。該当領域の実装に入る前に読む:

- **Expoアプリ**を触る前 → @.claude/rules/expo-app.md
- **Worker**を触る前 → @.claude/rules/worker.md
- **何かに詰まったとき** → @.claude/rules/gotchas.md
