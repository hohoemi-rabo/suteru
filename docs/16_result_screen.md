# 16. 結果画面（F1 / F2 共通）

> 関連: `REQUIREMENTS.md` §3.1, §6.3 Result画面
> ステータス: ✅ 完了（2026-05-17）

## 実装メモ

- `app/result.tsx` を新規作成。`useLocalSearchParams<{identifiedName, source}>()` で受け取り、`items.json` から `normalizeJa` 経由で再検索
- カメラ・検索の Bottom Sheet 暫定 UI は本チケットで全削除し、両者とも `router.push('/result', ...)` で遷移
  - `app/search.tsx` の `ItemDetailSheet` + `selectedItem` state は完全に削除
  - `app/camera.tsx` の `HitContent` は削除、`outcome.kind === 'hit'` 時のみ router.push（残り 3 outcome は Modal 継続）
- 13 カテゴリのうち定期収集 6 種 (`CollectionCategoryId`) は次回収集日を `formatNextCollection` で表示
- 残り 7 種（bottle_pet / oversized / home_appliances / pc / small_appliances / plastic_product / not_accepted）は `SPECIAL_HANDLING` ハードコードラベル + ヒント表示、19 番（Facilities）完成時にデータ駆動化
- 「現在地で確認」は定期収集カテゴリのみ表示、`detectArea` で取得した area で一時オーバーライド（永続化しない、画面ローカル state）
- 戻る: header back → `router.back()`、画面下部 CTA「ホームに戻る」→ `router.replace('/(tabs)')`

## 目的

判定された品目名（カメラ or 手動検索由来）を `items.json` から検索し、カテゴリ・指示・警告・次回収集日・施設リンクを表示する。

## 完了条件

- カメラ／手動検索どちらからの遷移にも対応
- 辞書ヒット時：カテゴリ・指示・警告・次回収集日が見やすく表示される
- 辞書ミス時：「辞書にありません」と手動検索への誘導
- 「現在地で確認」ボタンで地区切替して再表示できる

## Todo

### 基本実装

- [×] `app/result.tsx` 作成
- [×] パラメータ `identifiedName: string`、`source: 'camera' | 'search'`（source は受けるだけ、現状は分岐に未使用）
- [×] [[07_data_loader]] の items / categories / patterns を取得
- [×] `items.json` から `name` の `normalizeJa` 完全一致でマッチ（aliases は呼び出し側 17/15 で fuzzy 解決済み）

### ヒット時UI

- [×] 上部: 品目名（text-2xl bold）
- [×] カテゴリバッジ（`categories.json` の `color` を style 注入）
- [×] 指示文（text-base leading-relaxed）
- [×] 警告（warn-100 ボックス + ⚠ プレフィクス）
- [×] 次回収集日（`getNextCollectionDate` + `formatNextCollection`、定期収集カテゴリのみ）
- [ ] 関連施設リンク → 19 番完成時に SPECIAL_HANDLING をデータ駆動化して追加

### ミス時UI（NotInDictionary）

- [×] 「『◯◯』は辞書にありません」メッセージ
- [×] 識別された品目名を rawName で表示
- [×] 手動検索ボタン → `router.replace('/search')`
- [×] 市公式サイトへのリンク
- [×] ホームに戻るボタン

### 「現在地で確認」機能

- [×] ボタン押下で `detectArea()` を呼ぶ（定期収集カテゴリのみ表示）
- [×] 取得した地区で次回収集日を再計算（local state でオーバーライド）
- [×] 「現在地: ○○（一時的）」バナーで明示 + 解除ボタン
- [×] 「地区を変更（設定へ）」リンクを提供
- [×] 永続化しない（設定の地区は元のまま）

### 共通要素

- [×] ベータ版表示（Footer の disclaimer 経由）
- [×] 「飯田市公式サイトを開く」リンク（`meta.officialUrl`）
- [×] `meta.disclaimer` テキスト
- [×] 戻るボタン → `router.back()`、CTA「ホームに戻る」 → `router.replace('/(tabs)')`

### 検索ロジック

- [×] `normalizeJa` でカタカナ正規化してマッチ
- [×] 完全一致のみ（呼び出し側 17/15 で fuzzy 解決済みの name を渡す前提）
- [×] 複数ヒット問題は発生しない（exact match なので最大 1 件）

### 共有・追加アクション

- [×] 履歴・お気に入り・共有は MVP 対象外（§2.2 で確認）
- [ ] 「もう一度カメラ」CTA は省略（シニア配慮で選択肢を絞る、戻るボタンで足りる）
- [×] 「ホームに戻る」ボタン配置

## 注意点

- **AI のハルシネーション禁止**：「辞書にない」を「最も近いカテゴリ」で代用してはいけない（§2.4）
- カテゴリ色は `categories.json` がソース・オブ・トゥルース
- 警告（火災注意等）は **目立つ位置に**。シニアでも読めるサイズで
- 「現在地で確認」を押すと地区が一時切り替わるが、永続化はしない（設定画面の地区はそのまま）
