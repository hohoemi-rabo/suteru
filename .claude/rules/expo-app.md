# Expoアプリ規約

ルート直下の Expo アプリ（`app/` / `components/` / `lib/` / `data/` など）に関する技術・規約・コマンドをまとめる。`worker/` の規約は [`worker.md`](./worker.md) を参照。

## 技術スタック

### 現在 `package.json` に導入済み

- Expo SDK 54 / React 19 / React Native 0.81
- Expo Router 6（typedRoutes / reactCompiler 有効、`app.json` 参照）
- TypeScript（strict）
- ESLint（`eslint-config-expo`）
- React Navigation（bottom-tabs）/ expo-image / expo-haptics / expo-symbols 等

### MVP実装で追加予定

`REQUIREMENTS.md` §9 に記載、まだ未導入:

- NativeWind（Tailwind CSS）
- `@react-native-async-storage/async-storage`（地区・通知設定の保存）
- expo-camera / expo-location / expo-notifications
- react-native-maps（Google Maps）
- date-fns（収集日計算）

依存追加時は `package.json` の Expo SDK バージョン（54）に対応するバージョンを `npx expo install` で入れる（`npm install` 直で入れない）。

## React Compiler（`app.json` で有効化済み）

- 手動の `useMemo` / `useCallback` は **書かない**。React Compiler が自動でメモ化する
- コンパイラが解析できない書き方は避ける: 条件分岐内のフック呼び出し、描画中の ref ミューテーション、など
- 不安定さに遭遇した場合は、`babel.config.js` の `babel-preset-expo` に `react-compiler.sources` を渡して対象ディレクトリを段階的に絞れる（緊急時のフォールバック手段）

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

## コーディング規約

### TypeScript全般

- 厳格モード（`strict: true`）
- 型定義は明示的に。`any` は原則禁止
- 関数の引数が3つ以上なら named parameters（`{ a, b, c }: Params`）を使う
- ファイル名は kebab-case（`schedule-calculator.ts`）、コンポーネントは PascalCase（`ItemCard.tsx`）

### Expoアプリ

- 状態管理は基本 React の useState / useReducer。Redux等は導入しない（MVPでは不要）
- AsyncStorageへのアクセスは必ず `lib/storage.ts` 経由（実装時に作成）
- API呼び出しは必ず `lib/api.ts` 経由（実装時に作成）
- インポートは `@/...` のパスエイリアスを使う（`tsconfig.json` で `"@/*": ["./*"]` を設定済み）
- 文字列リテラル（UI表示文言）は将来の多言語化を見越して、なるべく1箇所にまとめる

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
