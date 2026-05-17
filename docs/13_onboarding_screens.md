# 13. オンボーディング画面（Welcome / AreaSelect / Notifications）

> 関連: `REQUIREMENTS.md` §3.3（初回起動フロー）, §6.1
> ステータス: 実装完了（地区未設定なら自動でオンボーディングへリダイレクト、3画面で完結）

## 目的

初回起動時の3画面フローを実装する: Welcome → AreaSelect → 通知許可。地区未設定の状態でホーム画面に到達させないことが重要。

## 完了条件

- 初回起動時、自動で Welcome 画面に遷移
- 地区を選択しないとホームに進めない
- 「上記以外のエリアは近日対応予定」が明記される
- 2回目以降の起動では Welcome がスキップされる

## Todo

### ルーティング

- [×] `app/(onboarding)/_layout.tsx` 作成（Stack、headerShown: false、initialRouteName: welcome）
- [×] `app/(onboarding)/welcome.tsx` 作成
- [×] `app/(onboarding)/area-select.tsx` 作成
- [×] `app/(onboarding)/notifications.tsx` 作成（追加: 通知許可専用画面）
- [×] `app/(tabs)/_layout.tsx` でガード実装（`!isHydrated` → null、`!areaId` → `<Redirect href="/(onboarding)/welcome">`）
- [×] 完了後 `router.replace('/(tabs)')` でホームへ

### Welcome画面

- [×] アプリ名「これどう捨てる？」・キャッチコピー表示
- [×] 視覚要素: `Ionicons leaf` の丸アイコン（ロゴ完成までの暫定）
- [×] 「はじめる」ボタン（brand-500） → AreaSelect へ `router.push`
- [×] ベータ版バッジ（brand-100）

### AreaSelect画面

- [×] 8地区のリスト表示（`useData()` 経由）
- [×] 地区名・地区番号（No.X）を表示、ラジオ選択 UI
- [×] **「上記以外のエリアは近日対応予定」を画面下部に明記**（warn-100 背景）
- [×] 選択 → `setAreaId()` で保存（[[08_storage_layer]]）
- [×] 選択前は「次へ」ボタン disabled、選択後 → Notifications へ `router.replace`

### 通知許可フロー

- [×] 専用画面で「通知をON / 後で」を選択（OS ダイアログの前にソフトプロンプト）
- [×] ON: `Notifications.requestPermissionsAsync()` → 結果を `setNotificationsEnabled` に反映
- [×] 後で: `setNotificationsEnabled(false)` でスキップ
- [×] どちらでも `router.replace('/(tabs)')` でホームへ
- [×] 説明文に「後でいつでも設定から変更できます」明記
- 注: 12 通知サービスチケットで `lib/notifications.ts` 集約時に直接呼びを差し替える

### 状態管理

- [×] [[08_storage_layer]] の `useUserSettings()` の `isHydrated` / `areaId` で判定（`isFirstLaunch()` API より直接的）
- [×] 完了マークは別フラグ不要（areaId 設定 = オンボーディング完了）

### デザイン

- [×] [[03_design_system]] の配色（brand-500/600、warn-600、ink-200/500/900）使用
- [×] ボタン最低 44pt（`min-h-11`）
- [×] 進捗インジケータ: AreaSelect = `1 / 2`、Notifications = `2 / 2`

### エラー処理

- [×] `useData()` はバンドル即時返却のため、データ未ロードはほぼ発生しない
- [×] `isHydrated=false` の間は `(tabs)/_layout.tsx` で null 返却（オンボーディング画面は Provider が hydrate 済の前提で動作）
- [ ] 地区データロード失敗時のリトライ ← `useData()` がバンドルにフォールバックする設計のため不要と判断

### 追加機能

- [×] ホーム診断カードに **デバッグ用「設定をリセット」ボタン**を追加（`reset()` 呼び出し → ガードで自動的に Welcome へ）

## 注意点

- ルートグループ `(onboarding)` は URL に出ない、レイアウト分離のみ
- 進む時は `router.replace()` を使う（戻るで Welcome に戻れないように）
- 8地区以外のユーザーを **拒絶しない**。「近日対応」と明記しつつ、テストとしては選んでみてもらえる UX に
