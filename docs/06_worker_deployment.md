# 06. Workerデプロイ

> 関連: `worker/README.md`, `REQUIREMENTS.md` §4.3
> ステータス: ✅ 完了（2026-05-17 デプロイ）

## デプロイ結果

- **dev**:  `https://kore-dou-suteru-api-dev.rabo-hohoemi.workers.dev`
- **prod**: `https://kore-dou-suteru-api-production.rabo-hohoemi.workers.dev`
- KV ネームスペース ID: `77ad0d59ada24cd08a4d3ea65b7d58af`（dev/prod 共有、レート制限は端末 ID 別キーなので衝突しない）
- Gemini モデル: `gemini-2.5-flash`（`worker/wrangler.toml:26`）
- 両環境とも `/healthz` が `{"ok":true}` を返すこと確認済み

## 目的

`worker/` の Cloudflare Workers プロキシを dev/prod 両環境にデプロイし、アプリから `EXPO_PUBLIC_API_URL` で参照できる状態にする。

## 完了条件

- dev / prod の Worker URL が発行されている
- `wrangler.toml` のプレースホルダ（`PLACEHOLDER_KV_NAMESPACE_ID`）が実IDに置換済み
- Gemini API Key が両環境に Secret として登録済み
- アプリから `POST /api/identify` を叩いて画像識別が成功する

## Todo

### 初回セットアップ

- [×] `cd worker && npm install`
- [×] `npx wrangler login` でCloudflareにログイン
- [×] `npx wrangler kv:namespace create "RATE_LIMIT"` で 1 ネームスペース作成（dev/prod 共有方針に変更）
- [×] `wrangler.toml` の `PLACEHOLDER_KV_NAMESPACE_ID` を実IDに置換

### Gemini API Key登録

- [×] Google AI Studio で API Key を発行
- [×] dev環境: `cd worker && npx wrangler secret put GEMINI_API_KEY --env development`
- [×] prod環境: `cd worker && npx wrangler secret put GEMINI_API_KEY --env production`

### デプロイ

- [×] dev: `npm run deploy:dev` で開発 Worker をデプロイ
- [×] prod: `npm run deploy:prod` で本番 Worker をデプロイ
- [×] それぞれ `/healthz` が `{ok:true}` を返すことを確認

### 動作確認（残作業: 09 番チケットと合わせて実画像で）

- [ ] サンプル画像で `POST /api/identify` を curl で叩く（dev）
- [ ] レート制限（10回/分）の挙動を確認：11回目で 429 が返る
- [ ] プロンプトインジェクション耐性チェック（`worker/docs/prompt-design.md` のDセット）
- [ ] 不明画像（人物・風景）で `identifiedName: null` が返る

### モニタリング

- [ ] `npm run tail` で本番ログをライブ追跡できることを確認
- [ ] 画像データがログに残らないことを実際のリクエストで確認

### モデル選定

- [×] `gemini-2.5-flash` 採用（REQUIREMENTS §11.4 / `wrangler.toml:26`）。精度問題が出てから再評価

### アプリ側との接続

- [×] アプリの `.env.example` に `EXPO_PUBLIC_API_URL` を本番 URL で記載
- [ ] `eas.json` の各プロファイルで dev/prod を切替（[[23_eas_build]]）

## 注意点

- **Secret はコードに絶対書かない**。`wrangler secret put` でのみ登録
- KV namespace は本番用とプレビュー用で別ID。混同しないこと
- レート制限の値（10回/分）は §11.4 で未確定扱い。テスト後に調整可能性あり
- Workersの無料枠は100,000リクエスト/日。MVPでは余裕
