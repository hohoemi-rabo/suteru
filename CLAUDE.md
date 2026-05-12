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
│   └── 00_INDEX.md             ← チケット索引（最初に見る）
│
├── app/                        ← Expo Router のページ（ファイルベースルーティング）
├── components/                 ← 再利用コンポーネント
├── hooks/                      ← カスタムフック
├── constants/                  ← 配色など
├── assets/                     ← 画像・フォント
├── scripts/                    ← Expoテンプレートのスクリプト
├── package.json                ← Expo本体の依存
├── app.json                    ← Expo設定（reactCompiler/typedRoutes 有効）
├── tsconfig.json               ← パスエイリアス: "@/*" → "./*"
│
├── data/                       ← バンドル用JSON
│   ├── common/                 ← 全市共通（items.json, patterns.json, ...）
│   └── areas/                  ← 地区別（areas.json）
│
└── worker/                     ← Cloudflare Workers（Gemini APIプロキシ、独立サブプロジェクト）
    ├── README.md               ← Workerのセットアップ・API仕様
    ├── docs/prompt-design.md   ← プロンプト設計の根拠
    ├── src/                    ← index.ts / prompt.ts / gemini.ts / rate-limit.ts / types.ts
    ├── wrangler.toml
    ├── package.json
    └── tsconfig.json
```

MVP 実装で追加予定のディレクトリ（`lib/`, `types/`, `app/(onboarding)/` 等）は、空ディレクトリ/空ファイルを先回り作成せず、実装時に作る方針。

## どこを見ればいいか（タスク別ガイド）

| やりたいこと | 最初に読むファイル |
|---|---|
| 次にやるべき作業を選ぶ | `docs/00_INDEX.md`（チケット索引） |
| Expoアプリのコードを書く | `.claude/rules/expo-app.md` |
| Worker のコードを書く・デプロイする | `.claude/rules/worker.md` → `worker/README.md` |
| ハマったときの解決ヒント | `.claude/rules/gotchas.md` |
| アプリの新しい画面を作る | `REQUIREMENTS.md` の §6 画面設計 |
| データ構造を変える | `REQUIREMENTS.md` の §5 データ構造 |
| Workerのプロンプトを調整する | `worker/docs/prompt-design.md` → `worker/src/prompt.ts` |
| 次回収集日の計算ロジック | `REQUIREMENTS.md` の §5.4 |
| 行政アピールの材料 | `REQUIREMENTS.md` の §10、`docs/02_admin_pitch_materials.md` |
| 何ができていて何が残っているか | `REQUIREMENTS.md` の §9, §11、`docs/00_INDEX.md` |

## 設計原則（変えてはいけないもの）

`REQUIREMENTS.md` §2.4 にもあるが、以下は実装中に揺らがせない:

1. **ハルシネーション・ゼロ**: AIに「飯田市のルールでは...」を答えさせない。AIの役割は品目名の特定だけ
2. **プライバシー最優先**: 画像はサーバーに保存しない、ログにも残さない
3. **オフラインでも基本機能**: カメラ判定以外はオフラインで動く
4. **ベータ表示**: データは未確定なので、各画面に「ベータ版」「公式情報を参照」のディスクレイマー

## 進捗・優先順位

現在の優先順位（2026-05-12時点）:

1. ✅ 要件定義書 v1.1 完成
2. ✅ Cloudflare Worker 雛形完成
3. ⏳ 行政アピール用1ページ資料
4. ⏳ `items.json` を50〜100品目に拡充
5. ⏳ Expoアプリの実装開始

詳しい未確定事項は `REQUIREMENTS.md` §11 を参照。チケット単位の進捗は `docs/00_INDEX.md` 経由で各チケットの Todo を見る。

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
