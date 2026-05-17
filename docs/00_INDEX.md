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
| 01 | [データ整備](01_data_preparation.md) | `items.json` 拡充、No.36 パターン確認、リサイクルステーション、地区座標 | ⏳ Phase 4 |
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
| 11 | [地区判定（GPS）](11_area_detector.md) | `lib/area-detector.ts` GPS最近傍判定 | ⏳ Phase 1（次） |
| 12 | [通知サービス](12_notifications.md) | `lib/notifications.ts` 前夜リマインダー | ✅ 完了 |

### D. 画面（app/）

| # | チケット | 機能 | 画面 | 状態 |
|---|---|---|---|---|
| 13 | [オンボーディング画面](13_onboarding_screens.md) | F5 | Welcome / AreaSelect | ⏳ Phase 1 |
| 14 | [ホーム画面](14_home_screen.md) | - | Home（カメラボタン・検索バー・タブ） | ⏳ Phase 1 |
| 15 | [カメラ画面](15_camera_screen.md) | F1 | Camera | ✅ 完了 |
| 16 | [結果画面](16_result_screen.md) | F1 | Result | ✅ 完了 |
| 17 | [手動検索画面](17_manual_search_screen.md) | F2 | ManualSearch | ✅ 完了 |
| 18 | [収集日画面](18_schedule_screen.md) | F3 | Schedule | ✅ 完了 |
| 19 | [施設画面](19_facilities_screen.md) | F4 | Facilities | ⏳ Phase 4 |
| 20 | [リサイクルステーション画面](20_recycle_stations_screen.md) | F4 | RecycleStations | ⏳ Phase 4 |
| 21 | [設定画面](21_settings_screen.md) | - | Settings | ✅ 完了 |

### E. リリース準備

| # | チケット | 内容 | 状態 |
|---|---|---|---|
| 22 | [法務文書](22_legal_documents.md) | プライバシーポリシー・利用規約・各画面ディスクレイマー | ⏳ Phase 4 |
| 23 | [EAS Build / Play配布](23_eas_build.md) | eas.json、Google Play クローズドテスト | ⏳ Phase 4 |
| 24 | [ユーザーテスト](24_user_testing.md) | ほほ笑みラボ生徒テスト・フィードバック反映 | ⏳ Phase 4 |

## 進行順（確定 2026-05-17）

段階的に「使える状態」を作る方針で、4 フェーズに分割:

### Phase 1: ベース完成（Worker 不要）
> 起動 → 地区選択 → ホーム表示 の最小ループ完成

1. **11** 地区判定（GPS、純粋ロジック寄り） ← **次**
2. **13** オンボーディング（Welcome + AreaSelect）
3. **14** ホーム本実装（診断カード卒業、見栄え整える）

### Phase 2: データ表示系（Worker 不要、価値が増える）
> 「カレンダー + 通知アプリ」として実用可

4. **18** Schedule（10 の計算結果を画面化）
5. **12** 通知サービス（前夜リマインダー）
6. **17** ManualSearch（オフライン保険）
7. **21** Settings（地区変更・通知設定 UI）

### Phase 3: F1 コア体験（Worker 必須、まとめて片付ける）
> 「これどう捨てる？」の目玉機能が動く

8. **06** Worker デプロイ（対話的コマンド）
9. **09** API クライアント
10. **15** Camera
11. **16** Result

### Phase 4: 周辺機能 + リリース準備
> ストア公開・ユーザーテストへ

12. **19** Facilities
13. **20** RecycleStations
14. **01** データ整備（skeleton を実データに、PDF 照合）
15. **02** 行政アピール資料
16. **22** 法務文書
17. **23** EAS Build / Play 配布
18. **24** ユーザーテスト

### 判断ポイント

- フェーズ内の順序は走りながら微調整可（例: Phase 2 で 18 と 12 を入れ替えるなど）
- 行政アピール（02）の面談が決まったら Phase 1 と並行で前倒し
- F1 を早く見たい場合は Phase 2 ↔ Phase 3 を入れ替え可

## 関連ドキュメント

- `REQUIREMENTS.md`: 仕様の正本
- `CLAUDE.md`: プロジェクト入口、技術スタック、コーディング規約
- `worker/README.md`: Worker のセットアップ・API仕様
- `worker/docs/prompt-design.md`: プロンプト設計の根拠
