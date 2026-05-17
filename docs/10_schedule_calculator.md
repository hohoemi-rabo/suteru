# 10. 収集日計算ロジック（lib/schedule-calculator.ts）

> 関連: `REQUIREMENTS.md` §5.4
> ステータス: 実装完了（テストランナーは未導入、ホーム診断カードで目視確認）

## 目的

`data/common/patterns.json` の `CollectionPattern` 定義から、任意の基準日に対して「次回収集日」を算出する純粋関数を提供する。結果画面・収集日画面・通知スケジュールで使う。

## 完了条件

- `getNextCollectionDate(pattern, from)` が正しい日付を返す（テスト網羅）
- weekly（毎週） / nth_day（第N曜日） 両パターンに対応
- カテゴリ別の次回日一括取得 API がある
- date-fns を使った実装で、タイムゾーンは Asia/Tokyo 固定

## Todo

### 基本実装

- [×] `lib/schedule-calculator.ts` 作成（純粋関数のみ、React なし）
- [×] [[05_type_definitions]] の `Pattern` / `CollectionPattern` / `WeekDay` を import
- [×] `getNextCollectionDate(pattern, from?: Date): Date` 関数
- [×] `findNextWeekday(from, days, includeToday)`: 指定の曜日のうち最も近い未来日を返す（内部ヘルパー）
- [×] `findNextNthWeekdayOfMonth(from, nth, day, includeToday)`: 第N曜日のうち最も近い未来日を返す（内部ヘルパー、最大12ヶ月探索）

### 一括取得API

- [×] `getAllNextCollections(pattern, categoryLabels, from?: Date): NextCollection[]` 実装
- [×] 日付昇順でソート
- [×] 「今日が収集日」のケースを `COLLECTION_CUTOFF_HOUR = 7` で動的判定

### 表示用ヘルパー

- [×] `formatNextCollection(date, from?)`: 「5月14日（木）」形式、`date-fns/locale/ja` 利用
- [×] 「今日」「明日」「明後日」の特別表示

### エッジケース

- [×] 月またぎ（最大12ヶ月探索でガード）
- [ ] 祝日・年末年始休止 ← **MVP 未対応**（公式 PDF に明確なルール記載なし。曜日ベース計算結果に「祝日は別途確認」と添える方針、18 のスコープ）
- [×] `from` が pattern の曜日と一致する場合 → 朝7時境界で当日 / 次回を分岐

### テスト

- [ ] 単体テスト（Jest等）← **MVP 未実施**。テストランナー未導入。動作確認はホーム診断カードでの目視。12 通知 / 18 Schedule 実装時にバグが出たら Jest 追加検討

### 通知スケジュールとの連携

- [×] `getNextNotificationTime(pattern, time, from)` 実装。「翌日0時基準で次回収集日を探索 → その前日 + 指定時刻」のロジックで「当日通知が間に合わない」問題を回避
- [×] `parseHHmm` で不正な時刻文字列を 20:00 にフォールバック

## 注意点

- **タイムゾーンは端末ローカル**（飯田市ユーザー = JST 想定）。Date.UTC / date-fns-tz は使わない
- 祝日の収集休止は **MVP 未対応**。曜日ベース計算のみ。UI 側で「祝日は別途確認」と添える
- 公開 API（`getNextCollectionDate` / `getAllNextCollections` / `getNextNotificationTime` / `formatNextCollection`）は **純粋関数**。同じ入力なら同じ出力で、React Compiler 環境でも安全に呼べる
- `COLLECTION_CATEGORIES` を export しているので、呼び出し側でカテゴリ列挙する際は import で同期できる
- `getNextNotificationTime` は **「当日収集日に当日夜通知では遅すぎる」問題** を回避するため、基準を翌日0時にずらして次回を探索する。これで「明朝7時の収集に対しては必ず前日夜の通知」になる
