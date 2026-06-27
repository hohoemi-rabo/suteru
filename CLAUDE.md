# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> セッション開始時に最初に読むプロジェクト入口です。プロジェクト全体の地図、設計原則、進捗、チケット運用をまとめています。
> 仕様の正本は `REQUIREMENTS.md`。本ファイルとずれがあれば `REQUIREMENTS.md` を優先し、本ファイルを更新する。

## プロジェクト概要

**「これどう捨てる？」(仮称)** - 飯田市のごみ分別を、カメラで撮るだけで教えてくれるAndroidアプリ。

- **ターゲット**: 飯田市在住者全般（シニア・新住民・若年層問わず）
- **目的**: 「ゴミの捨て方が分からない」を写真一枚で解決し、市役所の問い合わせ業務軽減にも寄与
- **フェーズ1スコープ**: Android、日本語、10地区対応、認証なし、画像保存なし

詳しい仕様は `REQUIREMENTS.md` に記載。

## プロジェクト構造

このリポジトリは **ルート直下が Expo アプリ本体**で、`worker/` のみ独立したサブプロジェクト（別 `package.json` / `tsconfig.json` / `wrangler.toml`）。

```
.
├── CLAUDE.md                   ← このファイル（プロジェクト入口）
├── REQUIREMENTS.md             ← アプリ仕様の正本
│
├── .claude/rules/              ← 詳細ルール集（必要時に参照）
│   ├── expo-app.md             ← Expoアプリ規約・コマンド・SDKベストプラクティス
│   ├── worker.md               ← Worker規約・コマンド・プライバシー要件
│   └── gotchas.md              ← 注意点・ハマりどころ
│
├── docs/                       ← 機能・要件単位のチケット
│   └── 00_INDEX.md             ← チケット索引・Phase 進捗（最初に見る）
│
├── app/                        ← Expo Router のページ
│   ├── _layout.tsx             ← root Stack: DataProvider + UserSettingsProvider + NotificationsScheduler
│   ├── camera.tsx              ← カメラ撮影＋判定（CameraView + ImageManipulator + identifyItem）
│   ├── search.tsx              ← 手動品目検索（一覧、ヒットタップで /result へ push）
│   ├── result.tsx              ← F1/F2 共通の結果画面（指示文は LinkedText で電話/URLタップ可 + 次回収集日 + GPS判定で地区永続化）
│   ├── recycle-stations.tsx    ← リサイクルステーション 8グループ一覧（タブ外、Facilities から push）
│   ├── disaster-waste.tsx      ← 災害時のごみ・携帯トイレ案内（タブ外、Facilities から push、ガイドブックP36）
│   ├── (tabs)/                 ← ホーム / 収集日 / 施設 / 設定 の 4 タブ + areaId ガード（収集日はリスト/カレンダー切替。ホームに「収集カレンダー」ボタン→CalendarModal でポップアップ表示）
│   ├── (onboarding)/           ← Welcome / area-select / notifications
│   └── legal/                  ← プライバシーポリシー / 利用規約（設定から push）
├── lib/                        ← 業務ロジック（純粋関数 or React Context）
│   ├── data-loader.tsx         ← AppData の bundle 即返却 + リモート更新（DataProvider/useData）
│   ├── storage.ts              ← 汎用 AsyncStorage ラッパー（getCached/setCached/clearCached）
│   ├── user-settings.tsx       ← UserSettings 永続化 + Provider/useUserSettings
│   ├── schedule-calculator.ts  ← 次回収集日算出（純粋関数、date-fns）
│   ├── recycle-station-utils.ts ← リサイクルステーション次回開催日（dates 配列スキャン）
│   ├── calendar-utils.ts       ← 収集日カレンダーの月グリッド生成（純粋関数、getCollectionsInRange 再利用）
│   ├── area-detector.ts        ← GPS 最寄り地区判定（純粋関数、Haversine）
│   ├── area-detection-ui.ts    ← GPS判定結果の確認ダイアログ→setAreaId 共通フロー
│   ├── notifications.ts        ← 通知サービス（expo-notifications、14日先までローカル予約）
│   ├── text-search.ts          ← 品目検索の正規化＋スコアリング（純粋関数、ひらがな⇄カナ吸収。逆方向＝AI具体名→一般名の末尾一致も拾う「デジタル時計→時計」）
│   ├── category-maps.ts        ← categoryId → name/color マップを 1 loop で構築（純粋関数）
│   ├── legal-documents.ts      ← プライバシーポリシー / 利用規約の本文（LegalDocument 型）
│   └── api.ts                  ← Worker クライアント（identifyItem=/api/identify、reportMissingItem=/api/report。10秒タイムアウト、デバイスIDハッシュ送信）
├── types/index.ts              ← 全 JSON / API / UserSettings の型定義
├── constants/Colors.ts         ← デザイントークン正本（Palette 緑/青/中立・Radius・Spacing・FontSize）。色プロップ直指定はここ、className は tailwind 同期トークン
├── components/                 ← 再利用コンポーネント
│   ├── AreaSelectorRow.tsx     ← ヘッダー共通の「現在の地区」行（ホーム/収集日/施設で共用、青系）
│   ├── BetaBadge.tsx           ← 各画面タイトル右の「ベータ版」緑ピルバッジ（共通）
│   ├── ScheduleCalendar.tsx    ← 収集日のカレンダー表示（月グリッド + 色ドット + 凡例カード）
│   ├── CalendarModal.tsx       ← 収集カレンダーをポップアップ（下から出るボトムシート）で表示。ScheduleCalendar を再利用。ホームの「収集カレンダー」ボタンから開く
│   ├── LinkedText.tsx          ← テキスト中の電話番号/URL をタップ可能に（tel: / ブラウザ）
│   ├── LegalDocumentScreen.tsx ← 法務文書の共通レンダラ（privacy-policy / terms-of-use 両方で使う）
│   └── ScreenBackground.tsx    ← 画面共通の背景縦グラデ（`colors` プロップで色指定可。ホーム/タブは緑、他ルートは薄青→白）+ SafeAreaView ラッパー
├── assets/                     ← 画像・フォント
├── scripts/                    ← reset-project ＋ legal-site/（docs/legal を HTML 化して GitHub Pages 公開）
├── tailwind.config.js          ← NativeWind v4 設定（constants/Colors.ts と同期した green/blue/page/body/muted/hint/line/danger ＋ boxShadow。旧 brand/accent/ink/warn は移行中で残置）
├── global.css                  ← NativeWind の @tailwind directives
├── babel.config.js             ← babel-preset-expo + nativewind/babel
├── metro.config.js             ← withNativeWind ラップ
├── nativewind-env.d.ts         ← NativeWind 型サポート
├── package.json
├── app.json                    ← reactCompiler/typedRoutes 有効、plugins 設定済み（expo-camera は recordAudioAndroidPermission:false＝マイク不要）、eas projectId/owner（eas init 済）
├── eas.json                    ← EAS Build 3 プロファイル（development/preview=dev Worker・APK / production=prod Worker・AAB、appVersionSource remote で versionCode 自動）
├── .github/workflows/          ← deploy-legal-pages.yml（docs/legal を GitHub Pages へ公開）
├── tsconfig.json               ← パスエイリアス: "@/*" → "./*"、worker/ 除外
│
├── data/                       ← バンドル用 JSON（品目辞書は公式さんあ〜る、収集日系は PDF）
│   ├── common/                 ← meta / categories / items / patterns / basic-rules /
│   │                              special-disposal / facilities / recycle-stations
│   ├── areas/                  ← areas.json（MVP 対象 10 区: No.01/09/10/15/32/33/34/35/36/37）
│   └── _sources/               ← 原本 PDF + さんあ〜る抽出/変換 JSON（.gitignore 済、コミットしない）
│
├── docs/legal/                 ← 法務文書 Markdown ミラー（GitHub Pages 公開、lib/legal-documents.ts と同期）
├── docs/pitch/                 ← 行政アピール/相談 資料（配布1枚 overview / talk-script / 環境課交渉メモ kankyoka-notes / 長野県共創 kyoso-* / **さんあ〜る担当者向け説明セット: data-provenance〔データ来歴〕・app-guide〔スクショ入り説明書〕・license-request〔許諾依頼〕** / screenshots〔実機スクショ＋撮影指示 README〕。各 md＋印刷用 html、docs/02）
│
└── worker/                     ← Cloudflare Workers（Gemini APIプロキシ、独立サブプロジェクト）
    ├── README.md               ← Workerのセットアップ・API仕様
    ├── docs/prompt-design.md   ← プロンプト設計の根拠
    ├── src/                    ← index.ts / prompt.ts / gemini.ts / rate-limit.ts / report.ts / types.ts
    ├── wrangler.toml
    ├── package.json
    └── tsconfig.json
```

