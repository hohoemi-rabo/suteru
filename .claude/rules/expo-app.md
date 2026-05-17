# Expoアプリ規約

ルート直下の Expo アプリ（`app/` / `components/` / `lib/` / `data/` など）に関する技術・規約・コマンドをまとめる。`worker/` の規約は [`worker.md`](./worker.md) を参照。

## 技術スタック（全て導入済み）

- Expo SDK 54 / React 19 / React Native 0.81
- Expo Router 6（typedRoutes / reactCompiler 有効、`app.json` 参照）
- TypeScript（strict、worker/ は tsconfig で除外）
- ESLint（`eslint-config-expo`）
- **NativeWind v4 + tailwindcss v3**（`tailwind.config.js` で brand/accent/warn/ink/cat カラー定義済み）
- `@react-native-async-storage/async-storage`（設定・データキャッシュ）
- `expo-camera` / `expo-location` / `expo-notifications`（権限文言は app.json 設定済み）
- `react-native-maps`（Google Maps、19/20 で使用予定）
- `react-native-safe-area-context`（**SafeAreaView は必ずこちらから import**）
- `date-fns` v4（収集日計算、`date-fns/locale/ja` で日本語フォーマット）
- `expo-secure-store` / `expo-crypto` / `expo-application`（09 API でデバイスIDハッシュに使用予定）
- `expo-haptics`（重要操作のフィードバック）
- React Navigation（bottom-tabs）/ expo-image / expo-symbols 等

依存追加時は `package.json` の Expo SDK バージョン（54）に対応するバージョンを `npx expo install` で入れる（`npm install` 直で入れない、純粋 JS パッケージのみ例外）。

## React Compiler（`app.json` で有効化済み）

- 手動の `useMemo` / `useCallback` は **書かない**。React Compiler が自動でメモ化する
- コンパイラが解析できない書き方は避ける: 条件分岐内のフック呼び出し、描画中の ref ミューテーション、など
- 不安定さに遭遇した場合は、`babel.config.js` の `babel-preset-expo` に `react-compiler.sources` を渡して対象ディレクトリを段階的に絞れる（緊急時のフォールバック手段）

## NativeWind v4

- `tailwind.config.js` の `theme.extend.colors` に **カスタムカラー** を定義済み（`brand`, `accent`, `warn`, `success`, `ink`, `bg`, `cat`）。色は文字列リテラルではなく Tailwind class で参照（`bg-brand-500`, `text-ink-900` 等）
- カテゴリ8色（実際は13値）の Tailwind キーは `cat.burnable`, `cat.plastic` 等。`data/common/categories.json` の `color` フィールドと同期している
- 詳細は `docs/03_design_system.md` の「決定事項」セクション参照
- `babel.config.js` で `jsxImportSource: 'nativewind'` を設定済み

## SafeAreaView の import 元（**重要**）

`react-native` の SafeAreaView は deprecated。**必ず `react-native-safe-area-context` から import** する:

```tsx
// ❌ NG (deprecation 警告が出る)
import { SafeAreaView } from 'react-native';

// ✅ OK
import { SafeAreaView } from 'react-native-safe-area-context';
```

`SafeAreaProvider` は Expo Router が自動でラップするので手動配線は不要。上部のみ inset が欲しい場合は `<SafeAreaView edges={['top']}>` のように指定（タブが下にあるので bottom は不要）。

## Expo Router 6 のレイアウト構成

- **入れ子ナビゲータでは外側で `screenOptions={{ headerShown: false }}` を指定**して二重ヘッダーを防ぐ。例:
  ```tsx
  // app/(tabs)/_layout.tsx
  <Tabs screenOptions={{ headerShown: false }}>
    <Tabs.Screen name="index" options={{ title: 'ホーム' }} />
    ...
  </Tabs>
  ```
- スタックを特定タブ配下に入れる場合は `app/(tabs)/<tab>/_layout.tsx` を作成し、**深いリンクの整合性のため `unstable_settings.initialRouteName = "index"` を必ず設定**:
  ```tsx
  export const unstable_settings = { initialRouteName: 'index' };
  export default function FeedLayout() { return <Stack />; }
  ```
- ルートグループ（`(onboarding)`, `(tabs)` 等の括弧付きディレクトリ）は URL に出ず、レイアウト分離だけに使う
- `typedRoutes` 有効のため、`<Link href="...">` は型チェックされる。動的ルートは `href={{ pathname: '/result', params: { id } }}` でパラメータ型も効く

## ストレージの使い分け

- **AsyncStorage**: 地区設定、通知 ON/OFF など **機密でない設定値**（平文保存）
- **`expo-secure-store`**: ハッシュ済みデバイスID、将来導入する可能性のあるトークンなど **暗号化が必要なもの**（iOS Keychain / Android Keystore 経由）
- MVP は認証なし・画像保存なしのため Secure 必須なものは少ないが、Worker 呼び出し時の `X-Device-Id` を生成する場合は SecureStore に保存して再利用する
- iOS で `expo-secure-store` を使う場合は `app.json` の plugins に `["expo-secure-store", { "faceIDPermission": "..." }]` を追加（生体認証連動時のみ）

## 環境変数

