# 23. EAS Build / Google Play配布

> 関連: `CLAUDE.md` §EAS Build プロファイル設計, `REQUIREMENTS.md` §9 フェーズ1
> ステータス: **コード/設定 実装済み**（`eas.json`・法務文書 Pages 公開・Android 設定）。残りは**外部手順**（Expo ログイン/ビルド・GitHub Pages 有効化・Google Play）→ 下記「実装ランブック」参照

## 目的

EAS Build で開発・プレビュー・本番の3プロファイルを定義し、Google Play クローズドテスト → 公開までの配布パイプラインを構築する。

## 完了条件

- `eas.json` が完成し、3プロファイルで APK / AAB が出力できる
- Google Play クローズドテストで配布可能
- 各プロファイルが正しい Worker（dev/prod）を向く
- ほほ笑みラボの生徒に APK が配布できる

## Todo

### EAS 設定（コード側・実装済み）

- [×] `eas.json` を作成（手書き。`eas init` は projectId 追記のため別途要・ランブック参照）
- [×] `development`: dev client / internal / **dev Worker**（`buildType: apk`）
- [×] `preview`: 生徒テスト用 APK / internal / **dev Worker**（`autoIncrement` 有効）
- [×] `production`: ストア配布 / store / **本番 Worker**（`buildType: app-bundle`）
- [×] `appVersionSource: remote` で **versionCode 自動インクリメント**（EAS サーバ管理）
- [×] 各プロファイルの `env.EXPO_PUBLIC_API_URL` に dev/prod Worker URL を設定（[[06_worker_deployment]] で確定済み）
- [×] `babel-plugin-react-compiler` を明示依存化（reactCompiler experiment のクラウドビルド保険）

### Android 設定（実装済み）

- [×] `android.package` = `com.hohoemi.suteru`（確定・変更不可）
- [×] アプリアイコン・スプラッシュ（`assets/images/` にカスタムブランド済み）
- [×] アダプティブアイコン（前景・背景・**モノクロ**の3層、`app.json` 設定済み）
- [×] バージョンコード自動インクリメント（`eas.json` の `autoIncrement` + remote）

### 法務文書の公開（コード側・実装済み）

- [×] `docs/legal/*.md`（プライバシーポリシー / 利用規約）を HTML 化して GitHub Pages 公開する仕組み
  - `scripts/legal-site/build.mjs`（marked で md→HTML、`_site/` 出力）
  - `.github/workflows/deploy-legal-pages.yml`（Pages デプロイ）
  - 公開 URL: **`https://hohoemi-rabo.github.io/suteru/privacy-policy.html`** / `…/terms-of-use.html`
- [ ] GitHub の Pages 有効化（リポジトリ設定。ランブック参照）

### 初回ビルド（外部・ユーザー実施）

- [ ] `eas build --platform android --profile preview` で APK 生成
- [ ] 実機インストールで動作確認

### Google Play 申請（外部・ユーザー実施）

- [ ] Google Play Console アカウント開設（$25）
- [ ] アプリ作成・ストア掲載情報入力
- [ ] スクリーンショット（[[02_admin_pitch_materials]] と共通化可能）
- [ ] アプリ説明文
- [ ] プライバシーポリシーURL（上記 Pages URL を入力）
- [ ] データセーフティフォーム
- [ ] 年齢区分・ターゲット層
- [ ] アプリ署名鍵の管理（Play App Signing）

### 配布フロー（外部・ユーザー実施）

- [ ] クローズドテスト：ほほ笑みラボ生徒のメールアドレスを登録
- [ ] テスト用 Play URL を発行・配布
- [ ] フィードバック収集（[[24_user_testing]] と連動）

### CI/CD

- [×] PR ごとの `eas build` は MVP では回さない（手動ビルドで十分）
- [×] 法務 Pages のみ GitHub Actions で自動公開（`deploy-legal-pages.yml`）

## 実装ランブック（外部作業＝要・ユーザー実施）

コード/設定は実装済み。以下は Expo / GitHub / Google の認証・課金が要るためユーザーが実施する。

### A. EAS でビルド（Expo 認証が必要）

プロジェクト直下で:

```bash
npm install -g eas-cli         # or 各コマンドを npx eas-cli ... で
eas login                      # Expo アカウントでログイン（eas whoami で確認）
eas init                       # Expo プロジェクト作成/紐付け。app.json に extra.eas.projectId を自動追記
eas build --profile preview --platform android   # 生徒配布用 APK。初回は Keystore 生成「Yes」
```

- `eas init` が **app.json を編集**（`extra.eas.projectId` 追加）。これはコミットする。
- Keystore は EAS サーバ保管（Play App Signing 向き）。`*.jks` は gitignore 済。**紛失すると更新不可**なので `eas credentials` でバックアップ。
- 生成された APK の URL を生徒へ配布（クローズドテスト or `.apk` 直接）。
- 本番: `eas build --profile production --platform android`（AAB）→ `eas submit` or 手動アップロード。
- 無料枠（月30ビルド）想定。`resourceClass` は無指定＝medium（無料）。

### B. 法務文書を GitHub Pages で公開

1. リポジトリ **Settings → Pages → Source: "GitHub Actions"** を選択（1回だけ）。
2. `main` に push（`docs/legal/**` 変更時）または Actions から手動実行で `Deploy legal pages` が走る。
3. 公開先: `https://hohoemi-rabo.github.io/suteru/privacy-policy.html` を Google Play のプライバシーポリシー URL に入力。

> ⚠️ Pages の公開には **リポジトリが Public（または GitHub Pro）** であること。Play/利用者が見る公開 URL なので Public 前提。
> ⚠️ `lib/legal-documents.ts` を更新したら `docs/legal/*.md` も同期（その push で Pages 自動再生成）。

### C. ビルド前チェック（任意・推奨）

```bash
npx expo-doctor           # 依存整合・New Arch の検査
npx expo install --check  # SDK54 ピン確認
```

## 注意点

- EAS Build はクラウドビルドのため有料枠あり。無料枠（月30ビルド）を使う想定。`resourceClass` 無指定＝medium（無料）
- Android パッケージ名 `com.hohoemi.suteru` は **一度公開したら変えられない**（確定済み）
- アプリ署名鍵を紛失すると更新できなくなる。Play App Signing でクラウド管理推奨（`eas credentials` でバックアップ）
- 生徒テスト用APK は **自前配信もOK**（クローズドテスト経由 or `.apk` ファイル直接）
- **`react-native-maps` は依存にあるが未 import** のため現状 Maps API キー不要。将来 `MapView` を使い始めたら release ビルドに `android.config.googleMaps.apiKey` が必要
- **`EXPO_PUBLIC_API_URL` はビルド時にバンドルへインライン**される。プロファイルごとに固定（preview=dev / production=prod）。ビルド後の APK の向き先は変えられない＝プロファイルを変えて再ビルド。`.env.local` は **EAS Build では読まれない**（ローカル `expo start` 専用）
