# 15. カメラ画面（F1）

> 関連: `REQUIREMENTS.md` §3.1（メインフロー）, F1
> ステータス: ✅ 完了（2026-05-17）

## 実装メモ

- `expo-camera@17.0.10` の `CameraView` + `useCameraPermissions()` を採用（モダン API）
- `expo-image-manipulator@~14.0.8` を新規導入し、撮影後に長辺 **1280px / JPEG quality 0.7** に正規化。Worker 7MB 上限を確実に下回る
- 結果モーダルは **Bottom Sheet 風 Modal をインライン実装**（17 と同様、Result 画面 16 ができたら router.push に差し替え）
- 4 outcome 出し分け: hit / unknown_name（Gemini が辞書外品目を返した）/ not_identifiable / error
- Worker → items.json の lookup は `normalizeJa` で完全一致 → ダメなら `searchItems(items, name, 1)` の fuzzy fallback
- 連打防止: `state.kind !== 'ready'` ガード（lib/api.ts ではなく Camera 側の責務、09 で決めた通り）
- プライバシー注記「画像は保存されません」を常時右上に表示

## 目的

`expo-camera` でカメラビューを表示し、撮影 → 圧縮 → Worker への送信 → 結果画面遷移を行う。MVPの中核機能。

## 完了条件

- カメラビューが起動し、シャッターボタンで撮影できる
- 撮影画像が適切に圧縮されて Worker に送られる
- 通信中のローディングが安心感のあるアニメーションで表示される
- 結果が出たら Result 画面に遷移する

## Todo

### 基本実装

- [×] `app/camera.tsx` 作成（Expo Router 自動検出、ルート直下）
- [×] `expo-camera` の `CameraView` をマウント
- [×] カメラパーミッション未取得時の許可フロー
- [×] 戻るボタン（左上オーバーレイ）

### 撮影フロー

- [×] シャッターボタン押下 → `takePictureAsync({ quality: 0.8, base64: false, skipProcessing: true })`
- [ ] 撮影直後のプレビュー — シニア配慮で省略、即判定へ
- [×] expo-haptics で撮影フィードバック（Medium impact）

### 画像処理

- [×] 解像度を縮小（長辺 1280px、`ImageManipulator.manipulateAsync`）
- [×] JPEG 圧縮（quality 0.7）
- [×] base64 サイズが Worker 上限（7MB）に収まる（`lib/api.ts:25` の MAX_BASE64_LEN で防御）
- [×] `expo-image-manipulator` 導入

### Worker 呼び出し

- [×] [[09_api_client]] の `identifyItem(base64, 'image/jpeg')` を呼ぶ
- [×] 通信中は **連打防止**（state.kind !== 'ready' ガード）
- [×] ローディング表示（ActivityIndicator + 「判定中…」+ 半透明オーバーレイ）

### 遷移

- [×] 成功（品目名ヒット）: Bottom Sheet モーダルで instruction / warnings 表示（16 完成時に router.push に差し替え）
- [×] 成功（辞書外名 / 不明）: それぞれの専用モーダル + 文字検索誘導
- [×] エラー: モーダルで `userMessage` 表示 + 「もう一度撮る」「文字検索を試す」

### エラーハンドリング

- [×] レート制限 429: `userMessage` で「リクエストが多すぎます…」（09 で対応済み、Camera は表示するだけ）
- [×] ネット切断: 同上 + 「文字検索を試す」誘導
- [×] タイムアウト: 同上
- [×] カメラ拒否時: PermissionDenied 画面 → 「設定アプリを開く」or 「カメラを許可する」（canAskAgain で分岐）

### パーミッション

- [×] `app.json:42-46` の cameraPermission 文言は既に整備済み（04 で対応）
- [×] 拒否時の UX：プライバシー説明文 +「設定で許可」or「カメラを許可」ボタン

### プライバシー表示

- [×] 画面に「画像は保存されません」を右上に常時表示

## 注意点

- **画像はサーバーに保存されない**（§2.4, §7.1）。この設計をユーザーにも見せると安心感が出る
- React Compiler 環境では `takePictureAsync` 結果を ref に入れず state で管理
- カメラビューは大きく、シャッターボタンは画面下部の親指届く位置に
- カメラ初期化が遅い端末では「カメラ起動中…」表示を出す
