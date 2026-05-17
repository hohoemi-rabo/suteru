# 注意点・ハマりどころ

プロジェクト固有のクセや、過去にハマったポイントの蓄積。実装中に気付いたものは随時追加する。

## データまわり

- **No.36地区（丹保・北条・飯沼南）の収集パターン**: OCR崩れがあり未確認。`data/areas/areas.json` で `patternId: "TBD_NEEDS_VERIFICATION"` のままになっている
- **地区数**: 飯田市全体では30〜40地区あるが、MVPは8地区のみ対応。地区選択画面に「上記以外は近日対応予定」を明記済（13）
- **収集パターンの呼び方**: 「燃やすごみ」と「燃やせるごみ」、地区によって表記揺れがあるかも。データのアプリ内表記は「燃やすごみ」で統一
- **カテゴリ ID は 13 値**: REQUIREMENTS.md §5.3 は「8カテゴリ」想定だったが、`items.json` の実 categoryId は 13 値（`burnable`, `plastic_resource`, `plastic_product`, `landfill`, `hazardous`, `metal_resource`, `paper_resource`, `bottle_pet`, `oversized`, `home_appliances`, `pc`, `small_appliances`, `not_accepted`）。`types/index.ts` の `CategoryId` も 13 値、`categories.json` も 13 エントリ。定期収集パターンを持つのは `CollectionCategoryId` の 6 値だけ
- **6 JSON が skeleton 状態**: `basic-rules.json` / `special-disposal.json` / `facilities.json` / `recycle-stations.json` は `_status: "skeleton"` の最小構造のみ。`meta.json` と `categories.json` と既存の 3 JSON（items/patterns/areas）は本実装済。01 データ整備で skeleton を埋める

## Worker

- **`worker/wrangler.toml` の KV id がプレースホルダ**: `PLACEHOLDER_KV_NAMESPACE_ID` のまま。デプロイ前に `wrangler kv:namespace create "RATE_LIMIT"` で作成して置換が必要

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