実装の進行状況・次に何をやるかは `docs/00_INDEX.md` を参照（Phase 1〜4 の構成と各チケット状態を一覧化）。

## どこを見ればいいか（タスク別ガイド）

| やりたいこと | 最初に読むファイル |
|---|---|
| 次にやるべき作業を選ぶ | `docs/00_INDEX.md`（チケット索引・Phase 進捗） |
| Expoアプリのコードを書く | `.claude/rules/expo-app.md` |
| Worker のコードを書く・デプロイする | `.claude/rules/worker.md` → `worker/README.md` |
| ハマったときの解決ヒント | `.claude/rules/gotchas.md` |
| アプリの新しい画面を作る | `REQUIREMENTS.md` §6 + 該当チケット（13/14/16/18/19/20/21） |
| データ構造を変える | `REQUIREMENTS.md` §5 + `types/index.ts` |
| データを画面から使う | `lib/data-loader.tsx` の `useData()` を使う |
| 設定値（地区・通知）を読み書き | `lib/user-settings.tsx` の `useUserSettings()` |
| カテゴリ ID → 表示名/色を引く | `lib/category-maps.ts` の `buildCategoryMaps(data.categories)` |
| 次回収集日の計算 | `lib/schedule-calculator.ts` の `getNextCollectionDate` / `getAllNextCollections` |
| リサイクルステーションの次回開催日 | `lib/recycle-station-utils.ts` の `getNextStationCollection` / `getUpcomingStationDates` |
| GPS で最寄り地区判定 | `lib/area-detector.ts` の `detectArea()` |
| GPS判定後に確認ダイアログ→設定永続化 | `lib/area-detection-ui.ts` の `handleDetectionResultWithConfirm()` |
| 収集日のカレンダー月グリッドを作る | `lib/calendar-utils.ts` の `buildMonthGrid()` → `components/ScheduleCalendar.tsx` |
| カレンダーをポップアップ（モーダル）で出す | `components/CalendarModal.tsx`（ScheduleCalendar を再利用。ホームのボタンから開く） |
| ヘッダーの「現在の地区」行 | `components/AreaSelectorRow.tsx`（ホーム/収集日/施設で共用） |
| 色・余白・角丸・文字サイズのトークン | `constants/Colors.ts`（`Palette`/`Radius`/`Spacing`/`FontSize`）。className は `tailwind.config.js` の同期トークン |
| ベータ版バッジを置く | `components/BetaBadge.tsx`（各画面タイトルの右隣） |
| 画面の背景（グラデ）を変える | `components/ScreenBackground.tsx`（`colors` プロップで上→下の色を指定。ホーム/タブは緑グラデ。画面ルートで `SafeAreaView` の代わりに使う） |
| テキスト中の電話/URL をタップ可能にする | `components/LinkedText.tsx` |
| 法務文書（プライバシー/利用規約）を編集 | `lib/legal-documents.ts` + 同期して `docs/legal/*.md` も更新 |
| Workerのプロンプトを調整する | `worker/docs/prompt-design.md` → `worker/src/prompt.ts` |
| 行政アピールの材料 | `REQUIREMENTS.md` §10、`docs/02_admin_pitch_materials.md`、`docs/pitch/`（さんあ〜る担当者向けは data-provenance / app-guide / license-request の3点） |
| 何ができていて何が残っているか | `docs/00_INDEX.md`（各チケットに ✅/⏳ マーク） |

