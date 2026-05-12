# 13. オンボーディング画面（Welcome / AreaSelect）

> 関連: `REQUIREMENTS.md` §3.3（初回起動フロー）, §6.1
> ステータス: 未着手

## 目的

初回起動時の3画面フローを実装する: Welcome → AreaSelect → 通知許可。地区未設定の状態でホーム画面に到達させないことが重要。

## 完了条件

- 初回起動時、自動で Welcome 画面に遷移
- 地区を選択しないとホームに進めない
- 「上記以外のエリアは近日対応予定」が明記される
- 2回目以降の起動では Welcome がスキップされる

## Todo

### ルーティング

- [ ] `app/(onboarding)/_layout.tsx` 作成（Stack、headerShown: false）
- [ ] `app/(onboarding)/welcome.tsx` 作成
- [ ] `app/(onboarding)/area-select.tsx` 作成
- [ ] `app/_layout.tsx` で初回起動判定し、未設定なら `(onboarding)/welcome` にリダイレクト
- [ ] 完了後 `(tabs)` にリプレース遷移

### Welcome画面

- [ ] アプリ名・キャッチコピー表示
- [ ] イラスト or アイコン（[[03_design_system]] のロゴ使用）
- [ ] 「はじめる」ボタン → AreaSelect へ
- [ ] ベータ版表記

### AreaSelect画面

- [ ] 8地区のリスト表示（`data/areas/areas.json` から、[[07_data_loader]] 経由）
- [ ] 地区名・地区番号を表示（タップしやすいサイズ）
- [ ] **「上記以外のエリアは近日対応予定」を画面下部に明記**（§2.3）
- [ ] 選択 → `setAreaId()` で保存（[[08_storage_layer]]）
- [ ] 選択後、通知許可リクエストへ

### 通知許可フロー

- [ ] 地区選択後、[[12_notifications]] の `requestNotificationPermission()` を呼ぶ
- [ ] 許可/拒否どちらでもホームに進める
- [ ] 拒否時：設定画面から後で許可可能な旨を簡潔に案内

### 状態管理

- [ ] [[08_storage_layer]] の `isFirstLaunch()` で判定
- [ ] 完了マークの保存（地区IDが入っているかで判定可、別フラグ不要）

### デザイン

- [ ] [[03_design_system]] の配色・タイポを使用
- [ ] 大きなボタン（最低44pt）
- [ ] 進捗インジケータ（1/2, 2/2 など）

### エラー処理

- [ ] データ未ロード時のローディング表示
- [ ] 地区データロード失敗時のリトライ

## 注意点

- ルートグループ `(onboarding)` は URL に出ない、レイアウト分離のみ
- 進む時は `router.replace()` を使う（戻るで Welcome に戻れないように）
- 8地区以外のユーザーを **拒絶しない**。「近日対応」と明記しつつ、テストとしては選んでみてもらえる UX に
