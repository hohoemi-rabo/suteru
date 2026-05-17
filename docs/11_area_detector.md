# 11. 地区判定（lib/area-detector.ts）

> 関連: `REQUIREMENTS.md` §3.2（補助フロー: 地区切替）, F5
> ステータス: 実装完了（16/19/20 への配線は各画面チケットで対応）

## 目的

ユーザーの「現在地で確認」操作時に、`expo-location` で GPS を取得し、`data/areas/areas.json` の `representativePoint` から最も近い地区を判定する。

## 完了条件

- 結果画面で「現在地で確認」ボタンを押すと、3秒以内に最寄り地区が判定される
- 8地区のいずれにも近くない場合は「対応エリア外」を返す
- GPS が拒否された場合のメッセージが明確

## Todo

### 基本実装

- [×] `lib/area-detector.ts` 作成
- [×] `ensureLocationPermission()`: 権限確認＋未確定時にリクエスト、`'granted' | 'denied' | 'undetermined'` を返す
- [×] `getCurrentCoords(timeoutMs)`: 1回限りの GPS 取得（Promise.race でタイムアウト、デフォルト10秒）
- [×] `findNearestArea(coords, areas)`: 最近傍判定（distance も返す）
- [×] 距離計算は **Haversine 公式** で実装（地球半径 6371km）

### 「対応エリア外」判定

- [×] 最寄り地区との距離 > `OUT_OF_AREA_DISTANCE_KM`（10km）なら `{ ok: true, area: null, reason: 'out_of_area' }` を返す
- [×] 閾値の根拠: 8地区の地理的範囲は緯度差≈8km、経度差≈8km。10km なら市内ならどこかには到達できる

### エラーハンドリング

- [×] 位置情報拒否: `{ ok: false, error: 'permission_denied' }`、UI 側で設定アプリ誘導
- [×] タイムアウト: `{ ok: false, error: 'timeout' }`
- [×] GPS不可・未取得: `{ ok: false, error: 'unavailable' }` または `'unknown'`
- [×] 結果は discriminated union（`DetectionResult`）で UI 側が網羅できる

### プライバシー

- [×] オンデマンド取得のみ。常時監視（watchPosition）は実装しない
- [×] サーバーには送信しない（端末内完結）
- [×] 取得後の座標はメモリ上のみ、AsyncStorage / SecureStore には書かない

### 統合

- [ ] [[16_result_screen]] の「現在地で確認」ボタン ← 16 で配線
- [ ] [[19_facilities_screen]] / [[20_recycle_stations_screen]] の地図表示で参考に使えるか検討 ← 19/20 で判断

### 高レベル統合関数

- [×] `detectArea(areas, timeoutMs?)`: 「許可確認 → GPS取得 → 最寄り判定」をワンコール
- [×] ホーム画面に「現在地で判定」デバッグボタンを追加して動作確認可能に

## 注意点

- `expo-location` の許可文言を `app.json` plugins で設定（[[04_project_setup]]）
- 「位置情報の使い方」をプライバシーポリシーに明記（[[22_legal_documents]]）
- 8地区しかない MVP では「対応エリア外」率が高くなる前提。UX 文言で誘導
- `representativePoint` の座標精度が低いと誤判定する。[[01_data_preparation]] で精度を上げる