## 設計原則（変えてはいけないもの）

`REQUIREMENTS.md` §2.4 にもあるが、以下は実装中に揺らがせない:

1. **ハルシネーション・ゼロ**: AIに「飯田市のルールでは...」を答えさせない。AIの役割は品目名の特定だけ
2. **プライバシー最優先**: 画像はサーバーに保存しない、ログにも残さない
3. **オフラインでも基本機能**: カメラ判定以外はオフラインで動く
4. **ベータ表示**: データは未確定なので、各画面に「ベータ版」「公式情報を参照」のディスクレイマー

## 進捗（2026-06-27 時点）

**Phase 4 を 4/7 完了 ＋ 23 のコア実装・実機検証済み ＋ 25 未収録品目の報告（コア実装・LINE実機到達確認）**。残りは 02 行政アピール資料 / 23 のストア公開手順（外部）/ 24 ユーザーテスト。詳しい状態は `docs/00_INDEX.md` を参照。

直近（2026-06-27）の追加: 25 未収録品目の報告機能（辞書外→ボタン→LINE/Discord 通知）、ホームの「収集カレンダー」ポップアップ（`components/CalendarModal.tsx`、ScheduleCalendar 再利用）、カレンダーを日曜始まり＋薄いマス目＋「今日=緑丸／選択=枠線」に調整。preview APK は versionCode 4 でビルド投入済み。

