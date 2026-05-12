# 10. 収集日計算ロジック（lib/schedule-calculator.ts）

> 関連: `REQUIREMENTS.md` §5.4
> ステータス: 未着手

## 目的

`data/common/patterns.json` の `CollectionPattern` 定義から、任意の基準日に対して「次回収集日」を算出する純粋関数を提供する。結果画面・収集日画面・通知スケジュールで使う。

## 完了条件

- `getNextCollectionDate(pattern, from)` が正しい日付を返す（テスト網羅）
- weekly（毎週） / nth_day（第N曜日） 両パターンに対応
- カテゴリ別の次回日一括取得 API がある
- date-fns を使った実装で、タイムゾーンは Asia/Tokyo 固定

## Todo

### 基本実装

- [ ] `lib/schedule-calculator.ts` 作成
- [ ] [[05_type_definitions]] の `Pattern` / `CollectionPattern` / `WeekDay` を import
- [ ] `getNextCollectionDate(pattern, from?: Date): Date` 関数
- [ ] `findNextWeekday(from, days)`: 指定の曜日のうち最も近い未来日を返す
- [ ] `findNextNthWeekdayOfMonth(from, nth, day)`: 第N曜日のうち最も近い未来日を返す

### 一括取得API

- [ ] `getAllNextCollections(pattern: Pattern, from?: Date): NextCollection[]`
  - 全カテゴリ（burnable, plastic_resource, landfill, hazardous, metal_resource, paper_resource）について次回日を返す
- [ ] 日付昇順でソート
- [ ] 「今日が収集日」のケースを正しく扱う（朝7時前なら今日、それ以降なら次回）

### 表示用ヘルパー

- [ ] `formatNextCollection(date, locale='ja')`: 「次は5月14日（木）」形式
- [ ] 「明日」「明後日」の特別表示

### エッジケース

- [ ] 月またぎ（5月の第3木曜の次は6月の第1木曜）
- [ ] うるう年・年末年始（祝日考慮はMVPでは不要、要件未確定）
- [ ] `from` が pattern の曜日と一致する場合の挙動（午前7時前後で分岐？）

### テスト

- [ ] 単体テスト（Jest等）。固定日付 `2026-05-12 火` を `from` にした expected を書く
- [ ] 各 patternId × 各カテゴリ × 月またぎ・年またぎを網羅

### 通知スケジュールとの連携

- [ ] 次回収集日の **前日夜** の日時を返す `getNextNotificationTime(pattern, time, from)` を [[12_notifications]] に提供

## 注意点

- **タイムゾーンは Asia/Tokyo 固定**。Date.UTC は使わない、date-fns-tz は MVP では不要
- 祝日の収集休止は要件未確定。実装時は素直に曜日ベースで返し、後で祝日ルールを追加可能な設計に
- patterns.json の `type` literal が "weekly" / "nth_day" 以外のとき型エラーが出るよう network narrowing
