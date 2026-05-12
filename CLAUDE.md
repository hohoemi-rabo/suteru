# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> セッション開始時に最初に読むプロジェクト入口です。プロジェクト全体の地図、規約、よく使うコマンドをまとめています。
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
├── data/                       ← バンドル用JSON（kousei準拠）
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
| アプリの新しい画面を作る | `REQUIREMENTS.md` の §6 画面設計 |
| データ構造を変える | `REQUIREMENTS.md` の §5 データ構造 |
| Workerのプロンプトを調整する | `worker/docs/prompt-design.md` → `worker/src/prompt.ts` |
| Worker をデプロイする | `worker/README.md` のセットアップ |
| 次回収集日の計算ロジック | `REQUIREMENTS.md` の §5.4 |
| 行政アピールの材料 | `REQUIREMENTS.md` の §10 |
| 何ができていて何が残っているか | `REQUIREMENTS.md` の §9, §11 |

## 技術スタック

### Expoアプリ（ルート）

**現在 `package.json` に導入済み**:
- Expo SDK 54 / React 19 / React Native 0.81
- Expo Router 6（typedRoutes / reactCompiler 有効、`app.json` 参照）
- TypeScript（strict）
- ESLint（`eslint-config-expo`）
- React Navigation（bottom-tabs）/ expo-image / expo-haptics / expo-symbols 等

**MVP実装で追加予定**（`REQUIREMENTS.md` §9 に記載、まだ未導入）:
- NativeWind（Tailwind CSS）
- `@react-native-async-storage/async-storage`（地区・通知設定の保存）
- expo-camera / expo-location / expo-notifications
- react-native-maps（Google Maps）
- date-fns（収集日計算）

依存追加時は `package.json` の Expo SDK バージョン（54）に対応するバージョンを `npx expo install` で入れる（`npm install` 直で入れない）。

### worker/（Cloudflare Workers）

- TypeScript + Wrangler 3
- Workers KV（レート制限、`wrangler.toml` の `RATE_LIMIT` バインディング）
- Gemini Vision API（`gemini-2.5-flash`、`wrangler.toml` で切替可）
- Secret: `GEMINI_API_KEY`（`wrangler secret put` で設定）

## Expoベストプラクティス（SDK 54 / Expo Router 6）

context7 MCP で取得した公式ドキュメント（`/expo/expo` の `sdk-54` ブランチ）に基づく、本プロジェクトに関係する要点。

### React Compiler（`app.json` で有効化済み）

- 手動の `useMemo` / `useCallback` は **書かない**。React Compiler が自動でメモ化する
- コンパイラが解析できない書き方は避ける: 条件分岐内のフック呼び出し、描画中の ref ミューテーション、など
- 不安定さに遭遇した場合は、`babel.config.js` の `babel-preset-expo` に `react-compiler.sources` を渡して対象ディレクトリを段階的に絞れる（緊急時のフォールバック手段）

### Expo Router 6 のレイアウト構成

- **入れ子ナビゲータでは外側で `screenOptions={{ headerShown: false }}` を指定**して二重ヘッダーを防ぐ。例:
  ```tsx
  // app/(tabs)/_layout.tsx
  <Tabs screenOptions={{ headerShown: false }}>
    <Tabs.Screen name="index" options={{ title: 'ホーム' }} />
    ...
  </Tabs>
  ```
- スタックを特定タブ配下に入れる場合は `app/(tabs)/<tab>/_layout.tsx` を作成し、**深いリンクの整合性のため `unstable_settings.initialRouteName = "index"` を必ず設定**:
  ```tsx
  export const unstable_settings = { initialRouteName: 'index' };
  export default function FeedLayout() { return <Stack />; }
  ```
- ルートグループ（`(onboarding)`, `(tabs)` 等の括弧付きディレクトリ）は URL に出ず、レイアウト分離だけに使う
- `typedRoutes` 有効のため、`<Link href="...">` は型チェックされる。動的ルートは `href={{ pathname: '/result', params: { id } }}` でパラメータ型も効く

### ストレージの使い分け

- **AsyncStorage**: 地区設定、通知 ON/OFF など **機密でない設定値**（平文保存）
- **`expo-secure-store`**: ハッシュ済みデバイスID、将来導入する可能性のあるトークンなど **暗号化が必要なもの**（iOS Keychain / Android Keystore 経由）
- MVP は認証なし・画像保存なしのため Secure 必須なものは少ないが、Worker 呼び出し時の `X-Device-Id` を生成する場合は SecureStore に保存して再利用する
- iOS で `expo-secure-store` を使う場合は `app.json` の plugins に `["expo-secure-store", { "faceIDPermission": "..." }]` を追加（生体認証連動時のみ）

### 環境変数

- クライアント側で参照する公開値（API URL 等）は **`EXPO_PUBLIC_*` プレフィックス必須**。`process.env.EXPO_PUBLIC_API_URL` で参照
  - ビルド時にバンドルに **平文で埋め込まれる**ため、APIキー等の機密値は絶対に入れない
