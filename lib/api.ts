/**
 * Worker `/api/identify` を叩く薄いクライアント（React 依存ゼロ）。
 *
 * 設計:
 * - 一発で 品目名 / null / エラー の判別ユニオンを返す
 * - デバイス ID は SHA-256 ハッシュ済みのものを SecureStore で永続化
 * - 10 秒タイムアウト、リトライなし（MVP 方針。Camera 側で「もう一度撮る」誘導）
 * - 画像 7MB 越えはクライアント先行チェックで弾く（Worker `src/index.ts:99-100` と整合）
 * - 同時並行ガードは Camera 側の責務
 */

import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type {
  IdentifyRequest,
  IdentifyResponse,
  ReportRequest,
  ReportResponse,
} from '@/types';

// ============================================================
// 定数
// ============================================================

const TIMEOUT_MS = 10_000;
const MAX_BASE64_LEN = 7_000_000; // worker/src/index.ts:99-100 と合わせる
const DEVICE_ID_KEY = 'suteru.device-id.v1';
const IDENTIFY_PATH = '/api/identify';
const REPORT_PATH = '/api/report';

// ============================================================
// 公開型
// ============================================================

export type ApiErrorCode =
  | 'not_configured'
  | 'image_too_large'
  | 'invalid_request'
  | 'rate_limited'
  | 'gemini_error'
  | 'internal_error'
  | 'network_error'
  | 'timeout'
  | 'invalid_response';

export type IdentifyResult =
  | { ok: true; identifiedName: string }
  | {
      ok: true;
      identifiedName: null;
      reason: 'could_not_identify' | 'not_garbage';
    }
  | { ok: false; errorCode: ApiErrorCode; userMessage: string };

// ============================================================
// 公開 API
// ============================================================

/**
 * Base64 画像（data URI prefix なし）を Worker に POST し、判定結果を返す。
 *
 * 戻り値は以下の判別ユニオン:
 *   - `{ ok: true, identifiedName: string }`           — 品目名ヒット
 *   - `{ ok: true, identifiedName: null, reason }`     — Gemini が「不明」と返した
 *   - `{ ok: false, errorCode, userMessage }`          — エラー（日本語メッセージ付き）
 */
export async function identifyItem(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
): Promise<IdentifyResult> {
  const base = getApiBaseUrl();
  if (!base) {
    return errResult(
      'not_configured',
      '判定サービスの設定が見つかりません。再インストールをお試しください。',
    );
  }
  if (imageBase64.length > MAX_BASE64_LEN) {
    return errResult(
      'image_too_large',
      '画像が大きすぎます。もう一度撮影してください。',
    );
  }

  const deviceId = await getOrCreateDeviceId();
  const body: IdentifyRequest = { image: imageBase64, mimeType };

  try {
    const res = await fetchWithTimeout(
      `${base}${IDENTIFY_PATH}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify(body),
      },
      TIMEOUT_MS,
    );

    let json: IdentifyResponse;
    try {
      json = (await res.json()) as IdentifyResponse;
    } catch {
      return errResult('invalid_response', '判定結果を読み取れませんでした。');
    }

    if (json.success) {
      if (json.identifiedName) {
        return { ok: true, identifiedName: json.identifiedName };
      }
      return {
        ok: true,
        identifiedName: null,
        reason: json.reason ?? 'could_not_identify',
      };
    }
    return errResult(json.errorCode, mapErrorMessage(json.errorCode));
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return errResult(
        'timeout',
        '時間内に判定が完了しませんでした。電波状況を確認してもう一度お試しください。',
      );
    }
    if (__DEV__) console.warn('[api] identify failed:', err);
    return errResult('network_error', '通信に失敗しました。電波状況をご確認ください。');
  }
}

/**
 * 未収録品目を運用者へ報告する（`/api/report` を叩く）。
 *
 * - 利用者が「報告する」ボタンを押したときだけ呼ぶ（自動送信はしない）
 * - 送るのは品目名・コメント・地区名などのテキストのみ。画像・位置情報・元のデバイス ID は送らない
 *   （`X-Device-Id` はレート制限用のハッシュのみ）
 * - 失敗してもアプリ体験を止めないよう、例外は投げず `{ ok: false }` を返す
 */
export async function reportMissingItem(
  params: ReportRequest,
): Promise<{ ok: boolean }> {
  const base = getApiBaseUrl();
  if (!base) return { ok: false };

  // 報告内容が空なら送らない（Worker 側でも弾くが、無駄打ちを避ける）
  if (!params.identifiedName?.trim() && !params.comment?.trim()) {
    return { ok: false };
  }

  const deviceId = await getOrCreateDeviceId();
  const body: ReportRequest = {
    identifiedName: params.identifiedName?.trim() ?? '',
    comment: params.comment?.trim() ?? '',
    areaName: params.areaName?.trim() ?? '',
    source: params.source,
  };

  try {
    const res = await fetchWithTimeout(
      `${base}${REPORT_PATH}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify(body),
      },
      TIMEOUT_MS,
    );
    const json = (await res.json().catch(() => null)) as ReportResponse | null;
    return { ok: res.ok && json?.success === true };
  } catch (err: unknown) {
    if (__DEV__) console.warn('[api] report failed:', err);
    return { ok: false };
  }
}

/** 設定された Worker URL を返す（開発診断用）。未設定なら null。 */
export function getConfiguredApiUrl(): string | null {
  return getApiBaseUrl();
}

/**
 * SHA-256 ハッシュ済みデバイス ID を返す。
 * 初回呼び出しで生成 → SecureStore に永続化、以降は再利用（モジュール内 Promise でメモ化）。
 */
export async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceIdPromise) return cachedDeviceIdPromise;
  cachedDeviceIdPromise = (async () => {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY).catch(() => null);
    if (stored) return stored;
    const raw = await rawPlatformId();
    const hashed = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      raw,
    );
    await SecureStore.setItemAsync(DEVICE_ID_KEY, hashed).catch(() => undefined);
    return hashed;
  })();
  return cachedDeviceIdPromise;
}

// ============================================================
// 内部ヘルパー
// ============================================================

let cachedDeviceIdPromise: Promise<string> | null = null;

function getApiBaseUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_API_URL;
  return url && url.length > 0 ? url.replace(/\/$/, '') : null;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function rawPlatformId(): Promise<string> {
  try {
    if (Platform.OS === 'android') {
      const id = Application.getAndroidId();
      if (id && id.length > 0) return id;
    } else if (Platform.OS === 'ios') {
      const id = await Application.getIosIdForVendorAsync();
      if (id && id.length > 0) return id;
    }
  } catch {
    // 取得失敗時はランダム UUID にフォールバック
  }
  return Crypto.randomUUID();
}

function errResult(errorCode: ApiErrorCode, userMessage: string): IdentifyResult {
  return { ok: false, errorCode, userMessage };
}

function mapErrorMessage(code: ApiErrorCode): string {
  switch (code) {
    case 'rate_limited':
      return 'リクエストが多すぎます。1 分ほどお待ちください。';
    case 'gemini_error':
      return '判定サービスに一時的な問題が発生しています。少し待ってお試しください。';
    case 'internal_error':
      return '判定に失敗しました。少し待ってもう一度お試しください。';
    case 'invalid_request':
      return '画像を送信できませんでした。もう一度撮影してください。';
    default:
      return '判定に失敗しました。';
  }
}
