# 04. プロジェクトセットアップ

> 関連: `CLAUDE.md` §技術スタック, `REQUIREMENTS.md` §9 フェーズ1
> ステータス: ほぼ完了（残: Androidエミュレータでの実機起動確認のみ）

## 目的

Expo テンプレートの雛形（タブナビゲーション + サンプル画面）を本プロジェクト用に整理し、MVP実装に必要な依存ライブラリを揃える。

## 完了条件

- ルート `README.md` がプロジェクト概要に置き換わっている
- MVP に必要な依存が全て `package.json` に入っている
- Expo テンプレートのサンプル画面（`app/(tabs)/explore.tsx` 等）が整理されている
- `npm start` から実機/エミュレータで起動できる

## Todo

### テンプレート整理

- [×] ルート `README.md` をプロジェクト概要に差し替え（現状 Expo テンプレートのまま）
- [×] `app/(tabs)/explore.tsx` を削除または本アプリ用に置き換え
- [×] `app/(tabs)/index.tsx` をホーム画面の雛形に置き換え（[[14_home_screen]] で本実装）
- [×] `app/modal.tsx` のテンプレートサンプルを削除
- [×] `components/hello-wave.tsx` / `parallax-scroll-view.tsx` 等の不要サンプルコンポーネント整理
- [×] `app/_layout.tsx` で `screenOptions={{ headerShown: false }}` を確認

### 依存ライブラリ追加

すべて `npx expo install` を使う（Expo SDK 54 互換バージョンを自動選定）。

- [×] `npx expo install nativewind tailwindcss`
- [×] `npx expo install @react-native-async-storage/async-storage`
- [×] `npx expo install expo-camera`
- [×] `npx expo install expo-location`
- [×] `npx expo install expo-notifications`
- [×] `npx expo install react-native-maps`
- [×] `npm install date-fns`
- [×] `npx expo install expo-secure-store`
- [×] `npx expo install expo-crypto`
- [×] `npx expo install expo-application`

### app.json プラグイン設定

- [×] `expo-camera` の plugins 設定（cameraPermission 文言）
- [×] `expo-location` の plugins 設定（locationWhenInUsePermission 文言）
- [×] `expo-notifications` の plugins 設定
- [×] Android パッケージ名・bundle identifier 確定（仮: `com.hohoemi.suteru`、EAS Build時に最終確認）

### 環境変数

- [×] `.env` の取り扱い方針を README に追加
- [×] `EXPO_PUBLIC_API_URL` のデフォルト値を `.env.example` に記載
- [ ] `process.env.EXPO_PUBLIC_API_URL` 参照箇所の整理（[[09_api_client]] 実装時に対応）

### ディレクトリ構造の整備（必要になってから）

- [ ] `lib/` を実際に lib コードを書く時に作成（先回り作成しない方針）
- [×] `types/` を [[05_type_definitions]] 着手時に作成
- [ ] `app/(onboarding)/` を [[13_onboarding_screens]] 着手時に作成

### 動作確認

- [ ] `npm start` でMetroが起動する ← ユーザー側で実機/エミュレータ確認推奨
- [ ] Android エミュレータで Hello World が表示される ← ユーザー側確認
- [×] `npm run lint` がエラーなく通る
- [×] `npx tsc --noEmit` がエラーなく通る（tsconfig で `worker/` を除外済み）

## 注意点

- 依存追加は **必ず `npx expo install`**。`npm install` 直は Expo SDK バージョン不整合の元
- `reactCompiler` 有効環境なので、入れたライブラリの一部で互換性問題が出る可能性あり。出た場合 `babel.config.js` の `react-compiler.sources` で範囲を絞る
- ディレクトリは先回りで空ファイルを作らず、実装時に作る方針（`CLAUDE.md` §プロジェクト構造参照）
