# これどう捨てる？（仮称）

飯田市のごみ分別を、カメラで撮るだけで教えてくれる Android アプリ。

> **ステータス**: 開発中（ベータ版）。MVP（フェーズ1）実装フェーズ。
>
> 仕様の正本は [`REQUIREMENTS.md`](./REQUIREMENTS.md)、開発者向けガイドは [`CLAUDE.md`](./CLAUDE.md)、チケット索引は [`docs/00_INDEX.md`](./docs/00_INDEX.md)。

## 何ができるか（予定）

- カメラで撮影 → AI が品目を特定 → 飯田市ルールで分別方法を表示
- 文字検索でも品目を調べられる
- 地区別の次回収集日を表示、前夜に通知
- クリーンセンター・リサイクルステーション等の施設情報

## プロジェクト構成

ルート直下は **Expo アプリ**。`worker/` のみ独立した Cloudflare Workers サブプロジェクト。

```
.
├── app/                  Expo Router のページ
├── components/           再利用コンポーネント
├── lib/                  業務ロジック（実装時に作成）
├── types/                TypeScript型定義
├── data/                 バンドル用 JSON（共通・地区別）
├── assets/               画像・フォント
├── docs/                 機能・要件チケット
├── .claude/rules/        Claude Code 向け詳細ルール
└── worker/               Cloudflare Workers（Gemini API プロキシ）
```

## 技術スタック

- **モバイル**: Expo SDK 54 / React 19 / Expo Router 6 / TypeScript
- **スタイル**: NativeWind v4 (Tailwind CSS)
- **AI**: Gemini Vision API（Cloudflare Workers 経由でプロキシ）
- **ストレージ**: AsyncStorage（設定）/ SecureStore（デバイスID）
- **配布**: EAS Build → Google Play

## セットアップ

```bash
npm install
npm start              # Metro 起動（= expo start）
npm run android        # Android エミュレータ
npm run ios            # iOS シミュレータ
npm run web            # Web で起動
npm run lint           # ESLint
```

依存追加時は `npm install` 直ではなく **必ず `npx expo install` を使用**（Expo SDK 54 互換バージョン）。

## 環境変数

`.env.local` をルートに作成し、`.env.example` を参考に値を設定:

```
EXPO_PUBLIC_API_URL=http://localhost:8787
```

- `EXPO_PUBLIC_*` プレフィックス付きの値はビルドに平文で埋め込まれる。**APIキー等の機密値は絶対に入れない**
- Gemini API キーは Worker 側の Secret として管理

## Worker

`worker/` は Cloudflare Workers の独立サブプロジェクト。詳細は [`worker/README.md`](./worker/README.md)。

```bash
cd worker
npm install
npm run dev            # ローカル: http://localhost:8787
```

## ライセンス・連絡先

- 開発: ほほ笑みラボ
- ベータ版のため、データの正確性は飯田市公式情報をご確認ください
