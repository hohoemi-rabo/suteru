# チケット索引

「これどう捨てる？」 MVP（フェーズ1）の作業チケット一覧。仕様の正本は `REQUIREMENTS.md`、プロジェクト全体ガイドは `CLAUDE.md`。

## Todo記法（**必読**）

各チケット内の Todo は以下で管理する:

- 未完了: `- [ ]`
- **完了: `- [×]`**（× は全角の乗算記号 U+00D7。半角小文字 `x` ではない）

完了させたら `- [ ]` を `- [×]` に書き換える。CLAUDE.md にも同記載あり。

## チケット一覧

### A. データ・アピール資料（先行作業）

| # | チケット | 内容 |
|---|---|---|
| 01 | [データ整備](01_data_preparation.md) | `items.json` 拡充、No.36 パターン確認、リサイクルステーション、地区座標 |
| 02 | [行政アピール資料](02_admin_pitch_materials.md) | 飯田市環境課向け1ページ資料 |

### B. 基盤セットアップ

| # | チケット | 内容 |
|---|---|---|
| 03 | [デザインシステム](03_design_system.md) | 配色パレット、タイポグラフィ、NativeWind 導入 |
| 04 | [プロジェクトセットアップ](04_project_setup.md) | Expo 依存追加、テンプレート整理、ルートREADME差し替え |
| 05 | [型定義](05_type_definitions.md) | `types/index.ts` で要件定義§5.3の型を整備 |
| 06 | [Workerデプロイ](06_worker_deployment.md) | KV namespace 作成、Secret 登録、dev/prod デプロイ |

### C. ライブラリ層（lib/）

| # | チケット | 内容 |
|---|---|---|
| 07 | [データローダー](07_data_loader.md) | バンドルJSON + リモート最新版の取得・キャッシュ |
| 08 | [ストレージ層](08_storage_layer.md) | `lib/storage.ts` AsyncStorageラッパー |
| 09 | [APIクライアント](09_api_client.md) | `lib/api.ts` Worker `/api/identify` 呼び出し |
| 10 | [収集日計算ロジック](10_schedule_calculator.md) | `lib/schedule-calculator.ts` patterns.jsonから次回日算出 |
| 11 | [地区判定（GPS）](11_area_detector.md) | `lib/area-detector.ts` GPS最近傍判定 |
| 12 | [通知サービス](12_notifications.md) | `lib/notifications.ts` 前夜リマインダー |

### D. 画面（app/）

| # | チケット | 機能 | 画面 |
|---|---|---|---|
| 13 | [オンボーディング画面](13_onboarding_screens.md) | F5 | Welcome / AreaSelect |
| 14 | [ホーム画面](14_home_screen.md) | - | Home（カメラボタン・検索バー・タブ） |
| 15 | [カメラ画面](15_camera_screen.md) | F1 | Camera |
| 16 | [結果画面](16_result_screen.md) | F1 | Result |
| 17 | [手動検索画面](17_manual_search_screen.md) | F2 | ManualSearch |
| 18 | [収集日画面](18_schedule_screen.md) | F3 | Schedule |
| 19 | [施設画面](19_facilities_screen.md) | F4 | Facilities |
| 20 | [リサイクルステーション画面](20_recycle_stations_screen.md) | F4 | RecycleStations |
| 21 | [設定画面](21_settings_screen.md) | - | Settings |

### E. リリース準備

| # | チケット | 内容 |
|---|---|---|
| 22 | [法務文書](22_legal_documents.md) | プライバシーポリシー・利用規約・各画面ディスクレイマー |
| 23 | [EAS Build / Play配布](23_eas_build.md) | eas.json、Google Play クローズドテスト |
| 24 | [ユーザーテスト](24_user_testing.md) | ほほ笑みラボ生徒テスト・フィードバック反映 |

## 推奨進行順

1. **並行で先行**: 01（データ）/ 02（アピール資料）/ 03（デザイン）
2. **基盤**: 04 → 05 → 06
3. **lib層**: 07・08・09・10 を並行、その後 11・12
4. **画面**: 13（初回起動フロー）→ 14（ホーム）→ 15・16（メインフロー F1）→ 17 → 18・19・20 → 21
5. **リリース**: 22 → 23 → 24

## 関連ドキュメント

- `REQUIREMENTS.md`: 仕様の正本
- `CLAUDE.md`: プロジェクト入口、技術スタック、コーディング規約
- `worker/README.md`: Worker のセットアップ・API仕様
- `worker/docs/prompt-design.md`: プロンプト設計の根拠
