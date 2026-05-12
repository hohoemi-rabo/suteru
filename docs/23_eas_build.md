# 23. EAS Build / Google Play配布

> 関連: `CLAUDE.md` §EAS Build プロファイル設計, `REQUIREMENTS.md` §9 フェーズ1
> ステータス: 未着手

## 目的

EAS Build で開発・プレビュー・本番の3プロファイルを定義し、Google Play クローズドテスト → 公開までの配布パイプラインを構築する。

## 完了条件

- `eas.json` が完成し、3プロファイルで APK / AAB が出力できる
- Google Play クローズドテストで配布可能
- 各プロファイルが正しい Worker（dev/prod）を向く
- ほほ笑みラボの生徒に APK が配布できる

## Todo

### EAS 初期化

- [ ] `npx eas-cli init`（or `npm install -g eas-cli`）
- [ ] Expo アカウントへログイン
- [ ] `eas.json` 生成

### プロファイル設計

- [ ] `development`: 開発ビルド、internal、開発Worker
  ```json
  { "distribution": "internal", "env": { "EXPO_PUBLIC_API_URL": "https://...-development..." } }
  ```
- [ ] `preview`: 生徒テスト用APK、internal、開発Worker
- [ ] `production`: ストア配布、store、本番Worker

### Worker URL の埋め込み

- [ ] [[06_worker_deployment]] で dev/prod URL を確定
- [ ] 各プロファイルの `env.EXPO_PUBLIC_API_URL` に設定

### Android 設定

- [ ] `android.package` を確定（`com.hohoemi.suteru` 等）
- [ ] アプリアイコン・スプラッシュ確定（[[03_design_system]]）
- [ ] アダプティブアイコン（前景・背景・モノクロ）
- [ ] バージョンコード自動インクリメント設定

### 初回ビルド

- [ ] `eas build --platform android --profile preview` で APK 生成
- [ ] 実機インストールで動作確認

### Google Play 申請

- [ ] Google Play Console アカウント開設（$25）
- [ ] アプリ作成・ストア掲載情報入力
- [ ] スクリーンショット（[[02_admin_pitch_materials]] と共通化可能）
- [ ] アプリ説明文
- [ ] プライバシーポリシーURL（[[22_legal_documents]]）
- [ ] データセーフティフォーム
- [ ] 年齢区分・ターゲット層
- [ ] アプリ署名鍵の管理（Play App Signing）

### 配布フロー

- [ ] クローズドテスト：ほほ笑みラボ生徒のメールアドレスを登録
- [ ] テスト用 Play URL を発行・配布
- [ ] フィードバック収集（[[24_user_testing]] と連動）

### CI/CD

- [ ] GitHub Actions などで PR ごとに `eas build` を回すかは MVP では未検討
- [ ] 手動ビルドで十分

## 注意点

- EAS Build はクラウドビルドのため有料枠あり。無料枠（月30ビルド）を使う想定
- Android パッケージ名は **一度公開したら変えられない**。慎重に決定
- アプリ署名鍵を紛失すると更新できなくなる。Play App Signing でクラウド管理推奨
- 生徒テスト用APK は **自前配信もOK**（クローズドテスト経由 or `.apk` ファイル直接）