### 完了済みチケット（21 本）

- **Phase 1〜3**: 03〜18, 21（17 本）
- **Phase 4 完了分（4 本）**:
  - 01 データ整備（全 9 JSON v1.0.0、PDF 原本照合済み、MVP 区差し替え）
  - 19 Facilities（タブ実装、外部 Google Maps リンク、リサイクルステーションへの動線）
  - 20 RecycleStations（push 画面、8 グループ × 119 拠点を次回開催日順で展開）
  - 22 法務文書（プライバシーポリシー + 利用規約、設定タブから push、Markdown ミラー）
  - 25 未収録品目の報告（コア実装。辞書外品目をユーザーがボタンで運用者へ報告 → `/api/report` → Discord 等 Webhook。画像/位置情報/個人情報なし・テキストのみ。Webhook 登録と実機デモ確認は外部手順）

### 残り Phase 4 チケット（3 本）

| # | 内容 | 備考 |
|---|---|---|
| **02** | 行政アピール資料 | 商工会議所相談 → 環境課訪問済み → **さんあ〜る（公式データ）担当者へ説明予定**。資料: 配布1枚 `overview.html` / トーク `talk-script.md` / 環境課メモ `kankyoka-notes.html` / 長野県共創 `kyoso-*`、**さんあ〜る担当者向け3点セット（`data-provenance`＝データ来歴・`app-guide`＝スクショ入り説明書・`license-request`＝許諾依頼）**。軸は「補助金でなくリリースしたい」。**リリースの鍵＝公式データ（さんあ〜る/カレンダー）の利用許諾**。フィードバック機能（未収録品目の報告）は **25 で実装済み・LINE実機到達確認**＝デモ可。交渉では「辞書外品目＝公式データの穴リストを市へ還元」を許諾の交換材料に。各文書の `【 】`（氏名・住所・日付）は提出前に差し替え |
| **23** | EAS Build / Play 配布 | **コード/設定完了・実機検証済み**（`eas.json`・法務 Pages・eas init）。残りは外部手順（GitHub Pages 有効化・Google Play 申請・署名鍵バックアップ）→ ランブックは `docs/23_eas_build.md` |
| **24** | ユーザーテスト | ほほ笑みラボ生徒。23 で preview APK 配布が可能になったので着手可 |

### 実機検証済み（2026-05-17）

