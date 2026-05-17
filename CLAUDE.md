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
│   ├── (tabs)/                 ← ホーム / 収集日 / 施設 / 設定 の 4 タブ + areaId ガード
│   └── (onboarding)/           ← Welcome / area-select / notifications
├── lib/                        ← 業務ロジック（純粋関数 or React Context）
│   ├── data-loader.tsx         ← AppData の bundle 即返却 + リモート更新（DataProvider/useData）
│   ├── storage.ts              ← 汎用 AsyncStorage ラッパー（getCached/setCached/clearCached）
│   ├── user-settings.tsx       ← UserSettings 永続化 + Provider/useUserSettings
│   ├── schedule-calculator.ts  ← 次回収集日算出（純粋関数、date-fns）
│   ├── area-detector.ts        ← GPS 最寄り地区判定（純粋関数、Haversine）
│   └── notifications.ts        ← 通知サービス（expo-notifications、14日先までローカル予約）
├── types/index.ts              ← 全 JSON / API / UserSettings の型定義
├── components/                 ← 再利用コンポーネント（現状ほぼ未使用）
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
├── data/                       ← バンドル用 JSON（9ファイル、6 はまだ skeleton）
│   ├── common/                 ← meta / categories / items / patterns / basic-rules /
│   │                              special-disposal / facilities / recycle-stations
│   └── areas/                  ← areas.json
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
| 次回収集日の計算 | `lib/schedule-calculator.ts` の `getNextCollectionDate` / `getAllNextCollections` |
| GPS で最寄り地区判定 | `lib/area-detector.ts` の `detectArea()` |
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

**Phase 2 進行中（12, 18, 21 完了）**。詳しい状態は `docs/00_INDEX.md` を参照。

### 完了済み
- 要件定義書 v1.1 / Cloudflare Worker 雛形（コード完了、デプロイ未実施）
- 03 デザイン叩き台 / 04 プロジェクトセットアップ / 05 型定義
- 07 データローダー / 08 ストレージ層 / 10 収集日計算 / 11 地区判定
- 12 通知サービス / 13 オンボーディング画面 / 14 ホーム画面 / 18 収集日画面 / 21 設定画面

### Phase 2（残り）
- **17 ManualSearch** ← 次の着手（オフライン文字検索、Result 画面 16 ができるまで暫定実装）

### Phase 3（Worker 必須）
- 06 Worker デプロイ / 09 API / 15 Camera / 16 Result

### Phase 4
- 19 Facilities / 20 RecycleStations / 01 データ整備 / 02 行政アピール / 22 法務 / 23 EAS / 24 ユーザーテスト

### データ整備状況（[[01_data_preparation]] 関連）
- 本実装済: `meta.json`, `categories.json`（13値）, `items.json`, `patterns.json`, `areas/areas.json`
- skeleton（`_status: "skeleton"`）: `basic-rules.json`, `special-disposal.json`, `facilities.json`, `recycle-stations.json` ← 01 で実データ流し込み

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
