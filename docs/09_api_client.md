# 09. APIクライアント（lib/api.ts）

> 関連: `worker/README.md` §アプリ側からの呼び出し例, `REQUIREMENTS.md` §4.3
> ステータス: 未着手

## 目的

Cloudflare Worker の `/api/identify` を叩くクライアントを `lib/api.ts` に集約する。デバイスIDのハッシュ化・レート制限エラーのハンドリング・タイムアウト・リトライも一元化。

## 完了条件

- カメラ画面（[[15_camera_screen]]）から `identifyItem(base64)` 一発で品目名を取得できる
- レート制限・タイムアウト・通信エラーが日本語メッセージで返る
- デバイスIDはハッシュ済みのものを `expo-secure-store` から再利用

## Todo

### 基本実装

- [ ] `lib/api.ts` 作成
- [ ] `EXPO_PUBLIC_API_URL` の参照（[[04_project_setup]] で定義）
- [ ] `identifyItem(base64: string, mimeType?: string): Promise<string | null>` 関数
- [ ] `fetch` 呼び出し（Content-Type: application/json）

### デバイスID（X-Device-Id）

- [ ] `getOrCreateDeviceId()`: SecureStore から取得、無ければ新規生成して保存
- [ ] `expo-application` の androidId / iOS idForVendor を取得
- [ ] `expo-crypto` で SHA-256 ハッシュ化
- [ ] 取得失敗時のフォールバック（`crypto.randomUUID()` 等）

### エラーハンドリング

- [ ] 429: 「リクエストが多すぎます」エラーで上位に通知
- [ ] 500系: 「判定に失敗しました」
- [ ] ネット切断: 「通信状態をご確認ください」
- [ ] タイムアウト（10秒程度）: AbortController で実装
- [ ] レスポンスJSONの形式バリデーション

### 画像サイズ・形式

- [ ] 送信前に画像サイズチェック（Workerは5MB上限）
- [ ] 必要なら expo-image-manipulator で resize（[[15_camera_screen]] と協調）
- [ ] mimeType を JPEG に統一（送信ペイロード削減）

### リトライ戦略

- [ ] 一時的なエラーのみリトライ（指数バックオフ）
- [ ] レート制限（429）はリトライしない、ユーザーに待ってもらう
- [ ] リトライ最大2回まで

### ロガー方針

- [ ] エラーログには **画像データを絶対に含めない**（プライバシー設計の根幹）
- [ ] 端末ID（ハッシュ済み）はログに出してOK

## 注意点

- 画像 base64 サイズが大きいと通信時間が増える。**Camera側で適切なサイズに圧縮する**
- AbortController + AbortSignal で fetch をキャンセル可能に
- 同時並行 fetch は禁止（カメラ画面で連打防止）：[[15_camera_screen]] でガード
- 認証はないので Authorization ヘッダは不要
