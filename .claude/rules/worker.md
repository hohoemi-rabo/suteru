# Worker 規約（Cloudflare Workers）

`worker/` 配下の独立サブプロジェクト（別 `package.json` / `tsconfig.json` / `wrangler.toml`）。Gemini Vision API へのプロキシ（APIキー保護・レート制限・プロンプトインジェクション対策）に加え、未収録品目の報告転送も担う。

## エンドポイント

- `POST /api/identify` — 画像 → 品目名（Gemini）
- `POST /api/report` — 未収録品目の報告を運用者へ転送（`src/report.ts`）。**テキストのみ受理・画像/位置情報/元デバイスID は受け取らない**。`/api/identify` と同じ 10 回/分の KV レート枠を共有。詳細は `docs/25_missing_item_report.md`
- `GET /healthz` — ヘルスチェック

## 技術スタック

- TypeScript + Wrangler 3
- Workers KV（レート制限、`wrangler.toml` の `RATE_LIMIT` バインディング）
- Gemini Vision API（`gemini-3.1-flash-lite`、`wrangler.toml` で切替可）
- Secret: `GEMINI_API_KEY`（必須）
- Secret（任意・report の通知先。`forwardReport` が参照）:
  - `LINE_CHANNEL_ACCESS_TOKEN` + `LINE_TO` — LINE Messaging API の push（**LINE Notify は 2025-03 終了済みのため Messaging API を使う**。push 到達には bot を友だち追加）
  - `REPORT_WEBHOOK_URL` — Discord 互換 `{ content }`
  - 両方あれば両方へ送る。未設定でも報告は受理（success: true、転送しないだけ）。**Secret は env 別に登録**（dev/prod とも登録済み・LINE 到達確認済み 2026-06-27）

## コーディング規約

- 画像データを **絶対にログに残さない**
- エラーレスポンスに内部情報を含めない（攻撃の手がかりにしない）
- Gemini APIキーは `env.GEMINI_API_KEY` 経由でのみアクセス。コードに直書きしない
- プロンプトの調整時は `worker/docs/prompt-design.md` の設計原則に立ち返る

## プライバシー要件（重要）

`REQUIREMENTS.md` §2.4・§7 で **設計原則として揺らがせない** とされる項目:

1. **ハルシネーション・ゼロ**: AIに「飯田市のルールでは...」を答えさせない。AIの役割は品目名の特定だけ。カテゴリ判定はアプリ側 `items.json` で行う
2. **画像を保存しない**: Gemini 送信後即破棄、ログにも残さない（行政アピール時の根拠）
3. **プロンプト固定**: ユーザー入力でプロンプトを変えない（インジェクション対策）
4. **報告（/api/report）もテキストのみ**: 画像・位置情報・元デバイスIDは受け取らない。`sanitizeReport` で長さ上限つきに正規化。自動収集はせず、アプリ側でユーザーがボタンを押したときだけ送る（プライバシーポリシーに明記済み）

## よく使うコマンド（`worker/` で実行）

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

## 初回セットアップ

詳細は `worker/README.md` 参照。要点だけ:

1. `npx wrangler login`
2. `npx wrangler kv:namespace create "RATE_LIMIT"` → 出力されたIDを `wrangler.toml` の `PLACEHOLDER_KV_NAMESPACE_ID` と置換
3. `npx wrangler secret put GEMINI_API_KEY`（dev / prod 両方）
4. `npm run deploy:dev` で動作確認

## デプロイ前チェックリスト

- [ ] `wrangler.toml` の KV namespace id がプレースホルダのままになっていないか
- [ ] `GEMINI_API_KEY` が Secret 登録済みか（dev / prod）
- [ ] レート制限が想定通りに動くか（10回/分で 429）
- [ ] エラーレスポンスに内部情報が漏れていないか
- [ ] 画像が一切ログに出ていないか（`npm run tail` で確認）
- [ ] report の通知先 Secret（`LINE_*` / `REPORT_WEBHOOK_URL`）を変えたら dev/prod 両方に登録したか（curl で `/api/report` を叩いて到達確認）

## 関連ドキュメント

- `worker/README.md`: セットアップ・API仕様の正本
- `worker/docs/prompt-design.md`: プロンプト設計の根拠と評価方法
- `docs/06_worker_deployment.md`: デプロイチケット
