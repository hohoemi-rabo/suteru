import type {
  Env,
  IdentifyRequest,
  IdentifyResponse,
  ReportResponse,
} from "./types";
import { callGeminiVision } from "./gemini";
import { normalizeIdentifiedName } from "./prompt";
import { checkRateLimit, getClientId } from "./rate-limit";
import { forwardReport, sanitizeReport } from "./report";

/**
 * Cloudflare Workersのエントリーポイント
 *
 * エンドポイント:
 *   POST /api/identify - 画像を受け取り、品目名を返す
 *   POST /api/report   - 未収録品目の報告を受け取り、運用者へ転送する
 *   GET  /healthz       - ヘルスチェック
 *
 * 設計原則:
 * - 画像をログに残さない
 * - APIキーをクライアントに漏らさない
 * - レート制限を必ず通す
 * - エラーは詳細を出しすぎない（攻撃の手がかりにしない）
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORSプリフライト
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env, request),
      });
    }

    // ヘルスチェック
    if (url.pathname === "/healthz" && request.method === "GET") {
      return jsonResponse({ ok: true }, 200, env, request);
    }

    // 識別エンドポイント
    if (url.pathname === "/api/identify" && request.method === "POST") {
      return handleIdentify(request, env);
    }

    // 未収録品目の報告エンドポイント
    if (url.pathname === "/api/report" && request.method === "POST") {
      return handleReport(request, env);
    }

    return jsonResponse({ error: "not_found" }, 404, env, request);
  },
} satisfies ExportedHandler<Env>;

// ─────────────────────────────────────────────────────────
// /api/identify ハンドラ
// ─────────────────────────────────────────────────────────

async function handleIdentify(request: Request, env: Env): Promise<Response> {
  // 1. レート制限
  const clientId = getClientId(request);
  const limit = parseInt(env.RATE_LIMIT_PER_MINUTE || "10", 10);
  const rl = await checkRateLimit({
    kv: env.RATE_LIMIT,
    clientId,
    limitPerMinute: limit,
  });
  if (!rl.allowed) {
    return jsonResponse<IdentifyResponse>(
      {
        success: false,
        error: `Rate limit exceeded. Retry after ${rl.retryAfterSec} seconds.`,
        errorCode: "rate_limited",
      },
      429,
      env,
      request,
      { "Retry-After": String(rl.retryAfterSec) }
    );
  }

  // 2. リクエストボディのパース
  let body: IdentifyRequest;
  try {
    body = (await request.json()) as IdentifyRequest;
  } catch {
    return jsonResponse<IdentifyResponse>(
      { success: false, error: "Invalid JSON", errorCode: "invalid_request" },
      400,
      env,
      request
    );
  }

  // 3. バリデーション
  if (!body.image || typeof body.image !== "string") {
    return jsonResponse<IdentifyResponse>(
      {
        success: false,
        error: "Field 'image' is required and must be a base64 string.",
        errorCode: "invalid_request",
      },
      400,
      env,
      request
    );
  }

  // 画像サイズ上限チェック（base64で約5MB相当 = 5 * 1024 * 1024 * 4/3 ≈ 7MB）
  if (body.image.length > 7_000_000) {
    return jsonResponse<IdentifyResponse>(
      {
        success: false,
        error: "Image too large. Compress to under 5MB.",
        errorCode: "invalid_request",
      },
      400,
      env,
      request
    );
  }

  const mimeType = body.mimeType || "image/jpeg";
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    return jsonResponse<IdentifyResponse>(
      {
        success: false,
        error: "Unsupported mimeType. Use image/jpeg, image/png, or image/webp.",
        errorCode: "invalid_request",
      },
      400,
      env,
      request
    );
  }

  // 4. Gemini呼び出し
  const result = await callGeminiVision({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL || "gemini-2.5-flash",
    imageBase64: body.image,
    mimeType,
  });

  if (!result.ok) {
    // Geminiエラーの詳細はクライアントに出さない
    console.log("Gemini error:", result.error); // ログにはAPIキーや画像は含まれない
    return jsonResponse<IdentifyResponse>(
      {
        success: false,
        error: "Failed to identify item. Please try again.",
        errorCode: "gemini_error",
      },
      502,
      env,
      request
    );
  }

  // 5. レスポンスの正規化
  const normalized = normalizeIdentifiedName(result.text);
  const response: IdentifyResponse = {
    success: true,
    identifiedName: normalized.identifiedName,
    ...(normalized.reason ? { reason: normalized.reason } : {}),
  };

  return jsonResponse(response, 200, env, request);
}

// ─────────────────────────────────────────────────────────
// /api/report ハンドラ
// ─────────────────────────────────────────────────────────

async function handleReport(request: Request, env: Env): Promise<Response> {
  // 1. レート制限（identify と同じ KV カウンタを共有 = 悪用防止）
  const clientId = getClientId(request);
  const limit = parseInt(env.RATE_LIMIT_PER_MINUTE || "10", 10);
  const rl = await checkRateLimit({
    kv: env.RATE_LIMIT,
    clientId,
    limitPerMinute: limit,
  });
  if (!rl.allowed) {
    return jsonResponse<ReportResponse>(
      {
        success: false,
        error: `Rate limit exceeded. Retry after ${rl.retryAfterSec} seconds.`,
        errorCode: "rate_limited",
      },
      429,
      env,
      request,
      { "Retry-After": String(rl.retryAfterSec) }
    );
  }

  // 2. ボディのパース
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonResponse<ReportResponse>(
      { success: false, error: "Invalid JSON", errorCode: "invalid_request" },
      400,
      env,
      request
    );
  }

  // 3. 検証・サニタイズ（画像等は受け取らない）
  const report = sanitizeReport(raw);
  if (!report) {
    return jsonResponse<ReportResponse>(
      {
        success: false,
        error: "Report must include an item name or comment.",
        errorCode: "invalid_request",
      },
      400,
      env,
      request
    );
  }

  // 4. 転送（best-effort）。失敗しても利用者の報告は受理する
  try {
    await forwardReport(env, report);
  } catch (err) {
    console.log("Report forward failed:", err instanceof Error ? err.message : "unknown");
  }

  return jsonResponse<ReportResponse>({ success: true }, 200, env, request);
}

// ─────────────────────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────────────────────

function corsHeaders(env: Env, request: Request): Record<string, string> {
  const allowedOrigins = env.ALLOWED_ORIGINS || "*";
  const origin = request.headers.get("Origin") || "";

  let allowOrigin = "*";
  if (allowedOrigins !== "*") {
    const list = allowedOrigins.split(",").map((s) => s.trim());
    allowOrigin = list.includes(origin) ? origin : list[0] || "";
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Device-Id",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse<T>(
  body: T,
  status: number,
  env: Env,
  request: Request,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(env, request),
      ...extraHeaders,
    },
  });
}
