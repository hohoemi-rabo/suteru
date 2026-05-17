# 09. APIクライアント（lib/api.ts）

> 関連: `worker/README.md` §アプリ側からの呼び出し例, `REQUIREMENTS.md` §4.3
> ステータス: ✅ 完了（2026-05-17）

## 実装メモ

- `lib/api.ts` は React 依存ゼロの純粋 async モジュール
- 返り値は判別ユニオン `IdentifyResult`（`ok: true` ヒット / `ok: true` null+reason / `ok: false` errorCode+userMessage）
- デバイス ID は SHA-256 ハッシュ済みを `expo-secure-store` (`suteru.device-id.v1`) に永続化、モジュール内 Promise でメモ化
- タイムアウト 10 秒、**リトライなし**（MVP 方針。Camera で「もう一度撮る」誘導）
- 画像 7MB 越えはクライアント側で先に弾く（Worker `src/index.ts:99-100` と同値）
- DevDiagnostics に「Worker 疎通確認」セクション（1×1 PNG を投げて疎通確認）を追加

## 目的

Cloudflare Worker の `/api/identify` を叩くクライアントを `lib/api.ts` に集約する。デバイスIDのハッシュ化・レート制限エラーのハンドリング・タイムアウト・リトライも一元化。

## 完了条件

- カメラ画面（[[15_camera_screen]]）から `identifyItem(base64)` 一発で品目名を取得できる
- レート制限・タイムアウト・通信エラーが日本語メッセージで返る
- デバイスIDはハッシュ済みのものを `expo-secure-store` から再利用

## Todo

### 基本実装

- [×] `lib/api.ts` 作成
- [×] `EXPO_PUBLIC_API_URL` の参照（`process.env` 経由、Expo Router auto-inject）
- [×] `identifyItem(base64, mimeType?): Promise<IdentifyResult>` 関数（戻り値を判別ユニオンに拡張）
- [×] `fetch` 呼び出し（Content-Type: application/json、X-Device-Id 付与）

### デバイスID（X-Device-Id）

- [×] `getOrCreateDeviceId()`: SecureStore から取得、無ければ新規生成して保存
- [×] `expo-application` の `getAndroidId()` / `getIosIdForVendorAsync()` を取得
- [×] `expo-crypto` で SHA-256 ハッシュ化
- [×] 取得失敗時のフォールバック（`Crypto.randomUUID()`）

### エラーハンドリング

- [×] 429: `errorCode: 'rate_limited'` + 「リクエストが多すぎます。1 分ほどお待ちください。」
- [×] 5xx (`internal_error` / `gemini_error`): 各メッセージ
- [×] ネット切断: `errorCode: 'network_error'` + 「通信に失敗しました…」
- [×] タイムアウト（10秒）: AbortController + `errorCode: 'timeout'`
- [×] レスポンス JSON 形式バリデーション（パース失敗時 `invalid_response`）

### 画像サイズ・形式

- [×] 送信前に画像サイズチェック（base64 長 7MB＝~5MB 生画像）→ `image_too_large`
- [ ] resize は [[15_camera_screen]] の責務（本ライブラリはガードのみ）
- [×] mimeType デフォルト `image/jpeg`（呼び出し側で上書き可）

### リトライ戦略

- [ ] MVP では実装しない（10 秒タイムアウト + Camera 側の "もう一度" 誘導で十分との判断）

### ロガー方針

- [×] `__DEV__` 時のみ `console.warn('[api] identify failed:', err)`、画像データは含めない
- [×] 端末 ID（ハッシュ済み）は X-Device-Id ヘッダーで送信される

## 注意点

- 画像 base64 サイズが大きいと通信時間が増える。**Camera側で適切なサイズに圧縮する**
- AbortController + AbortSignal で fetch をキャンセル可能に
- 同時並行 fetch は禁止（カメラ画面で連打防止）：[[15_camera_screen]] でガード
- 認証はないので Authorization ヘッダは不要