- カメラ撮影 → Worker → Gemini → 品目判定 → /result 表示の一連がフロー動作
- Worker ログに画像データが残らないこと（プライバシー設計の実証）
- 電池→「乾燥剤」と Gemini が見間違うケース 1 件（データは両品目とも正常、AI ハルシネーション）。MVP 許容範囲として 24 番チケット観察項目に記録済み

### EAS Build / 配布（2026-06-02 実機検証）

- **`eas.json` 作成**: 3 プロファイル。`appVersionSource: remote`（versionCode 自動採番）、`env.EXPO_PUBLIC_API_URL` をプロファイル別に設定（development/preview=dev Worker・APK、production=prod Worker・AAB）。`channel`/OTA は不使用（`expo-updates` 無し）
- **`babel-plugin-react-compiler` を明示依存化**（reactCompiler experiment のクラウドビルド保険。過去 babel-preset-expo の transitive 未hoist でビルド失敗した前例対策）
- **`eas init` 実施**: Expo プロジェクト `@hohoemirabo/suteru`（`extra.eas.projectId` を app.json に自動追記、`owner: hohoemirabo`）。**managed のまま**（android/ios フォルダ無し）
- ⚠ **`eas init` が `android.permissions` に `RECORD_AUDIO`(マイク) を追記** → 静止画のみ＆プライバシー方針のため除去（明示権限から削除＋`expo-camera` の `recordAudioAndroidPermission: false`）。結果権限 = CAMERA + ACCESS_COARSE/FINE_LOCATION のみ
- **preview APK をクラウドビルド → 実機インストール → カメラAI（dev Worker→Gemini）動作確認済み**。スタンドアロンなので通知も実動作
- **法務文書 GitHub Pages**: `scripts/legal-site/`（marked で md→HTML）＋ `.github/workflows/deploy-legal-pages.yml`。公開 URL `https://hohoemi-rabo.github.io/suteru/privacy-policy.html`（Play 申請用）。**Pages 有効化（Settings→Pages→GitHub Actions、リポジトリ Public 必須）はユーザー操作**
- 残り外部手順: GitHub Pages 有効化 / Google Play（$25・掲載・データセーフティ・クローズドテスト）/ 署名鍵バックアップ（`eas credentials`）。詳細ランブックは `docs/23_eas_build.md`

### Worker デプロイ状態

- dev:  `https://kore-dou-suteru-api-dev.rabo-hohoemi.workers.dev`
- prod: `https://kore-dou-suteru-api-production.rabo-hohoemi.workers.dev`
- AI モデル: **`gemini-3.1-flash-lite`**（`worker/wrangler.toml`、dev/prod 共通）
- KV ネームスペース: dev/prod 共有（レート制限は端末 ID 別キー）
- `[env.X]` 配下に `kv_namespaces` と `vars` を明示する必要あり（上書きしない！ → `.claude/rules/gotchas.md` 参照）
- **エンドポイント**: `POST /api/identify`（画像→品目名）／`POST /api/report`（25 未収録品目の報告。テキストのみ・画像なし）／`GET /healthz`
- **通知先 Secret（任意・report 用）**: `LINE_CHANNEL_ACCESS_TOKEN` + `LINE_TO`（LINE Messaging API push。LINE Notify は 2025-03 終了済み）／`REPORT_WEBHOOK_URL`（Discord 互換）。両方あれば両方へ送る。未設定でも報告は受理（転送しないだけ）。Secret は env 別に登録。**dev/prod とも登録済み・LINE 実機到達確認済み（2026-06-27）**

### データ整備状況

- **品目辞書（items.json）は飯田市公式アプリ「さんあ〜る」589品目に全置換**（81d0200、version 1.1.0）
  - 出典: `https://manage.delight-system.com/threeR/web/bunbetsu?jichitaiId=iidashi`（飯田市公式の分別検索アプリ）。利用許諾は 02 行政アピールで対応予定
  - 旧 95 品目（手作り）→ 589 品目。検索でヒットしない品目が激減
  - `categoryId` は公式の主区分（先頭区分）を 11 値にマップ。複数区分の部品別の捨て方は `instruction` に保持（【埋】【特】等）
  - 別名（aliases）は公式の `data-keyword` から抽出（検索品質維持）。5品目は公式に別名データが無く空
  - 生データ・変換中間ファイルは `data/_sources/sanaru-bunbetsu.json` / `items-converted.json`（gitignore）