- クライアント側で参照する公開値（API URL 等）は **`EXPO_PUBLIC_*` プレフィックス必須**。`process.env.EXPO_PUBLIC_API_URL` で参照
  - ビルド時にバンドルに **平文で埋め込まれる**ため、APIキー等の機密値は絶対に入れない
- 機密値（Gemini APIキー等）はクライアントに置かず、Worker 側の Secret として管理する（このプロジェクトの基本設計）
- `.env` / `.env.local` などはプロジェクトルートに置き、Expo CLI が自動で読み込む

## EAS Build プロファイル設計（APK 配布開始時の指針）

`eas.json` にプロファイルを定義する想定（現状未セットアップ）:

| プロファイル | 用途 | distribution | 設定 |
|---|---|---|---|
| `development` | 開発ビルド | `internal` | デバッグビルド、開発 Worker を指す |
| `preview` | ほほ笑みラボ生徒テスト用 APK | `internal` | リリースビルド、開発 Worker |
| `production` | ストア配布用 | `store` | リリースビルド、本番 Worker |

各プロファイルの `env.EXPO_PUBLIC_API_URL` で、Worker の dev/prod を切り替える設計にする。

## lib/ の構成（既に確立）

- **`lib/data-loader.tsx`**: バンドル JSON ロード + リモート更新 + React Context。`useData()` で全 9 JSON にアクセス
- **`lib/storage.ts`**: 汎用 AsyncStorage ラッパー（`getCached<T>` / `setCached<T>` / `clearCached`）。React 依存なし、純粋関数
- **`lib/user-settings.tsx`**: UserSettings（地区/通知）の永続化 + React Context。`useUserSettings()` で `{settings, isHydrated, update, setAreaId, ...}` を取得
- **`lib/schedule-calculator.ts`**: 純粋関数。`getNextCollectionDate` / `getAllNextCollections` / `getNextNotificationTime` / `formatNextCollection`
- **`lib/area-detector.ts`**: 純粋関数。`detectArea(areas)` で「権限確認→GPS→最寄り判定」を一発で実行
- **`lib/notifications.ts`**: React 依存ゼロの async モジュール。`requestPermission` / `getPermissionStatus` / `rescheduleNotifications` / `cancelAllScheduled` / `configureNotificationHandler` / `getScheduledCount`。React 側からは `app/_layout.tsx` の `<NotificationsScheduler>` が settings / AppState 'active' で駆動
- **`lib/text-search.ts`**: 純粋関数。`normalizeJa`（ひらがな→カタカナ吸収）+ `searchItems(items, query, max)`（name 完全 1000 / 前方 800 / 部分 600 / aliases の同順でスコア）
- **`lib/api.ts`**: React 依存ゼロ。`identifyItem(base64, mimeType?)` で `/api/identify` を 10 秒タイムアウト・X-Device-Id ハッシュ付きで叩く。戻り値は判別ユニオン `IdentifyResult`（ok hit / ok null+reason / 失敗 errorCode+userMessage）。リトライなし

**ルール**:
- **AsyncStorage 直アクセス禁止** → 必ず `lib/storage.ts` の `getCached`/`setCached`/`clearCached` 経由
- **JSON データ取得は必ず `useData()` 経由**（または非React文脈なら `loadBundledData()`）
- **設定値の読み書きは必ず `useUserSettings()` 経由**
- **Worker 呼び出しは `identifyItem()` 経由のみ** — 各画面で fetch を直書きしない

## DevDiagnostics パターン

開発中の動作確認用 UI は `__DEV__` ガード下に書く:

```tsx
{__DEV__ && (
  <DevDiagnostics ... />
)}
```

Metro bundler が production build 時に dead code として除去するので、本番バンドルにコードが残らない。現状は `app/(tabs)/index.tsx` の末尾に `DevDiagnostics` 関数として診断パネル（データ確認、UserSettings 確認、GPS 判定、リセット）を集約。

## コーディング規約

### TypeScript全般

- 厳格モード（`strict: true`）
- 型定義は明示的に。`any` は原則禁止
- 関数の引数が3つ以上なら named parameters（`{ a, b, c }: Params`）を使う
- ファイル名は kebab-case（`schedule-calculator.ts`）、コンポーネントは PascalCase（`ItemCard.tsx`）
- 全 JSON / API / UserSettings の型は `types/index.ts` に集約

### Expoアプリ

- 状態管理は基本 React の useState / useReducer。Redux等は導入しない（MVPでは不要）
- インポートは `@/...` のパスエイリアスを使う（`tsconfig.json` で `"@/*": ["./*"]` を設定済み）
- 文字列リテラル（UI表示文言）は将来の多言語化を見越して、なるべく 1 箇所にまとめる

## よく使うコマンド（ルートで実行）

```bash
npm install
npm start                   # 開発サーバー（= expo start）
npm run android             # Androidエミュレータで起動
npm run ios                 # iOSシミュレータで起動
npm run web                 # Web版で起動
npm run lint                # ESLint（expo lint）
npm run reset-project       # 雛形にリセット（scripts/reset-project.js）
```

EAS Build（APK配布）は未セットアップ。導入時は `npx eas-cli init` → `eas.json` の作成から。
