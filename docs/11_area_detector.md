# 11. 地区判定（lib/area-detector.ts）

> 関連: `REQUIREMENTS.md` §3.2（補助フロー: 地区切替）, F5
> ステータス: 未着手

## 目的

ユーザーの「現在地で確認」操作時に、`expo-location` で GPS を取得し、`data/areas/areas.json` の `representativePoint` から最も近い地区を判定する。

## 完了条件

- 結果画面で「現在地で確認」ボタンを押すと、3秒以内に最寄り地区が判定される
- 8地区のいずれにも近くない場合は「対応エリア外」を返す
- GPS が拒否された場合のメッセージが明確

## Todo

### 基本実装

- [ ] `lib/area-detector.ts` 作成
- [ ] `requestLocationPermission()`: 許可リクエスト、許可状態を返す
- [ ] `getCurrentLocation()`: 1回限りの GPS 取得（タイムアウト10秒）
- [ ] `findNearestArea(lat, lng, areas: Area[]): Area | null`: 最近傍判定
- [ ] 距離計算は Haversine 公式または平面近似（飯田市内なら平面近似で十分）

### 「対応エリア外」判定

- [ ] 最近傍地区との距離が閾値超なら null を返す（例：10km超）
- [ ] 閾値を決める根拠：MVP 8地区の地理的範囲を確認して調整

### エラーハンドリング

- [ ] 位置情報拒否：明示的なエラー型で返し、UI で誘導
- [ ] タイムアウト：「位置を取得できませんでした」
- [ ] GPS無効（屋内など）：「位置の精度が低いです」を表示するか

### プライバシー

- [ ] **オンデマンド取得のみ。常時監視しない**（§7.1）
- [ ] サーバーには送信しない（端末内完結）
- [ ] 取得後の座標はメモリ上でのみ使用、永続化しない

### 統合

- [ ] [[16_result_screen]] の「現在地で確認」ボタン
- [ ] [[19_facilities_screen]] / [[20_recycle_stations_screen]] の地図表示で参考に使えるか検討

## 注意点

- `expo-location` の許可文言を `app.json` plugins で設定（[[04_project_setup]]）
- 「位置情報の使い方」をプライバシーポリシーに明記（[[22_legal_documents]]）
- 8地区しかない MVP では「対応エリア外」率が高くなる前提。UX 文言で誘導
- `representativePoint` の座標精度が低いと誤判定する。[[01_data_preparation]] で精度を上げる
