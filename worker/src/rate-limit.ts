/**
 * シンプルなレート制限
 *
 * 設計: Workers KVに「クライアント識別子 + 分単位タイムスタンプ」をキーとして
 * カウンタを保持する。1分のウィンドウで上限を超えたらリジェクト。
 *
 * クライアント識別子は以下の優先順位:
 * 1. ヘッダー X-Device-Id（モバイルアプリから送られるハッシュ済みデバイスID）
 * 2. CF-Connecting-IP（IPアドレス）
 *
 * KVの整合性: KVは結果整合性なので厳密なカウントは保証できないが、レート制限の
 * 用途では実用上問題ない（数秒のラグで多少多めに通る程度）。
 */
export async function checkRateLimit(params: {
  kv: KVNamespace;
  clientId: string;
  limitPerMinute: number;
}): Promise<{ allowed: true } | { allowed: false; retryAfterSec: number }> {
  const { kv, clientId, limitPerMinute } = params;

  // 分単位のタイムスタンプ
  const now = Date.now();
  const minuteWindow = Math.floor(now / 60_000);
  const key = `rl:${clientId}:${minuteWindow}`;

  // 現在のカウントを取得
  const currentRaw = await kv.get(key);
  const current = currentRaw ? parseInt(currentRaw, 10) : 0;

  if (current >= limitPerMinute) {
    // 次の分まで待つ秒数
    const retryAfterSec = Math.ceil((minuteWindow + 1) * 60_000 / 1000 - now / 1000);
    return { allowed: false, retryAfterSec };
  }

  // インクリメントしてTTL 2分で保存（古いキーは自動削除）
  await kv.put(key, String(current + 1), { expirationTtl: 120 });

  return { allowed: true };
}

/**
 * リクエストからクライアント識別子を取得する
 *
 * 個人情報保護のため、IPアドレスはハッシュ化はしないが、レート制限以外には使わない。
 */
export function getClientId(request: Request): string {
  const deviceId = request.headers.get("X-Device-Id");
  if (deviceId) return `dev:${deviceId.slice(0, 64)}`;

  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) return `ip:${ip}`;

  return "unknown";
}
