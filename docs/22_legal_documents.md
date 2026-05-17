# 22. 法務文書（プライバシーポリシー・利用規約）

> 関連: `REQUIREMENTS.md` §7, §11.3
> ステータス: ✅ 完了（2026-05-17）

## 目的

Google Play 申請とユーザーへの説明責任のため、プライバシーポリシーと利用規約を作成する。

## 完了条件（達成）

- ✅ プライバシーポリシー文面が完成
- ✅ 利用規約文面が完成
- ✅ 設定タブから push 遷移で閲覧可能
- ✅ 各画面のディスクレイマー文言が決定済み（`meta.json.disclaimer` 参照）
- ⏳ Google Play 申請用の外部 URL 公開は 23 直前まで保留

## Todo

### プライバシーポリシー作成

- [×] §7.2 の5項目を網羅した文面
  - [×] 画像は判定にのみ使用、サーバー・ログに保存しない（PRIVACY_POLICY §2 撮影画像）
  - [×] 位置情報は施設地図・地区判定のみ、サーバー送信なし（§2 位置情報）
  - [×] ユーザー登録・認証なし（§6 利用者の権利で明記）
  - [×] アクセス解析の方針（§5 で「導入していない」と明記）
  - [×] 第三者提供なし（§3）
- [×] レート制限のための端末IDハッシュ化を明記（§2 端末識別子）
- [×] 連絡先（rabo.hohoemi@gmail.com）
- [×] 改定履歴・施行日（2026-05-17）

### 利用規約作成

- [×] 提供するサービス内容（TERMS_OF_USE §1）
- [×] **ベータ版である旨**を明示、データの正確性を保証しない（§2, §3）
- [×] 公式情報（飯田市公式ページ）への参照を促す（§3）
- [×] 免責事項（誤った分別による損害等）（§4）
- [×] 禁止事項（§5）
- [×] 改定の方針（§7）

### 引用許諾

- [ ] 飯田市公式情報を本アプリで参照する形になるため、**利用許諾の確認** — 02 行政アピール資料の打診と併せて実施予定
- [ ] 担当課への打診（[[02_admin_pitch_materials]] と併せて）

### アプリ内表示

- [×] [[21_settings_screen]] からリンク（push 遷移、`app/legal/privacy-policy.tsx` / `terms-of-use.tsx`）
- [×] 各画面（特に [[16_result_screen]]）のディスクレイマー文言を確定（`data.meta.disclaimer` を全画面のフッターで参照）
- [×] 「ベータ版」バッジを各画面に統一表示（result / recycle-stations / search に追加、ホーム / 収集日 / 施設 / 設定はもとから対応）

### 配信方針

- [ ] 公開先 URL（GitHub Pages / Notion / ほほ笑みラボサイト等）— 23 EAS Build 直前に決定
- [×] アプリ内表示は完了。外部 URL は `docs/legal/*.md` を用意済み、Google Play 申請時にこれを Pages 公開する

### Google Play 関連

- [ ] Google Play の「データセーフティ」フォーム回答準備 — 23 EAS Build 時に実施
- [ ] 画像・位置情報の取り扱いを正直に申告 — 同上

## 実装サマリ

| ファイル | 役割 |
|---|---|
| `lib/legal-documents.ts` | `LegalDocument` 型 + `PRIVACY_POLICY` / `TERMS_OF_USE` 定数（単一の真実の源） |
| `components/LegalDocumentScreen.tsx` | 共通レンダラ（戻る + ScrollView + 章 + 改定履歴 + mailto） |
| `app/legal/privacy-policy.tsx` | push route の薄いラッパー |
| `app/legal/terms-of-use.tsx` | 同上 |
| `docs/legal/privacy-policy.md` | Markdown ミラー（GitHub Pages 用） |
| `docs/legal/terms-of-use.md` | 同上 |
| `docs/legal/README.md` | ミラーの同期ルール説明 |

## 注意点 / 後続作業

- **弁護士・行政書士確認は未実施**。本格リリース前に MVP 雛形を確認してもらう。今回は ticket 注意書きの「MVPは雛形ベースで始めて段階的に」方針に従った
- **外部 URL 公開は 23 直前**。Google Play 申請には公開 URL が必要なので、`docs/legal/*.md` を GitHub Pages 等で公開する作業を 23 で実施
- **データセーフティフォーム**は 23 で記入
- **二重管理の解消**: `lib/legal-documents.ts` と `docs/legal/*.md` は現状手動で同期。将来的にビルドスクリプトで自動生成する余地あり
- **「ベータ版」「公式情報を参照」は §2.4 の設計原則そのもの**。手抜きせず PRIVACY_POLICY § 2/4、TERMS_OF_USE § 2/3 で明示
