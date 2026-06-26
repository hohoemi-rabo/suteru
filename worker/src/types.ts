/**
 * Cloudflare Workers環境の型定義
 */
export interface Env {
  // KV: レート制限用
  RATE_LIMIT: KVNamespace;

  // Secrets (wrangler secret put で設定)
  GEMINI_API_KEY: string;
  /**
   * 未収録品目の報告先 Webhook URL（任意）。
   * Discord の Incoming Webhook 等、`{ "content": "..." }` を受け付ける URL を想定。
   * 未設定の場合、報告は受理（success: true）するが転送はしない（保存もしない）。
   */
  REPORT_WEBHOOK_URL?: string;
  /**
   * LINE 通知（任意）。両方そろったときだけ LINE Messaging API の push を送る。
   * - LINE_CHANNEL_ACCESS_TOKEN: LINE 公式アカウント（Messaging API チャネル）の長期アクセストークン
   * - LINE_TO: 送信先ユーザー ID（LINE Developers コンソールの「あなたのユーザーID」）
   */
  LINE_CHANNEL_ACCESS_TOKEN?: string;
  LINE_TO?: string;

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

/**
 * /api/report のリクエスト（未収録品目の報告）
 *
 * 重要: 画像・位置情報・端末を特定する情報は一切含めない。
 * 送るのは「AI が判定した品目名（テキスト）」など、利用者がボタンで明示的に共有したものだけ。
 */
export interface ReportRequest {
  /** AI が判定した品目名（辞書に無かったもの）。空でも可（comment があれば成立） */
  identifiedName?: string;
  /** 利用者が任意で添えたコメント */
  comment?: string;
  /** 選択中の地区名（地区別の傾向把握用。個人特定にはならない粒度） */
  areaName?: string;
  /** 報告の発生元 */
  source?: "camera" | "search";
}

/**
 * /api/report のレスポンス
 */
export type ReportResponse =
  | { success: true }
  | {
      success: false;
      error: string;
      errorCode: "invalid_request" | "rate_limited" | "internal_error";
    };
