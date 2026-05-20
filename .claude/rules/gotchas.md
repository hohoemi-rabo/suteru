# 注意点・ハマりどころ

プロジェクト固有のクセや、過去にハマったポイントの蓄積。実装中に気付いたものは随時追加する。

## データまわり

- **⚠️ ガイドブックとカレンダーで情報が食い違う箇所がある（要・市確認）**: 飯田市ごみ出しガイドブック（2025.3 印刷）と令和8年度ごみカレンダー（2026、より新しい）で以下が異なる。**現データはカレンダー由来を採用**しているが、本格リリース前に市へ確認すべき:
  - **稲葉クリーンセンターの料金**: 現データ `220円/10kg`（カレンダー） vs ガイドブック `180円/10kg`。新しいカレンダーを採用（値上げと推測）。`facilities.json` は 220 のまま据え置き方針（まさゆきさん判断）
  - **家電リサイクル引取業者**: 現データ「前田産業（上郷別府3337-15）/ 丸齒商店 0265-34-4000」 vs ガイドブック「前田産業（上郷別府3341-3）/ 丸伝運送 0265-48-6641」。業者名・住所・電話が異なる。どちらが現行か未確認
- **収集パターンの呼び方**: 「燃やすごみ」と「燃やせるごみ」、地区によって表記揺れがあるかも。データのアプリ内表記は「燃やすごみ」で統一
- **地区数**: 飯田市全体では No.37 まで存在。MVPは PDF 入手済みの8地区（No.01/15/32/33/34/35/36/37）のみ対応。地区選択画面に「上記以外は近日対応予定」を明記済（13）
- **品目辞書は公式さんあ〜る 589 品目が正本**（2026-05-20 全置換）。元データは `data/_sources/sanaru-bunbetsu.json`、変換中間ファイルは `items-converted.json`（いずれも gitignore）。複数区分品目は主区分を categoryId にし、部品別の捨て方は instruction に保持
- **カテゴリ ID は 11 値**: さんあ〜る全置換時に `plastic_product`（プラを資源(プラ)1本化）と `oversized`（公式は素材別分類）を削除。現 categoryId は `burnable`, `plastic_resource`, `landfill`, `hazardous`, `metal_resource`, `paper_resource`, `bottle_pet`, `home_appliances`, `pc`, `small_appliances`, `not_accepted`。定期収集パターンを持つのは `CollectionCategoryId` の 6 値だけ
- **全 9 JSON 本実装済み**: 01 データ整備で skeleton を解消。品目辞書のみ後にさんあ〜るへ全置換。`meta.json` version は 1.1.0

## Worker

- **デプロイ済み（2026-05-17、06 番）**: dev / prod URL は `docs/06_worker_deployment.md` 参照。KV ネームスペースは dev/prod 共有方針
- **Secret は env ごと独立**: `GEMINI_API_KEY` を更新するときは `--env development` と `--env production` の両方に `wrangler secret put` する（片方だけ更新すると不整合）
- **wrangler v3 系**: `kv:namespace create`（コロン）を使う。v4 にバージョンアップしたら `kv namespace create`（スペース）に変わる
- **`[env.X]` を定義したら `kv_namespaces` と `vars` は env 別に明示が必須**: top-level の `[[kv_namespaces]]` / `[vars]` は env を定義した瞬間にその env には**継承されない**（Cloudflare 公式仕様）。継承忘れだと `/healthz` は通るが `/api/identify` で `TypeError: Cannot read properties of undefined (reading 'get')` になる。Secret は env 別に登録するので自動継承の話とは別。06 番デプロイ直後にハマったポイント

## Expoアプリ

- **`reactCompiler` 有効**: `useMemo` / `useCallback` の手動最適化は基本不要。逆に React Compiler が嫌う書き方（条件分岐内のフック等）に注意
- **`npm install` 直は NG**: Expo SDK 54 と非互換バージョンが入りうる。**必ず `npx expo install`**（純粋 JS パッケージ、例: `date-fns` のみ例外）
- **`SafeAreaView` は `react-native-safe-area-context` から**: `react-native` 側は deprecated。詳細は `.claude/rules/expo-app.md` §SafeAreaView
- **`expo-notifications` の Expo Go 警告**: SDK 53+ から Expo Go では remote push が削除され、`import * as Notifications from 'expo-notifications'` で警告ログが出る（実害なし）。`lib/notifications.ts` の `requestPermission()` / `getPermissionStatus()` が `Constants.appOwnership === 'expo'` ガードで API 呼び出しをスキップする（許可済み扱いで通す）。本番ビルド（23 EAS）で警告は消える
- **通知の実動作確認は Dev Build / 本番ビルドで**: Expo Go では `scheduleNotificationAsync` を呼んでも警告のみで実通知は届かない。`lib/notifications.ts` の `getScheduledCount()` で何件登録されたかは確認可能。実動作確認は `npx expo run:android` で dev build をビルドするか、`eas build --profile development` を使う
- **`lib/storage.ts` 経由のみ**: AsyncStorage に直接 import せず、必ず `getCached` / `setCached` 経由

## ディレクトリ運用

- `lib/` / `types/` / `app/(onboarding)/` は実装時に作成（先回り作成しない方針は守られた）
- `components/` は現状ほぼ空。再利用コンポーネントが必要になった時に作成（例: CategoryBadge は 16 で）
