# チケット索引

「これどう捨てる？」 MVP（フェーズ1）の作業チケット一覧。仕様の正本は `REQUIREMENTS.md`、プロジェクト全体ガイドは `CLAUDE.md`。

## Todo記法（**必読**）

各チケット内の Todo は以下で管理する:

- 未完了: `- [ ]`
- **完了: `- [×]`**（× は全角の乗算記号 U+00D7。半角小文字 `x` ではない）

完了させたら `- [ ]` を `- [×]` に書き換える。CLAUDE.md にも同記載あり。

## チケット一覧

### A. データ・アピール資料（先行作業）

| # | チケット | 内容 | 状態 |
|---|---|---|---|
| 01 | [データ整備](01_data_preparation.md) | `items.json` 拡充、No.36 パターン確認、リサイクルステーション、地区座標 | ✅ 完了 (2026-05-17) |
| 02 | [行政アピール資料](02_admin_pitch_materials.md) | 飯田市環境課向け1ページ資料 | ⏳ Phase 4 |

### B. 基盤セットアップ

| # | チケット | 内容 | 状態 |
|---|---|---|---|
| 03 | [デザインシステム](03_design_system.md) | 配色パレット、タイポグラフィ、NativeWind 導入 | ✅ 完了（叩き台） |
| 04 | [プロジェクトセットアップ](04_project_setup.md) | Expo 依存追加、テンプレート整理、ルートREADME差し替え | ✅ 完了 |
| 05 | [型定義](05_type_definitions.md) | `types/index.ts` で要件定義§5.3の型を整備 | ✅ 完了 |
| 06 | [Workerデプロイ](06_worker_deployment.md) | KV namespace 作成、Secret 登録、dev/prod デプロイ | ✅ 完了 |

### C. ライブラリ層（lib/）

| # | チケット | 内容 | 状態 |
|---|---|---|---|
| 07 | [データローダー](07_data_loader.md) | バンドルJSON + リモート最新版の取得・キャッシュ | ✅ 完了 |
| 08 | [ストレージ層](08_storage_layer.md) | `lib/storage.ts` AsyncStorageラッパー | ✅ 完了 |
| 09 | [APIクライアント](09_api_client.md) | `lib/api.ts` Worker `/api/identify` 呼び出し | ✅ 完了 |
| 10 | [収集日計算ロジック](10_schedule_calculator.md) | `lib/schedule-calculator.ts` patterns.jsonから次回日算出 | ✅ 完了 |
| 11 | [地区判定（GPS）](11_area_detector.md) | `lib/area-detector.ts` GPS最近傍判定 | ✅ 完了 |
| 12 | [通知サービス](12_notifications.md) | `lib/notifications.ts` 前夜リマインダー | ✅ 完了 |

### D. 画面（app/）

| # | チケット | 機能 | 画面 | 状態 |
|---|---|---|---|---|
| 13 | [オンボーディング画面](13_onboarding_screens.md) | F5 | Welcome / AreaSelect | ✅ 完了 |
| 14 | [ホーム画面](14_home_screen.md) | - | Home（カメラボタン・検索バー・タブ） | ✅ 完了 |
| 15 | [カメラ画面](15_camera_screen.md) | F1 | Camera | ✅ 完了 |
| 16 | [結果画面](16_result_screen.md) | F1 | Result | ✅ 完了 |
| 17 | [手動検索画面](17_manual_search_screen.md) | F2 | ManualSearch | ✅ 完了 |
| 18 | [収集日画面](18_schedule_screen.md) | F3 | Schedule | ✅ 完了 |
| 19 | [施設画面](19_facilities_screen.md) | F4 | Facilities | ✅ 完了 (2026-05-17) |
| 20 | [リサイクルステーション画面](20_recycle_stations_screen.md) | F4 | RecycleStations | ✅ 完了 (2026-05-17) |
| 21 | [設定画面](21_settings_screen.md) | - | Settings | ✅ 完了 |

### E. リリース準備

| # | チケット | 内容 | 状態 |
|---|---|---|---|
| 22 | [法務文書](22_legal_documents.md) | プライバシーポリシー・利用規約・各画面ディスクレイマー | ⏳ Phase 4 |
| 23 | [EAS Build / Play配布](23_eas_build.md) | eas.json、Google Play クローズドテスト | ⏳ Phase 4 |
| 24 | [ユーザーテスト](24_user_testing.md) | ほほ笑みラボ生徒テスト・フィードバック反映 | ⏳ Phase 4 |

## 進行順（2026-05-17 更新）

### Phase 1〜3: ✅ 全て完了

- Phase 1（ベース完成）: 11 / 13 / 14
- Phase 2（データ表示系）: 18 / 12 / 17 / 21
- Phase 3（F1 コア体験）: 06 / 09 / 15 / 16

実機検証済み。詳細は CLAUDE.md の「進捗」セクション。

### Phase 4: 残りのリリース準備（推奨順）

> ストア公開・ユーザーテストへ。01 を起点に、データが入ると 19/20 が data-driven に書ける。

1. ✅ **01** データ整備 完了（2026-05-17） — 全 9 JSON が version 1.0.0、MVP 対象 8 区が No.01/15/32-37 に確定
2. ✅ **19** Facilities / **20** RecycleStations 完了（2026-05-17） — `app/(tabs)/facilities.tsx` 本実装、`app/recycle-stations.tsx` 新規、`lib/recycle-station-utils.ts` 追加、`app/result.tsx` の SPECIAL_HANDLING をデータ駆動化
3. **22** 法務文書 / **02** 行政アピール資料（並行可）
4. **23** EAS Build / Play 配布（preview APK）
5. **24** ユーザーテスト（ほほ笑みラボ生徒）

### 完了に伴う影響と後続作業

- **AreaSelect 画面 (13)** は新 8 区（No.01/15/32/33/34/35/36/37）を表示するように `areas.json` が変更されたため、自動的に追従
- **REQUIREMENTS.md §2.3** の「No.36 まで」記述は実態と異なる（No.37 まで存在）→ 別途修正必要
- **MapView 埋め込み** は MVP 未対応（外部 Google Maps リンク方式）。将来必要なら別チケット
- **recycle-stations.json の各拠点 lat/lng (119件)** は別チケットに切り出し（MapView と「最寄りグループ推定」前提）
- **施設の営業時間判定**（営業中/営業時間外バッジ）は MVP 未対応、必要なら別チケット

### 判断ポイント

- 行政アピール（02）の面談が決まったら 01 と並行で前倒し
- 23 の APK ができたら 24 と並行でテスト配布開始可
- 19/20 完成時に `app/result.tsx` の SPECIAL_HANDLING ハードコードを data-driven に置換するフォローアップ作業あり

## 関連ドキュメント

- `REQUIREMENTS.md`: 仕様の正本
- `CLAUDE.md`: プロジェクト入口、技術スタック、コーディング規約
- `worker/README.md`: Worker のセットアップ・API仕様
- `worker/docs/prompt-design.md`: プロンプト設計の根拠
