# 注意点・ハマりどころ

プロジェクト固有のクセや、過去にハマったポイントの蓄積。実装中に気付いたものは随時追加する。

## データまわり

- **データ出典・来歴の正本（対外説明用）は `docs/pitch/data-provenance.md`**: 品目辞書＝さんあ〜る589品目／収集日・施設＝令和8年度計画表PDF の2系統、変換方法、差異・未確定点までまとめてある。さんあ〜る担当者への説明セットは data-provenance（来歴）＋ app-guide（スクショ入り説明書）＋ license-request（許諾依頼）。データの出所を答えるときはまずここを見る

- **⚠️ ガイドブックとカレンダーで情報が食い違う箇所がある（要・市確認）**: 飯田市ごみ出しガイドブック（2025.3 印刷）と令和8年度ごみカレンダー（2026、より新しい）で以下が異なる。**現データはカレンダー由来を採用**しているが、本格リリース前に市へ確認すべき:
  - **稲葉クリーンセンターの料金**: 現データ `220円/10kg`（カレンダー） vs ガイドブック `180円/10kg`。新しいカレンダーを採用（値上げと推測）。`facilities.json` は 220 のまま据え置き方針（まさゆきさん判断）
  - **家電リサイクル引取業者**: 現データ「前田産業（上郷別府3337-15）/ 丸齒商店 0265-34-4000」 vs ガイドブック「前田産業（上郷別府3341-3）/ 丸伝運送 0265-48-6641」。業者名・住所・電話が異なる。どちらが現行か未確認
- **収集パターンの呼び方**: 「燃やすごみ」と「燃やせるごみ」、地区によって表記揺れがあるかも。データのアプリ内表記は「燃やすごみ」で統一
- **地区数**: 飯田市全体では No.37 まで存在。MVPは PDF 入手済みの8地区（No.01/15/32/33/34/35/36/37）のみ対応。地区選択画面に「上記以外は近日対応予定」を明記済（13）
- **品目辞書は公式さんあ〜る 589 品目が正本**（2026-05-20 全置換）。元データは `data/_sources/sanaru-bunbetsu.json`、変換中間ファイルは `items-converted.json`（いずれも gitignore）。複数区分品目は主区分を categoryId にし、部品別の捨て方は instruction に保持
- **カテゴリ ID は 11 値**: さんあ〜る全置換時に `plastic_product`（プラを資源(プラ)1本化）と `oversized`（公式は素材別分類）を削除。現 categoryId は `burnable`, `plastic_resource`, `landfill`, `hazardous`, `metal_resource`, `paper_resource`, `bottle_pet`, `home_appliances`, `pc`, `small_appliances`, `not_accepted`。定期収集パターンを持つのは `CollectionCategoryId` の 6 値だけ
- **全 9 JSON 本実装済み**: 01 データ整備で skeleton を解消。品目辞書のみ後にさんあ〜るへ全置換。`meta.json` version は 1.2.0（No.09/10 追加で更新）
- **⚠️ 品目マッチングの逆方向は `endsWith` のみ（`includes` は語中誤爆）**: `lib/text-search.ts` の `scoreItem` に「AIの具体名 → 一般名の辞書項目」を拾う逆方向マッチを足す際、`includes` だと語の途中に当たり **「折りたたみ傘」→「畳」(燃やすごみ)** のような誤判定が出た（"折り**たたみ**傘" の "たたみ"）。**末尾一致 `endsWith` のみ＋辞書側 2 文字以上**に限定して回避（複合名詞の中心語＝末尾）。「間違えるより辞書外」を優先＝カメラ判定の信頼性。1 文字の中心語（傘・鍋）は別名追加で対応。2026-06

## Worker

- **デプロイ済み（2026-05-17、06 番）**: dev / prod URL は `docs/06_worker_deployment.md` 参照。KV ネームスペースは dev/prod 共有方針
- **Secret は env ごと独立**: `GEMINI_API_KEY` を更新するときは `--env development` と `--env production` の両方に `wrangler secret put` する（片方だけ更新すると不整合）
- **wrangler v3 系**: `kv:namespace create`（コロン）を使う。v4 にバージョンアップしたら `kv namespace create`（スペース）に変わる
- **`[env.X]` を定義したら `kv_namespaces` と `vars` は env 別に明示が必須**: top-level の `[[kv_namespaces]]` / `[vars]` は env を定義した瞬間にその env には**継承されない**（Cloudflare 公式仕様）。継承忘れだと `/healthz` は通るが `/api/identify` で `TypeError: Cannot read properties of undefined (reading 'get')` になる。Secret は env 別に登録するので自動継承の話とは別。06 番デプロイ直後にハマったポイント
- **`/api/report` の通知先（25 番）**: `LINE_NOTIFY` は使えない（**LINE Notify は 2025-03 終了**）→ LINE は **Messaging API の push**（`LINE_CHANNEL_ACCESS_TOKEN` + `LINE_TO`、bot を友だち追加しないと届かない）。Discord は `REPORT_WEBHOOK_URL`。`forwardReport` は **best-effort で fetch するだけ＝レスポンスを検証しない**ので、トークン/ID 誤りや友だち未追加でも `/api/report` は `success: true` を返す（届かないだけ）。到達不良の切り分けは `npm run tail` でログを見るか、検証用に一時的にレスポンス status をログ出力する。Secret は env 別（dev/prod 両方）に登録

