# 法務文書（プライバシーポリシー・利用規約）ミラー

このフォルダはアプリ内で表示している法務文書の **Markdown ミラー** です。実体は `lib/legal-documents.ts` の `PRIVACY_POLICY` / `TERMS_OF_USE` 定数。

## 目的

- 後日 GitHub Pages / Notion 等で外部公開する際の元データとして使う
- Google Play 申請には外部 URL が必要なため、リリース直前にここを Pages 公開して URL 化する想定

## 同期ルール

**アプリ内（`lib/legal-documents.ts`）を変更したら、必ずこのフォルダの該当 `.md` も更新すること。** 逆も同じ。差分が出ると Google Play 申請時にレビューが落ちる可能性あり。

将来的にビルド時自動生成スクリプトを書ければ二重管理を解消できる（後続改善）。

## ファイル

- [privacy-policy.md](./privacy-policy.md) — プライバシーポリシー
- [terms-of-use.md](./terms-of-use.md) — 利用規約

## 関連チケット

- [docs/22_legal_documents.md](../22_legal_documents.md)
