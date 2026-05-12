# 注意点・ハマりどころ

プロジェクト固有のクセや、過去にハマったポイントの蓄積。実装中に気付いたものは随時追加する。

## データまわり

- **No.36地区（丹保・北条・飯沼南）の収集パターン**: OCR崩れがあり未確認。`data/areas/areas.json` で `patternId: "TBD_NEEDS_VERIFICATION"` のままになっている
- **地区数**: 飯田市全体では30〜40地区あるが、MVPは8地区のみ対応。地区選択画面に「上記以外は近日対応予定」を明記すること
- **収集パターンの呼び方**: 「燃やすごみ」と「燃やせるごみ」、地区によって表記揺れがあるかも。データのアプリ内表記は「燃やすごみ」で統一

## Worker

- **`worker/wrangler.toml` の KV id がプレースホルダ**: `PLACEHOLDER_KV_NAMESPACE_ID` のまま。デプロイ前に `wrangler kv:namespace create "RATE_LIMIT"` で作成して置換が必要

## Expoアプリ

- **ルート `README.md` は Expo テンプレートのまま**: プロジェクト概要に差し替えること（[[04_project_setup]]）
- **`reactCompiler` 有効**: `useMemo` / `useCallback` の手動最適化は基本不要。逆に React Compiler が嫌う書き方（条件分岐内のフック等）に注意
- **`npm install` 直は NG**: Expo SDK 54 と非互換バージョンが入りうる。**必ず `npx expo install`**

## ディレクトリ運用

- MVP 実装で追加予定の `lib/` / `types/` / `app/(onboarding)/` 等は **先回りで空ディレクトリ/空ファイルを作らない**。実装時に作る方針
