# 14. ホーム画面

> 関連: `REQUIREMENTS.md` §6.1, §6.3
> ステータス: ✅ 実装完了（カメラボタン → /camera、検索バー → /search の配線も完了）

## 目的

アプリ起動後のメイン画面。大きなカメラボタンと検索バー、施設・収集日・設定への導線をシンプルに提示する。

## 完了条件

- カメラボタンが画面1/3を占める大きさ
- 上部に検索バー、下部に4タブ（ホーム/収集日/施設/設定）
- 右上に現在地区表示、タップで設定へ
- 起動時に [[07_data_loader]] が完了している

## Todo

### レイアウト

- [×] `app/(tabs)/_layout.tsx` でタブを4つに整理（04 と 13 で完了）
- [×] `app/(tabs)/index.tsx` を本実装（HomeHeader / SearchBarStub / CameraHeroButton / FooterLinks / DevDiagnostics）
- [×] タブアイコン・ラベル（日本語）の設定（13 で完了）
- [×] `screenOptions={{ headerShown: false }}` を tab _layout で指定

### 検索バー

- [×] 上部に検索バー風 Pressable（プレースホルダ「品目名で探す（例: ペットボトル）」）
- [ ] タップで [[17_manual_search_screen]] へ遷移 ← 現状は Alert、17 完成時に `router.push('/search')` へ置換

### 中央カメラボタン

- [×] 大型ボタン（画面幅 70% × aspect-square ≈ 画面1/3 要件を満たす）
- [×] カメラアイコン + 「写真でしらべる」テキスト
- [ ] 押下 → `/camera` へ push 遷移（[[15_camera_screen]]）← 現状は Alert、15 完成時に `router.push('/camera')` へ置換
- [×] expo-haptics でタップフィードバック（Medium impact）

### 現在地区表示

- [×] 右上に地区チップ表示（location アイコン + 地区名 + chevron）
- [×] タップで `/(tabs)/settings` の地区変更へ
- [×] 地区名が長い場合は 10 文字で省略表示（`truncate` ヘルパー）

### 補助コンテンツ

- [×] ベータ版バッジ（タイトル横）
- [×] 公式情報リンク（`meta.json.officialUrl` を Linking.openURL で開く）
- [×] 「次回の収集」をホームに表示するか → **MVP では表示しない**（18 収集日タブで見せる方針）

### データロード

- [×] [[07_data_loader]] からデータ取得（useData）
- [×] ローディング: バンドル即時返却のため待ちなし。ガード（13 完了）で hydration 完了まで待つ
- [×] [[08_storage_layer]] から地区ID取得（useUserSettings）
- [×] 地区未設定の場合は [[13_onboarding_screens]] にリダイレクト（13 の `(tabs)/_layout.tsx` ガードで処理）

### アクセシビリティ

- [×] カメラボタンに `accessibilityLabel`「写真で調べる」+ `accessibilityRole="button"`
- [×] 検索バーに `accessibilityLabel`「品目を文字で検索」+ `accessibilityRole="button"`
- [×] 地区チップに `accessibilityLabel`「現在の地区: ○○、タップで設定を開く」

### 開発時の補助

- [×] `__DEV__` ガード下に診断パネル（データローダー / UserSettings / 次回収集日 / GPS判定 / リセット）を残置。本番ビルドでは Metro が dead code として除去

## 注意点

- 中央カメラボタンを **目立たせる** のがアプリの体験の核（§6.3）
- React Compiler 有効なので、`useCallback` で props を memoize する必要なし
- タブの並びは「ホーム / 収集日 / 施設 / 設定」が要件指定
