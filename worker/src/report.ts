/**
 * 未収録品目の報告（/api/report）の本体ロジック。
 *
 * 設計原則:
 * - 画像・位置情報・端末を特定する情報は受け取らない・転送しない
 * - 受け取るのは利用者がボタンで明示的に共有したテキストのみ
 * - 入力長を制限してログ汚染・悪用を防ぐ
 * - 転送先（Webhook）が未設定でも受理する（保存はしない）
 */
import type { Env, ReportRequest } from "./types";

const MAX_NAME_LEN = 100;
const MAX_COMMENT_LEN = 500;
const MAX_AREA_LEN = 60;

/**
 * 受信ボディを検証・サニタイズして ReportRequest に正規化する。
 * 品目名・コメントのどちらも空なら報告として成立しないため null を返す。
 */
export function sanitizeReport(body: unknown): ReportRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const identifiedName = clip(b.identifiedName, MAX_NAME_LEN);
  const comment = clip(b.comment, MAX_COMMENT_LEN);
  const areaName = clip(b.areaName, MAX_AREA_LEN);
  const source =
    b.source === "camera" || b.source === "search" ? b.source : undefined;

  // 品目名もコメントも無ければ報告内容が無い
  if (!identifiedName && !comment) return null;

  return { identifiedName, comment, areaName, source };
}

/** 文字列なら trim して最大長で切り詰める。文字列以外は空文字。 */
function clip(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

/**
 * 報告を転送先 Webhook（Discord 互換の `{ content }`）へ送る。
 * REPORT_WEBHOOK_URL 未設定なら何もしない。失敗は呼び出し側で握りつぶす想定。
 */
export async function forwardReport(
  env: Env,
  report: ReportRequest
): Promise<void> {
  const url = env.REPORT_WEBHOOK_URL;
  if (!url) return;

  const sourceLabel =
    report.source === "camera"
      ? "カメラ判定"
      : report.source === "search"
        ? "文字検索"
        : "不明";

  const lines = [
    "🗑️ **未収録品目の報告**",
    `品目名: ${report.identifiedName || "（AI が特定できず）"}`,
    `地区: ${report.areaName || "未設定"}`,
    `種別: ${sourceLabel}`,
  ];
  if (report.comment) lines.push(`コメント: ${report.comment}`);

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: lines.join("\n") }),
  });
}