- 機密値（Gemini APIキー等）はクライアントに置かず、Worker 側の Secret として管理する（このプロジェクトの基本設計）
- `.env` / `.env.local` などはプロジェクトルートに置き、Expo CLI が自動で読み込む

### EAS Build プロファイル設計（APK 配布開始時の指針）

`eas.json` にプロファイルを定義する想定（現状未セットアップ）:

| プロファイル | 用途 | distribution | 設定 |
|---|---|---|---|
| `development` | 開発ビルド | `internal` | デバッグビルド、開発 Worker を指す |
| `preview` | ほほ笑みラボ生徒テスト用 APK | `internal` | リリースビルド、開発 Worker |
| `production` | ストア配布用 | `store` | リリースビルド、本番 Worker |

各プロファイルの `env.EXPO_PUBLIC_API_URL` で、Worker の dev/prod を切り替える設計にする。

## コーディング規約

### TypeScript全般

- 厳格モード（`strict: true`）
- 型定義は明示的に。`any` は原則禁止
- 関数の引数が3つ以上なら named parameters（`{ a, b, c }: Params`）を使う
- ファイル名は kebab-case（`schedule-calculator.ts`）、コンポーネントは PascalCase（`ItemCard.tsx`）

### Expoアプリ

- 状態管理は基本 React の useState / useReducer。Redux等は導入しない（MVPでは不要）
- AsyncStorageへのアクセスは必ず `lib/storage.ts` 経由（実装時に作成）
- API呼び出しは必ず `lib/api.ts` 経由（実装時に作成）
- インポートは `@/...` のパスエイリアスを使う（`tsconfig.json` で `"@/*": ["./*"]` を設定済み）
- 文字列リテラル（UI表示文言）は将来の多言語化を見越して、なるべく1箇所にまとめる

### Worker

- 画像データを **絶対にログに残さない**
- エラーレスポンスに内部情報を含めない（攻撃の手がかりにしない）
- Gemini APIキーは `env.GEMINI_API_KEY` 経由でのみアクセス。コードに直書きしない

## 設計原則（変えてはいけないもの）

`REQUIREMENTS.md` §2.4 にもあるが、以下は実装中に揺らがせない:

1. **ハルシネーション・ゼロ**: AIに「飯田市のルールでは...」を答えさせない。AIの役割は品目名の特定だけ
2. **プライバシー最優先**: 画像はサーバーに保存しない、ログにも残さない
3. **オフラインでも基本機能**: カメラ判定以外はオフラインで動く
4. **ベータ表示**: データは未確定なので、各画面に「ベータ版」「公式情報を参照」のディスクレイマー

## よく使うコマンド

### Expoアプリ（ルートで実行）

```bash
npm install
npm start                   # 開発サーバー（= expo start）
npm run android             # Androidエミュレータで起動
npm run ios                 # iOSシミュレータで起動
npm run web                 # Web版で起動
npm run lint                # ESLint（expo lint）
npm run reset-project       # 雛形にリセット（scripts/reset-project.js）
```

EAS Build（APK配布）は未セットアップ。導入時は `npx eas-cli init` → `eas.json` の作成から。

### worker/

```bash
cd worker
npm install
npm run dev                 # ローカル起動 (http://localhost:8787)
npm run deploy:dev          # 開発環境にデプロイ（wrangler deploy --env development）
npm run deploy:prod         # 本番環境にデプロイ
npm run typecheck           # 型チェックのみ（tsc --noEmit）
npm run secret:gemini       # GEMINI_API_KEY を Secret として登録
npm run tail                # 本番ログのライブ追跡
```

初回セットアップは `worker/README.md` の §セットアップ参照（`wrangler login` → KV namespace 作成 → secret 登録）。

## 進捗・優先順位

現在の優先順位（2026-05-12時点）:

1. ✅ 要件定義書 v1.1 完成
2. ✅ Cloudflare Worker 雛形完成
3. ⏳ 行政アピール用1ページ資料
4. ⏳ `items.json` を50〜100品目に拡充
5. ⏳ Expoアプリの実装開始

詳しい未確定事項は `REQUIREMENTS.md` §11 を参照。

## 注意点・ハマりどころ

- **No.36地区（丹保・北条・飯沼南）の収集パターン**: OCR崩れがあり未確認。`data/areas/areas.json` で `patternId: "TBD_NEEDS_VERIFICATION"` のままになっている
- **地区数**: 飯田市全体では30〜40地区あるが、MVPは8地区のみ対応。地区選択画面に「上記以外は近日対応予定」を明記すること
- **収集パターンの呼び方**: 「燃やすごみ」と「燃やせるごみ」、地区によって表記揺れがあるかも。データのアプリ内表記は「燃やすごみ」で統一
- **`worker/wrangler.toml` の KV id がプレースホルダ**: `PLACEHOLDER_KV_NAMESPACE_ID` のまま。デプロイ前に `wrangler kv:namespace create "RATE_LIMIT"` で作成して置換が必要
- **ルート `README.md` は Expo テンプレートのまま**: プロジェクト概要に差し替えること
- **`reactCompiler` 有効**: `useMemo` / `useCallback` の手動最適化は基本不要。逆に React Compiler が嫌う書き方（条件分岐内のフック等）に注意