- **カテゴリが 13 → 11 に**（categories.json version 1.1.0）: `plastic_product`（公式はプラを資源(プラ)1本化）と `oversized`（公式は大型品も素材別分類）を削除。`types/index.ts` の CategoryId も 11 値
- **収集日・施設・リサイクルステーションは引き続き令和8年度 PDF ベース**（10区: No.01/09/10/15/32-37）
  - facilities 6 施設 / recycle-stations 8 グループ × 119 拠点 / special-disposal 7 エントリ / patterns 10 種 / basic-rules
- **MVP 対象 10 区**: No.01 / 09 / 10 / 15 / 32 / 33 / 34 / 35 / 36 / 37（01 市街中心、09・10 飯田市街中心部・橋南、15 座光寺、32〜35 下黒田周辺、36 丹保・北条・飯沼南、37 南条・別府上・別府下）
  - No.09/10 を追加（2026-06-02、公式PDF area09/area10 から抽出）: No.09 燃やす月水金 / No.10 燃やす月木、両区ともプラ毎週木・埋立特定金属紙すべて第1・3木（`pattern_mwf_thu_n13thu` / `pattern_mt_thu_n13thu`）
- **patterns.json**: 10 区中 6 区で「埋立 と 金属/紙 が別曜日」（No.09/10 は埋立特定金属紙すべて同日＝第1・3木）。命名規則 `pattern_<燃やす>_<プラ>_<埋立特定>[_<金属紙>]`
- **No.37 の存在**: REQUIREMENTS.md §2.3 は「No.36 まで」だが実態は No.37 まで（要修正）
- **注意: PDF とさんあ〜るで分類体系が一部異なる**（プラの分け方など）。品目辞書はさんあ〜る、収集パターンは PDF が正本

### result.tsx の GPS 地区判定（11be98a で変更）

- 旧仕様: 「現在地で確認」ボタン → 一時的に地区を上書き表示、ホームに戻ると元の地区に戻る
- 新仕様: 「現在地から地区を設定」ボタン → 確認ダイアログ → `UserSettings.areaId` を永続化更新
- 共通フローは `lib/area-detection-ui.ts` の `handleDetectionResultWithConfirm()` に集約（将来ホーム画面などに同じ動線を追加する場合も再利用可）

### UI/UX ブラッシュアップ

