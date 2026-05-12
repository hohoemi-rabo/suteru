import { IDENTIFY_PROMPT, GENERATION_CONFIG } from "./prompt";

/**
 * Gemini Vision APIを呼び出して、画像から品目名を取得する
 *
 * 重要: この関数は画像をログに残さない。Geminiへの送信後、画像データは
 * 関数スコープを抜けて即座にGCの対象となる。
 */
export async function callGeminiVision(params: {
  apiKey: string;
  model: string;
  imageBase64: string;
  mimeType: string;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const { apiKey, model, imageBase64, mimeType } = params;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { text: IDENTIFY_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: GENERATION_CONFIG,
    // safetySettingsはデフォルトのまま（ごみの画像は基本的にセーフ）
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return {
      ok: false,
      error: `network_error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  if (!response.ok) {
    // エラー本文は念のため取得するが、ログには出さない（APIキーが含まれる可能性のあるURL情報の保護のため）
    const errorText = await response.text().catch(() => "");
    return {
      ok: false,
      error: `gemini_http_${response.status}: ${errorText.slice(0, 200)}`,
    };
  }

  let data: GeminiResponse;
  try {
    data = (await response.json()) as GeminiResponse;
  } catch (e) {
    return { ok: false, error: "invalid_json_response" };
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== "string") {
    return { ok: false, error: "no_text_in_response" };
  }

  return { ok: true, text };
}

/**
 * Gemini APIのレスポンス型（必要な部分のみ）
 */
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
}
