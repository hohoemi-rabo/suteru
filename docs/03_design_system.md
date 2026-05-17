# 03. デザインシステム（配色・タイポ・NativeWind）

> 関連: `REQUIREMENTS.md` §6.2（デザイントーン）, §11.2
> ステータス: 叩き台確定（NativeWind導入は[[04_project_setup]]で実施）

## 目的

「明るく親しみやすい」「シニア配慮（大きな文字・高コントラスト）」のデザインを、NativeWind の theme として一元定義する。各画面チケットはこの定義を参照する。

## 完了条件

- NativeWind が導入され、`tailwind.config.js` でアプリ固有の色・余白・文字サイズが定義済み
- カテゴリ8色が確定し、`data/common/categories.json` の `color` と一致
- ロゴ・アプリアイコンの素案がある

## 決定事項（叩き台 v1）

実装着手にあたっての叩き台。`categories.json` 作成時（[[01_data_preparation]]）に最終確定する。

### 配色パレット

| 用途 | 色 | hex | Tailwindキー |
|---|---|---|---|
| ベース（緑） | 明るい緑（環境・エコ） | `#22C55E` | `brand.500` |
| ベース濃 | CTAボタン濃色 | `#16A34A` | `brand.600` |
| ベース薄 | 背景・カード | `#DCFCE7` | `brand.100` |
| アクセント | 水色（補助情報） | `#0EA5E9` | `accent.500` |
| 警告（赤） | 火災注意等の強調 | `#DC2626` | `warn.600` |
| 警告背景 | 警告カード背景 | `#FEE2E2` | `warn.100` |
| 成功 | 完了表示 | `#10B981` | `success.500` |
| テキスト主 | 本文 | `#1F2937` | `ink.900` |
| テキスト副 | 補助テキスト | `#6B7280` | `ink.500` |
| 区切り | ボーダー | `#E5E7EB` | `ink.200` |
| 背景 | 画面背景 | `#FFFFFF` | `bg.DEFAULT` |

### カテゴリ8色（仮）

`categories.json` の `color` フィールドと一致させる。`patterns.json` のキーと揃える:

| カテゴリ | 色名 | hex | Tailwindキー |
|---|---|---|---|
| `burnable`（燃やすごみ） | 赤 | `#E63946` | `cat.burnable` |
| `plastic_resource`（プラスチック資源） | 黄 | `#F59E0B` | `cat.plastic` |
| `landfill`（埋立ごみ） | グレー | `#6B7280` | `cat.landfill` |
| `hazardous`（有害ごみ） | オレンジ | `#EA580C` | `cat.hazardous` |
| `metal_resource`（金属類資源） | 青グレー | `#475569` | `cat.metal` |
| `paper_resource`（紙類資源） | 茶 | `#92400E` | `cat.paper` |
| `oversized`（大型ごみ・将来用） | 紫 | `#7C3AED` | `cat.oversized` |
| `special`（特別処分・将来用） | 紺 | `#1E3A8A` | `cat.special` |

### タイポグラフィ

- フォント: システムフォント（OS既定）。MVPはカスタムフォント読み込みなし
- サイズ基準（シニア配慮で底上げ）:

| 用途 | size | Tailwind |
|---|---|---|
| 本文 | 16pt | `text-base` |
| ラベル小 | 14pt | `text-sm` |
| 見出し | 20pt | `text-xl` |
| 結果画面の重要情報 | 24pt | `text-2xl` |
| 大型ボタン文言 | 18pt | `text-lg` |

- 行間: `leading-relaxed`（1.625）を本文標準に

### スペーシング・タップ領域

- ボタン最低: `min-h-11 min-w-11`（44pt 相当、iOS HIG準拠）
- カードのパディング: `p-4`（16pt）
- 画面端余白: `px-4`（16pt）
- セクション間: `gap-6`（24pt）

### ダーク/ライト

- MVP は **ライトモードのみ**。`app.json` の `userInterfaceStyle` を `"automatic"` から `"light"` に変更
- フェーズ2でダークモード追加検討

### アプリ名・ロゴ

- アプリ名: 仮称「これどう捨てる？」のまま継続（正式決定は別途、[[03_design_system]] §アイコン・ロゴ で）
- アイコン・スプラッシュ画像: テンプレートのまま継続。EAS Build前（[[23_eas_build]]）に差し替え

## Todo

### NativeWind 導入

- [×] `npx expo install nativewind tailwindcss` で依存追加
- [×] `tailwind.config.js` 作成
- [×] `babel.config.js` に `nativewind/babel` プリセット追加
- [×] `global.css` 作成と Expo Router の root layout で import
- [×] `nativewind-env.d.ts` を生成（型サポート）
- [×] 動作確認：適当なコンポーネントに `className="text-lg"` を当ててビルドが通る

### 配色パレットの確定

- [×] アプリ全体のベースカラー（明るい緑 or 水色系）を決定 → 明るい緑 `#22C55E` 系
- [×] カテゴリ8色を決定し、`categories.json` の `color` と紐付け（[[07_data_loader]] で 13エントリの `categories.json` を作成し、Tailwind と同期済み）
- [×] アクセント色（CTA・警告・成功）を決定
- [×] ダーク／ライト両対応するかの方針確認（MVPはライトのみ可）
- [×] `tailwind.config.js` の `theme.extend.colors` に登録

### タイポグラフィ

- [×] 基本サイズを 16pt 以上で設計（シニア配慮）
- [×] 結果画面の重要情報は 24pt 以上に
- [×] 行間（leading）を読みやすく設定 → `leading-relaxed`
- [ ] `tailwind.config.js` の `fontSize` カスタマイズ ← デフォルトサイズで運用可、必要時に追加

### スペーシング・タップ領域

- [×] ボタン最低 44×44pt を `min-h-11 min-w-11` で標準化
- [×] カード・モーダルのパディング規約決定 → カード `p-4`、画面端 `px-4`

### アイコン・ロゴ

- [ ] アプリ名の正式決定（仮称「これどう捨てる？」）
- [ ] ロゴ素案作成
- [ ] アプリアイコン素案作成（`assets/images/icon.png` 差し替え）
- [ ] カテゴリ用シンプルアイコンセット選定（expo-symbols / `@expo/vector-icons` で済むか確認） ← タブは Ionicons で運用中

### アクセシビリティ

- [ ] WCAG AA 基準のコントラスト比チェック（配色ペアごとに）
- [ ] `accessibilityLabel` 規約の方針決定

## 注意点

- NativeWind v4 系を使う場合 `metro.config.js` の調整が必要なケースあり。公式ドキュメントを確認
- カテゴリ色は `categories.json` がソース・オブ・トゥルース。Tailwind 側はそれを参照する形に
- React Compiler 有効環境なので、styled-components 系の動的スタイル生成は避ける