## Expoアプリ

- **`reactCompiler` 有効**: `useMemo` / `useCallback` の手動最適化は基本不要。逆に React Compiler が嫌う書き方（条件分岐内のフック等）に注意
- **`npm install` 直は NG**: Expo SDK 54 と非互換バージョンが入りうる。**必ず `npx expo install`**（純粋 JS パッケージ、例: `date-fns` のみ例外）
- **`SafeAreaView` は `react-native-safe-area-context` から**: `react-native` 側は deprecated。詳細は `.claude/rules/expo-app.md` §SafeAreaView
- **`expo-notifications` の Expo Go 警告**: SDK 53+ から Expo Go では remote push が削除され、`import * as Notifications from 'expo-notifications'` で警告ログが出る（実害なし）。`lib/notifications.ts` の `requestPermission()` / `getPermissionStatus()` が `Constants.appOwnership === 'expo'` ガードで API 呼び出しをスキップする（許可済み扱いで通す）。本番ビルド（23 EAS）で警告は消える
- **通知の実動作確認は Dev Build / 本番ビルドで**: Expo Go では `scheduleNotificationAsync` を呼んでも警告のみで実通知は届かない。`lib/notifications.ts` の `getScheduledCount()` で何件登録されたかは確認可能。実動作確認は `npx expo run:android` で dev build をビルドするか、`eas build --profile development` を使う
- **`lib/storage.ts` 経由のみ**: AsyncStorage に直接 import せず、必ず `getCached` / `setCached` 経由
- **⚠️ NativeWind: `shadow-*`（boxShadow）を初回レンダー後に動的付与しない**: `shadow-card` 等を `active ? 'bg-bg shadow-card' : ''` のように**条件付きで既存コンポーネントに付ける/外す**と、css-interop(native) が「animated 昇格が必要」と判定し DEV 限定の `printUpgradeWarning` を発火 → その警告のプロップ文字列化が navigation context の throw するゲッター（`getKey`/`setKey`）に触れ、**`Couldn't find a navigation context` という誤解を招くクラッシュ**になる（実際は navigation 無関係、native のみ・web は無事、本番ビルドは警告ガードで無害）。**対策**: shadow は常時付与（初回マウントから存在）にする。状態で出し分けたい場合は影あり/なしの分岐に別 `key` を付けて毎回マウントし直す。2026-06 にカレンダートグルで発生（`components/ScheduleCalendar.tsx` / `app/(tabs)/schedule.tsx`）。同じ罠は transition/animation/CSS変数/コンテナクエリ系クラスの動的付与でも起きる

## EAS Build

- **⚠️ `eas init` が `app.json` に `RECORD_AUDIO`(マイク) 権限を勝手に足す**: `android.permissions` に CAMERA/RECORD_AUDIO/ACCESS_*_LOCATION を materialize する。本アプリは**静止画のみ＆プライバシー最優先**なのでマイクは不要。**対策**: `expo-camera` プラグインに `recordAudioAndroidPermission: false` を設定（プラグインが再付与しないように）＋ `android.permissions` から RECORD_AUDIO を削除。`eas init` 後は app.json の差分（projectId/owner は残す、RECORD_AUDIO は消す）を必ず確認。2026-06 発生
- **EAS Build は `.env.local` を読まない**: `EXPO_PUBLIC_*` はビルド時にバンドルへインラインされ、その値は `eas.json` の各プロファイル `env` から来る（`.env.local` はローカル `expo start` 専用）。Worker の dev/prod は preview/production プロファイルで固定。ビルド後の APK の向き先は変えられない＝プロファイルを変えて再ビルド
- **新規ファイルはコミットしてから `eas build`**: クラウドビルドは git で project を拾うため、未コミットの `eas.json` 等は反映されないことがある。事前に `npx expo-doctor`
- **`appVersionSource: remote`**: versionCode は EAS サーバ管理＝`app.json` に `versionCode` を書かない（書くと無視＋警告）。`autoIncrement` で自動採番
- **署名鍵(Keystore)**: 初回 `eas build` で生成→ EAS サーバ保管（`*.jks` は gitignore）。**紛失すると Play 更新不可**。`eas credentials` でバックアップ

## ディレクトリ運用

- `lib/` / `types/` / `app/(onboarding)/` は実装時に作成（先回り作成しない方針は守られた）
- `components/` は現状ほぼ空。再利用コンポーネントが必要になった時に作成（例: CategoryBadge は 16 で）
