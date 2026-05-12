# 03. デザインシステム（配色・タイポ・NativeWind）

> 関連: `REQUIREMENTS.md` §6.2（デザイントーン）, §11.2
> ステータス: 未着手

## 目的

「明るく親しみやすい」「シニア配慮（大きな文字・高コントラスト）」のデザインを、NativeWind の theme として一元定義する。各画面チケットはこの定義を参照する。

## 完了条件

- NativeWind が導入され、`tailwind.config.js` でアプリ固有の色・余白・文字サイズが定義済み
- カテゴリ8色が確定し、`data/common/categories.json` の `color` と一致
- ロゴ・アプリアイコンの素案がある

## Todo

### NativeWind 導入

- [ ] `npx expo install nativewind tailwindcss` で依存追加
- [ ] `tailwind.config.js` 作成
- [ ] `babel.config.js` に `nativewind/babel` プリセット追加
- [ ] `global.css` 作成と Expo Router の root layout で import
- [ ] `nativewind-env.d.ts` を生成（型サポート）
- [ ] 動作確認：適当なコンポーネントに `className="text-lg"` を当ててビルドが通る

### 配色パレットの確定

- [ ] アプリ全体のベースカラー（明るい緑 or 水色系）を決定
- [ ] カテゴリ8色を決定し、`categories.json` の `color` と紐付け（[[01_data_preparation]]）
- [ ] アクセント色（CTA・警告・成功）を決定
- [ ] ダーク／ライト両対応するかの方針確認（MVPはライトのみ可）
- [ ] `tailwind.config.js` の `theme.extend.colors` に登録

### タイポグラフィ

- [ ] 基本サイズを 16pt 以上で設計（シニア配慮）
- [ ] 結果画面の重要情報は 24pt 以上に
- [ ] 行間（leading）を読みやすく設定
- [ ] `tailwind.config.js` の `fontSize` カスタマイズ

### スペーシング・タップ領域

- [ ] ボタン最低 44×44pt を `min-h-11 min-w-11` で標準化
- [ ] カード・モーダルのパディング規約決定

### アイコン・ロゴ

- [ ] アプリ名の正式決定（仮称「これどう捨てる？」）
- [ ] ロゴ素案作成
- [ ] アプリアイコン素案作成（`assets/images/icon.png` 差し替え）
- [ ] カテゴリ用シンプルアイコンセット選定（expo-symbols / `@expo/vector-icons` で済むか確認）

### アクセシビリティ

- [ ] WCAG AA 基準のコントラスト比チェック（配色ペアごとに）
- [ ] `accessibilityLabel` 規約の方針決定

## 注意点

- NativeWind v4 系を使う場合 `metro.config.js` の調整が必要なケースあり。公式ドキュメントを確認
- カテゴリ色は `categories.json` がソース・オブ・トゥルース。Tailwind 側はそれを参照する形に
- React Compiler 有効環境なので、styled-components 系の動的スタイル生成は避ける
