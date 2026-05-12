# 「これどう捨てる？」 API (Cloudflare Workers)

飯田市のごみ分別アプリのプロキシAPI。Gemini Vision APIへのリクエストを中継し、APIキーを保護する。

## 設計のポイント

### 1. APIキー保護

Gemini APIキーはCloudflare Workersの環境変数（Secret）に保管される。クライアント（モバイルアプリ）からは見えない。

### 2. 画像を保存しない

撮影画像はGeminiへの送信後、関数スコープを抜けて即座にGC対象となる。ログにも残さない。
**行政アピール時の「個人情報保護」の根拠** となる重要な設計。

### 3. ハルシネーション・ゼロ

`src/prompt.ts` のプロンプトはGeminiに「品目名を返すだけ」を厳格に指示。
カテゴリ判定はアプリ側のitems.jsonで行う。AIに「飯田市のルールでは...」を答えさせない。

### 4. レート制限

KVを使った1分あたり10リクエストの制限。クライアント識別子はモバイルアプリのデバイスIDを優先、なければIP。

## セットアップ

### 1. 依存インストール

```bash
cd worker
npm install
```

### 2. Cloudflareアカウントにログイン

```bash
npx wrangler login
```

### 3. KVネームスペースの作成

```bash
npx wrangler kv:namespace create "RATE_LIMIT"
# 出力された id を wrangler.toml の [[kv_namespaces]] の id に貼る
```

### 4. Gemini APIキーをSecretとして登録

Google AI Studio (https://aistudio.google.com/) でAPIキーを発行し、

```bash
npx wrangler secret put GEMINI_API_KEY
# プロンプトに従ってキーを貼り付け
```

### 5. ローカル開発

```bash
npm run dev
# http://localhost:8787 で起動する
```

ローカルで動作確認:

```bash
# ヘルスチェック
curl http://localhost:8787/healthz

# 識別テスト（適当な画像を base64 にして送る）
IMAGE_BASE64=$(base64 -w0 sample.jpg)
curl -X POST http://localhost:8787/api/identify \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_BASE64\"}"
```

### 6. デプロイ

```bash
# 開発環境
npm run deploy:dev

# 本番環境
npm run deploy:prod
```

## API仕様

### `POST /api/identify`

画像から品目名を判定する。

**Request:**

```json
{
  "image": "base64エンコードされた画像（data URI prefixなし）",
  "mimeType": "image/jpeg"
}
```

ヘッダー:
- `X-Device-Id` (任意): ハッシュ済みデバイスID。レート制限の単位になる

**Response (成功):**

```json
{
  "success": true,
  "identifiedName": "ペットボトル"
}
```

判定不能時:

```json
{
  "success": true,
  "identifiedName": null,
  "reason": "could_not_identify"
}
```

レート制限超過時:

```json
{
  "success": false,
  "error": "Rate limit exceeded. Retry after 42 seconds.",
  "errorCode": "rate_limited"
}
```

### `GET /healthz`

```json
{ "ok": true }
```

## アプリ側からの呼び出し例（Expo + TypeScript）

```typescript
import * as Crypto from "expo-crypto";
import * as Application from "expo-application";

// 端末固有IDをハッシュ化（個人特定不可なIDをサーバーに送る）
async function getDeviceId(): Promise<string> {
  const raw = Application.androidId ?? Application.getIosIdForVendorAsync() ?? "anon";
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    String(raw)
  );
}

const API_BASE = "https://kore-dou-suteru-api-production.YOUR-SUBDOMAIN.workers.dev";

export async function identifyItem(imageBase64: string): Promise<string | null> {
  const deviceId = await getDeviceId();

  const res = await fetch(`${API_BASE}/api/identify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": deviceId,
    },
    body: JSON.stringify({
      image: imageBase64,
      mimeType: "image/jpeg",
    }),
  });

  if (res.status === 429) {
    throw new Error("リクエストが多すぎます。少し待ってからお試しください。");
  }

  if (!res.ok) {
    throw new Error("判定に失敗しました。通信状態をご確認ください。");
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error);
  }

  return data.identifiedName; // string または null
}
```

## コスト見積もり

Gemini 2.5 Flash の価格（2026年5月時点。最新は公式ドキュメントで確認）:
- 入力: 約 $0.075 / 1M tokens
- 出力: 約 $0.30 / 1M tokens

1リクエストあたりの概算:
- 画像（小さい）: ~258 tokens
- プロンプト: ~200 tokens
- 出力: ~10 tokens
- 合計: ~470 tokens → **約 $0.00004 / リクエスト**

利用想定別の月額コスト（Gemini APIのみ。Cloudflare Workersは無料枠内）:
- 100リクエスト/日 (3,000/月): ~$0.12/月
- 1,000リクエスト/日 (30,000/月): ~$1.2/月
- 10,000リクエスト/日 (300,000/月): ~$12/月

Cloudflare Workersの無料枠: 100,000リクエスト/日まで無料。MVPでは超えない想定。

## セキュリティ・プライバシーチェックリスト

- [x] APIキーはSecret管理（クライアントに露出しない）
- [x] 画像はサーバーに保存しない（ログにも残さない）
- [x] 画像サイズ上限を強制（5MB相当）
- [x] MIMEタイプを許可リストで制限
- [x] レート制限あり
- [x] エラーレスポンスに内部情報を含めない
- [x] HTTPS強制（Cloudflare Workersのデフォルト）
- [x] プロンプトインジェクション対策（プロンプト内で明示）

## トラブルシューティング

### `wrangler: command not found`

`npx wrangler ...` で実行するか、`npm install -g wrangler` でグローバルインストール。

### `GEMINI_API_KEY is not defined`

```bash
npx wrangler secret put GEMINI_API_KEY
```

### KVが見つからない

`wrangler.toml` の `[[kv_namespaces]]` の `id` を、`wrangler kv:namespace create` で出力された値に置き換える。

### Geminiのモデル名がエラーになる

最新のモデル名を Google AI Studio (https://aistudio.google.com/) で確認し、`wrangler.toml` の `GEMINI_MODEL` を変更。
