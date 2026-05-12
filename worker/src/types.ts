/**
 * Cloudflare Workers環境の型定義
 */
export interface Env {
  // KV: レート制限用
  RATE_LIMIT: KVNamespace;

  // Secrets (wrangler secret put で設定)
  GEMINI_API_KEY: string;

  // Vars (wrangler.toml で設定)
  GEMINI_MODEL: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_PER_MINUTE: string;
}

/**
 * /api/identify のリクエスト
 */
export interface IdentifyRequest {
  /** base64エンコードされた画像（data URI prefixなし） */
  image: string;
  /** 画像のMIMEタイプ。省略時は "image/jpeg" */
  mimeType?: string;
}

/**
 * /api/identify のレスポンス
 */
export type IdentifyResponse =
  | {
      success: true;
      /** 判定された品目名。判定不能時はnull */
      identifiedName: string | null;
      /** 判定不能時の理由（識別不能/不適切な画像など） */
      reason?: "could_not_identify" | "not_garbage";
    }
  | {
      success: false;
      error: string;
      errorCode:
        | "invalid_request"
        | "rate_limited"
        | "gemini_error"
        | "internal_error";
    };