- **WCAG AA カラーパス**（0d8c53b）: `tailwind.config.js` の brand-500 `#15803D` / brand-600 `#166534` / warn-600 `#991B1B` に変更（白文字・リンク文字が全て AA 通過）。ハードコード hex も全置換 ※ **一時 d356ab8 でシビック青へ刷新したが eb14e80 でグリーンに復帰（最下部の項目参照）。本バレットの brand 緑値が現行**
- **文字サイズ底上げ**（0d8c53b）: disclaimer/警告/住所/施設情報など重要情報を text-xs→sm / sm→base に。ベータ版バッジは全画面統一（settings 含む）
- **カメラ判定枠**（0d8c53b）: `app/camera.tsx` に中央の正方形枠（75%）+ 暗幕 + 角ブラケット + ヒント文。撮影時に枠サイズで中心クロップしてから Gemini 送信 → 枠外は判定対象外
- **収集日カレンダー表示**（e235473）: 収集日画面に「リスト / カレンダー」トグル。`components/ScheduleCalendar.tsx` + `lib/calendar-utils.ts`（月グリッド + 色ドット + 凡例 + 日付タップ詳細）
- **ヘッダー 3 画面統一**（17e8783）: ホーム/収集日/施設のヘッダーを「タイトル + ベータ版」+「現在の地区」専用行の 2 行構成に。`components/AreaSelectorRow.tsx` を共用
- **ガイドブック要点の表面化**（ea21671）: ① `components/LinkedText.tsx` で result の指示文中の電話/URL をタップ可能化、② 施設に受入品目（`Facility.acceptedItems`）、③ `app/disaster-waste.tsx` で災害時のごみ・携帯トイレ案内（施設からpush）
- **シビック配色 + 背景グラデ**（d356ab8）〔※ 配色（brand 青化）は eb14e80 でグリーンに差し戻し済み。ink スレート系・背景グラデ・accent `#0369A1` 化はこのコミットのまま現行〕: エコ緑 → 行政シビックのネイビー＋青へ刷新（ui-ux-pro-max「Accessible & Ethical」、全色 WCAG AA 検証済み）。`tailwind.config.js` で brand を青系（CTA brand-500 `#0369A1` 5.9:1 / リンク brand-600 `#075985` 7.0:1 / 薄背景 brand-100 `#E0F2FE`）、ink をスレート＋ネイビー（本文 ink-900 `#0F172A` 16:1 / 補助 ink-500 `#475569` 7.5:1 / 枠 ink-200 `#E2E8F0`）に。旧 accent `#0EA5E9`（白背景 2.8:1 で AA 不通過）も `#0369A1` / 薄背景 `#E0F2FE` に修正。エコ緑 `#15803D` は success トークンとして限定温存。ハードコード hex も追従（`#166534`→`#075985` / `#6B7280`→`#475569` / `#1F2937`→`#0F172A`）
- **背景グラデーション**（d356ab8）: `expo-linear-gradient` 導入 + `components/ScreenBackground.tsx`（薄青 `#EFF6FF` → 白 `#FFFFFF` の縦グラデ、ビューポート固定で中身がスクロール）。12 画面ルートを `<SafeAreaView className="flex-1 bg-bg">` → `<ScreenBackground edges={...}>` に置換。`bg-bg` トークンは純白 `#FFFFFF` に戻し、カード/検索/シート等の「面」用に維持。カメラ画面（`app/camera.tsx`）はカメラビューが覆うため対象外。カテゴリ識別色（`categories.json`）は別系統のため不変
- **グリーン復帰 + ピル + シャドウ elevation（現行配色）**（eb14e80, 2026-06-02）: シビック青（d356ab8）から**メインをエコ緑に差し戻し**（brand-500 `#15803D` / brand-600 `#166534` / brand-100 `#DCFCE7`、全 AA）。**ただし「現在の地区」カード（`components/AreaSelectorRow.tsx`）のみ青を維持**（`accent-700` `#075985` 追加、まさゆきさん指定）。情報アクセント（情報カード / result の位置判定ボタン・次回開催カード / 施設の RS 動線 / カレンダー土曜ラベル）は**青 accent のまま**＝「緑メイン＋青アクセント」構成（元デザイン踏襲）。ink スレート系・背景グラデ・accent `#0369A1` 化は d356ab8 のまま維持。あわせて ui-ux-pro-max の Spotify 風概念を一部移植: 主要/アウトラインボタンをピル（`rounded-full`）、カメラヒーローを円形、カードを生グレー枠 → `shadow-card` / `shadow-elevated`（`tailwind.config.js` の boxShadow トークン、面は `bg-bg` 白）。⚠️ **動的 shadow 付与でネイティブクラッシュした経緯あり**（収集日トグル、77537c2 で修正）→ `.claude/rules/gotchas.md` の NativeWind 項参照
- **デザイントークン体系 + 明るくポップな再デザイン（現行・タブ4画面）**（d03a4bf, 2026-06-02）: `design/UI-IMPROVEMENT.md` + `design/Colors.ts` を正本に、`constants/Colors.ts` を**デザイントークンの正本**として新設（`Palette`＝緑/青/中立、`Radius`/`Spacing`/`FontSize`）。色プロップ直指定（タブバー・アイコン・グラデ）は `Palette` を、className は `tailwind.config.js` に**同期した新トークン**（`green`/`blue`/`page`/`body`/`muted`/`hint`/`line`/`danger`）を参照（Approach A: NativeWind 維持＋tailwind 同期）。**主役の緑は green[400] `#1D9E75`**（カメラボタン・アクティブタブ・主要ボタン）、地区/リンク/情報は青系、見出しは green[900]。タブバー/ホーム/収集日/施設/設定を再構成（緑グラデ背景、ピル検索バー、フラット円形カメラボタン、`components/BetaBadge.tsx` 共通バッジ、収集日「次の収集」は**カテゴリ色ヒーローカード**＝白文字＋白タグ、凡例カード化、施設の白カード＋緑ピル電話ボタン、設定の緑選択チップ＋青「お知らせ」）。`__DEV__` の診断/開発者セクションは未変更。⚠️ **green[400] `#1D9E75` は白/小文字で 3.4:1（小文字 AA 4.5 未満）**＝ポップさ優先で許容（まさゆきさん判断）。大きい文字・アイコンは AA 域。※ **旧 brand/accent/ink/warn トークン（下記グリーン復帰の項）は移行期間として残置**。全面確認後に削除予定
- 方針: シニア専用ではなく「誰でも使いやすい」ユニバーサルデザイン（ターゲットは若年層・新住民寄り、捨て方が分からない人が主）

