# 20. リサイクルステーション画面

> 関連: `REQUIREMENTS.md` §2.1 F4, §5.1（recycle-stations.json）
> ステータス: ✅ 完了（2026-05-17）

## 目的

ペットボトル・ガラスびん等を持ち込めるリサイクルステーション（ア〜ク 8 グループ）を一覧表示する。**全グループ全市民が利用可能**な点を明示する。

## 完了条件（達成）

- ✅ 8 グループそれぞれの開催日・場所が見られる
- ✅ 「次回開催日」が分かりやすく表示される
- ✅ 各拠点の住所タップで外部 Google Maps が開く

## Todo

### 基本実装

- [×] `app/recycle-stations.tsx` 作成（タブ外、Facilities から push）
- [×] `lib/data-loader.tsx` の `useData()` から `recycle-stations.json` を取得
- [×] `types/index.ts` の `RecycleStationsData` / `RecycleStationGroup` 型を使用
- [×] `lib/recycle-station-utils.ts` を新規作成 — `dates` 配列から次回開催日を取り出す純粋関数（`getUpcomingStationDates` / `getNextDateForGroup` / `getNextStationCollection`）

### グループリスト

- [×] ア〜ク 8 グループのカード表示
- [×] 各カードに：ラベル（ア・イ…）、スケジュールパターン（「偶数月第1土曜」等）、次回日付、拠点数
- [×] 引取品目（ペットボトル・ガラスびん等）を InfoCard で表示

### 推奨グループ

- [ ] 最寄りグループ推定 — **MVP では未対応**。理由: 拠点 lat/lng が未付与のため正確な距離計算ができない。代替として「次回開催日順」でソートし「市内どこでも利用可」を InfoCard で強調

### 場所詳細

- [×] グループタップで展開 → 各拠点（locations）の一覧
- [×] 住所タップで Google Maps を開く（座標があれば座標、なければ住所文字列）
- [ ] 各拠点に座標があれば地図に表示 — MapView 未対応のため未

### 開催時間

- [×] `openTime`（「午前7時30分〜9時の間に持ち込んでください」）を InfoCard で表示
- [×] 全体の次回開催を NextOverallCard で強調表示（最寄りラベル + 日付）

### キャンセル情報

- [×] `cancellationRule` を InfoCard 内の警告枠で表示

## 注意点

- 8 グループ × 各 14〜16 箇所 = 119 拠点を展開時に表示。展開状態は `useState<Set<string>>` で管理し、デフォルトは折りたたみ
- 「全市民どこでも利用可」は §5.2 仕様通り、InfoCard で明示
- `dates: ["YYYY-MM-DD", ...]` 配列ベースなので、複雑な「偶数月／奇数月」パーサは不要。`getNextDateForGroup()` が配列をフィルタするだけ
- 年度内の開催が全て終了したグループは「今年度の開催は終了」と表示し、次回開催日順ソートで末尾に来る

## 後続作業（別チケット化推奨）

- 119 拠点の lat/lng 付与（01 で別チケット化済み）
- MapView 埋め込み
- 「最寄りグループ推定」機能（拠点 lat/lng 付与後に実装可能）