### コードレビュー指摘の状態（vercel-react-best-practices）

- ✅ #2 カテゴリ Map ヘルパー DRY 化（`lib/category-maps.ts` 作成、3 ファイルの重複削除、97c911c）
- ✅ #3 `app/camera.tsx` の no-op `onCameraReady` コールバック削除（カメラ枠実装時に対応、0d8c53b）
- ⏳ #1 `router` 直接 import vs `useRouter()` Hook の混在統一（軽微、未着手）

### 後続作業（チケット未切り出し）

- **さんあ〜る品目データの利用許諾**（飯田市・delight-system）— 02 行政アピールで対応。リリース前必須
- items.json の警告（warnings）整備 — 公式変換では全 warnings 空。重要注意（火災・けが等）は instruction 内にあるが、別フィールド化は未
- recycle-stations.json 各拠点 119 件への lat/lng 付与（MapView 導入と「最寄りグループ推定」の前提）
- 法務文書の外部 URL 公開（23 EAS Build 直前）
- 法務文書の弁護士・行政書士確認（本格リリース前推奨）
- 飯田市公式情報の利用許諾打診（02 と並行）
- PDF とさんあ〜るのプラ分類体系の差異の最終確認（現状はさんあ〜る優先）
- REQUIREMENTS.md §2.3 の「No.36 まで」→「No.37 まで」修正
- **ガイドブックとカレンダーの食い違いの市確認**（稲葉クリーンセンター料金 220 vs 180円、家電引取業者の住所/業者名/電話）。詳細は `.claude/rules/gotchas.md` データまわり参照

## チケット管理（`docs/` 配下）

要件・機能ごとに `docs/` 配下に連番付きチケットファイルを置いている。`docs/00_INDEX.md` が索引なので、作業開始前にまず参照する。

### Todo記法のルール（**重要**）

各チケットファイル内の Todo は以下の記法で管理する:

- 未完了: `- [ ] タスク内容`
- **完了: `- [×] タスク内容`**（`×` は **全角の乗算記号 U+00D7**）

タスクを完了させたら、必ず `- [ ]` を `- [×]` に書き換えること。通常の Markdown チェックボックスの `- [x]`（半角小文字 x）ではなく、**全角 × 記号** を使う点に注意。

例:
```
- [ ] まだやってないこと
- [×] 完了したこと
```

新しい Todo が発生したらそのチケットの該当セクションに `- [ ]` 形式で追記する。スコープが既存チケットを超える場合は、新しい連番のチケットを `docs/` に切ること。

## 詳細ルールへの参照

サブ領域固有の規約は `.claude/rules/` 配下の個別ファイルに分けている。該当領域の実装に入る前に読む:

- **Expoアプリ**を触る前 → @.claude/rules/expo-app.md
- **Worker**を触る前 → @.claude/rules/worker.md
- **何かに詰まったとき** → @.claude/rules/gotchas.md
