# 「これどう捨てる？」(仮称) 要件定義書

> 飯田市のごみ分別を、カメラで撮るだけで教えてくれるAndroidアプリ
> **フェーズ1 (MVP) 要件定義書 v1.1**
> 最終更新: 2026-06-02

## 変更履歴

- **v1.2 (2026-06-02)**:
  - 対象地区を 8 → **10 地区**に拡張（No.09 / No.10 を追加、公式PDFから抽出）
  - §2.3 の地区リストを実装に合わせて修正（旧リストは初期構想で実装とずれていた）。実装は No.01/09/10/15/32-37
  - 「No.36まで」→「No.37まで」に修正
- **v1.1 (2026-05-12)**:
  - 8地区分のPDF精読を踏まえてデータ構造を見直し
  - 「収集パターン」を地区から分離（重複削減）
  - 飯田市の実際の地区数は約36地区ある事実を反映、MVPは8地区抽出方針に
  - 全市共通データと地区別データの整理
  - フェーズ0タスクを具体化
- **v1.0 (2026-05-12)**: 初版

---

## 1. プロジェクト概要

### 1.1 一行で言うと

カメラを向けるだけで、飯田市のルールに沿った「正しいごみの捨て方」を教えてくれるAndroidアプリ。

### 1.2 開発の動機

ほほ笑みラボでの教室運営を通じて、シニア層がごみ分別で困っている実態を目の当たりにしてきた。リニア開通を控え、飯田市には新住民・外国人住民が増えつつある。**「ゴミの捨て方が分からない」のはシニア固有の問題ではなく、市民全般の悩み**と捉え直し、誰にとっても使いやすいツールを目指す。

### 1.3 ターゲットユーザー

- **メイン**: 飯田市在住者全般（シニア・新住民・若年層問わず）
- **テストユーザー（フェーズ1）**: ほほ笑みラボの生徒さん約20名
- **アピール先**: 飯田市環境課（行政連携の足がかり）

### 1.4 提供価値

| 視点 | 価値 |
|---|---|
| ユーザー | 写真を撮るだけで答えが出る。PDF読まなくていい、市役所に電話しなくていい |
| 市役所 | 市民の問い合わせ業務軽減、ごみ分別の啓発効果 |
| 市民全体 | 不適切な分別による収集トラブル・火災事故の削減 |

### 1.5 競合との差別化

- **「さんあ〜る」（市公式アプリ）**: 検索前提のため、品目名が分からないと辿り着けない → 本アプリは **カメラで撮るだけ**
- **汎用AIに直接質問**: 自治体ローカルルールに対応できない、ハルシネーションリスク → 本アプリは **AIは品目特定までに限定し、回答はマスターデータから引く**

---

## 2. MVP（フェーズ1）スコープ

### 2.1 ✅ MVPに含める機能

| # | 機能 | 概要 |
|---|---|---|
| F1 | カメラ判定 | カメラ撮影 → Gemini Visionで品目特定 → マスターデータから飯田市ルールを表示 |
| F2 | 文字入力検索 | カメラが使えない時の保険。品目名・別名から辞書検索 |
| F3 | 次回収集日表示 | ユーザーの地区に応じた、各カテゴリの次回収集日を表示 |
| F4 | 施設・リサイクルステーション情報 | クリーンセンター、最終処分場、家電引取業者、リサイクルステーションの場所と連絡先 |
| F5 | 地区別ルール（ハイブリッド） | 初回起動時に地区選択（MVPは10地区）。「現在地で確認」ボタンでオンデマンドGPS切替 |
| F6 | 収集日前夜のリマインダー通知 | 「明日は燃やすごみの日です」等のローカルプッシュ通知 |

### 2.2 ❌ MVPに含めない機能（フェーズ2以降）

- iOS対応
- 多言語対応（英語・中国語・ベトナム語・ポルトガル語など）
- 音声読み上げ（TTS）
- 結果の履歴保存・お気に入り
- 「辞書にない」品目のユーザー報告機能
- 認証（Google OAuth等）
- 共有機能（家族への送信等）
- 近隣市町村対応

### 2.3 地区カバー範囲についての方針

飯田市のごみ収集地区は実際にはNo.37まで番号があり、**全市では推定30〜40地区** ある。MVPでは、以下の手順でカバーする：

1. **MVPフェーズ1（コンテスト・行政アピール用）**: 公式PDFを入手済みの **10地区に対応**（areas.json が正本）
   - No.01 大門町・桜町・大王路・小伝馬町1・錦町・東新町・諏訪町
   - No.09 本町・知久町・下殿町・上常磐町・下常磐町・箕瀬町
   - No.10 扇町・水の手町・南常磐町・愛宕町
   - No.15 座光寺
   - No.32 上黒田
   - No.33 下黒田北
   - No.34 下黒田南
   - No.35 下黒田東
   - No.36 丹保・北条・飯沼南
   - No.37 南条・別府上・別府下
2. 地区選択画面に **「上記以外のエリアは近日対応予定」** を明記
3. **行政アピール時の提案ポイント**: 「全市分のカレンダーデータを電子データでご提供いただけませんか」を交渉カードに

### 2.4 設計原則

1. **ハルシネーション・ゼロ**: AIが「最も近いカテゴリ」を推測する仕様は採用しない。辞書にない品目は **「辞書にない」と正直に表示** し、手動検索を促す
2. **プライバシー最優先**: 撮影画像は **サーバーに送信→判定後即破棄、一切保存しない**
3. **オフラインでも基本機能**: カメラ判定はネット必須だが、文字入力検索・ルール閲覧・施設情報はオフラインでも動く
4. **明るく、見やすく**: ターゲットを限定しないが、シニア配慮（大きな文字、高コントラスト、シンプルなボタン）を基本に、明るい配色で誰でも親しみやすく
5. **行政の信頼を得られる設計**: データソースの明示、ベータ表示、市公式へのリンクを必ず表示

---

## 3. ユーザー体験フロー

### 3.1 メインフロー（カメラ判定）

```
[ホーム画面]
      │
      ▼ 大きなカメラボタンをタップ
[カメラ画面]
      │
      ▼ ごみを写して撮影ボタンをタップ
[判定中ローディング]
      │
      ▼ Geminiで品目特定 + 辞書検索
      │
      ├─ ヒット → [結果画面: 「これは○○ですね」]
      │              ・カテゴリ（燃やすごみ、埋立ごみ等）
      │              ・指示文（「ひもで十字にしばって…」）
      │              ・警告（火災注意等）
      │              ・次回収集日（ユーザー地区に応じて計算）
      │              ・関連施設リンク
      │
      └─ ヒットしない → [結果画面: 「すみません、辞書にありません」]
                         ・手動検索を促すボタン
                         ・市公式サイトへのリンク
```

### 3.2 補助フロー

- **文字入力検索**: ホーム画面の検索バーから品目名で検索 → 結果画面へ
- **地区切替**: 結果画面で「現在地で確認」ボタン → GPS取得 → 最寄り地区を判定 → 該当地区のルールで再表示
- **施設情報**: ホーム画面のメニューから施設一覧 → 地図/連絡先表示
- **設定**: 地区変更、通知ON/OFF、データ更新確認

### 3.3 初回起動フロー

```
[ようこそ画面] → [地区選択画面（10地区）] → [通知許可ダイアログ] → [ホーム画面]
```

地区選択画面では、「上記以外のエリアは近日対応予定です」を明記する。

---

## 4. システム構成

### 4.1 アーキテクチャ図

```
┌─────────────────────────────────────┐
│         Androidアプリ (Expo)         │
│  ┌──────────────────────────────┐   │
│  │  画面: Home / Camera / Result / Search │
│  │       Schedule / Facilities / Settings │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  AsyncStorage: 地区設定, 通知設定 │
│  │  バンドルJSON + リモート最新版     │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
              │
              │ HTTPS (Bearer Token)
              ▼
┌─────────────────────────────────────┐
│   Cloudflare Workers (プロキシ)      │
│   ・APIキー保護                       │
│   ・レート制限（端末ID単位）            │
│   ・画像をGemini APIへ転送            │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│       Gemini Vision API              │
│   ・画像から品目名を返す               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   GitHub (raw) または Cloudflare R2  │
│   ・最新JSONデータの配信              │
│   ・version管理                      │
└─────────────────────────────────────┘
```

### 4.2 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Expo (React Native), TypeScript |
| スタイリング | NativeWind (Tailwind CSS) |
| ナビゲーション | Expo Router |
| カメラ | expo-camera |
| 位置情報 | expo-location（オンデマンドのみ） |
| 通知 | expo-notifications（ローカル通知のみ、プッシュサーバー不要） |
| ストレージ | @react-native-async-storage/async-storage |
| 地図 | react-native-maps（Google Maps） |
| プロキシAPI | Cloudflare Workers |
| AI | Gemini API (gemini-2.5-flash 推奨) |
| データ配信 | GitHub raw または Cloudflare R2 |
| 日付計算 | date-fns |
| ビルド・配布 | EAS Build → Google Playストア |

### 4.3 Cloudflare Workers API仕様

#### `POST /api/identify`

画像を受け取り、Gemini Visionで品目名を判定して返す。

**Request:**
```json
{
  "image": "base64-encoded-image"
}
```

**Response (成功):**
```json
{
  "success": true,
  "identifiedName": "ペットボトル"
}
```

**Response (判定不能):**
```json
{
  "success": true,
  "identifiedName": null,
  "reason": "could_not_identify"
}
```

**仕様:**
- 画像は判定後即破棄。ログにも保存しない
- レート制限: 端末ID単位で1分間に10回まで
- Gemini Promptはサーバー側で固定（プロンプトインジェクション対策）
- Geminiには「画像に写っているごみとして捨てられそうな物体の一般的な名前を、日本語で短く（3〜10文字程度）答えてください。判定できない場合は『不明』とだけ返してください」と指示
- 返ってきた品目名でアプリ側がitems.jsonを名前・別名から検索する

---

## 5. データ構造

### 5.1 ファイル構成

**重要な設計判断（v1.1）**: 「収集パターン」を地区から分離した。地区が増えても、パターンは数種類しかないため、データの重複を排除できる。

```
data/
├── common/                       ← 全地区共通（PDFの1ページ目に相当）
│   ├── meta.json                 # バージョン、最終更新日
│   ├── basic-rules.json          # 袋・証紙・サイズ・重さの全市共通ルール
│   ├── categories.json           # 8カテゴリ定義
│   ├── items.json                # 品目辞書
│   ├── special-disposal.json     # 家電リサイクル法、パソコン等の特別ルール
│   ├── facilities.json           # 持ち込み施設（クリーンセンター等）
│   ├── recycle-stations.json     # リサイクルステーション全データ（市内共通）
│   └── patterns.json             # 収集パターン定義（6種類程度）
│
└── areas/                        ← 地区別
    └── areas.json                # 地区一覧と各地区のpatternId参照
```

### 5.2 全市共通であるもの・地区別であるもの

PDFを精読して確定した整理（当初8地区→現在10地区、データ構造は共通）：

| 内容 | 共通／地区別 | 配置 |
|---|---|---|
| ごみ袋・証紙・サイズ・重さルール | 全市共通 | `common/basic-rules.json` |
| カテゴリ定義（燃やす・埋立など8種） | 全市共通 | `common/categories.json` |
| 品目辞書 | 全市共通 | `common/items.json` |
| 家電リサイクル法、特別処分 | 全市共通 | `common/special-disposal.json` |
| 持ち込み施設（クリーンセンター等） | 全市共通 | `common/facilities.json` |
| リサイクルステーション開催日・場所 | 全市共通（市内どこでも利用可） | `common/recycle-stations.json` |
| **ごみ収集の曜日パターン** | **地区により異なる** | `common/patterns.json` + `areas/areas.json` |

### 5.3 主要な型定義（TypeScript）

```typescript
// common/meta.json
type Meta = {
  version: string;          // "1.0.0"
  lastUpdated: string;      // "2026-05-12"
  dataSource: string;       // "飯田市ごみ収集カレンダー令和8年度"
  disclaimer: string;
  officialUrl: string;
};

// common/basic-rules.json
type BasicRules = {
  collectionTime: string;       // "収集日の当日午前7時まで"
  location: string;             // "お住まいの最寄りの集積所のみ利用可"
  bagRules: {
    designated: string;
    limitPerCollection: string; // "1回の収集に出せるごみは種類ごと3つまで"
    weightLimit: string;        // "10kgまで"
    oversizeRule: string;       // "1m×1m×30cm以内なら集積所へ"
  };
  stampRules: {
    burnable: string;           // "120円分の収入証紙シール"
    landfill: string;
    metalResource: string;      // "証紙不要"
  };
  salesPoints: string;
};

// common/categories.json
type Category = {
  id: string;                   // "burnable"
  name: string;                 // "燃やすごみ"
  color: string;                // "#E63946"
  icon: string;
  bagType: string;
  stampRequired: boolean;
  description: string;
  notes: string[];
  outOfScope?: string[];
};

// common/items.json
type Item = {
  name: string;                 // "ペットボトル"
  aliases: string[];            // ["PETボトル", "プラボトル"]
  categoryId: string;
  instruction: string;
  warnings: string[];
};

// common/patterns.json
type Pattern = {
  description: string;
  burnable: CollectionPattern;
  plasticResource: CollectionPattern;
  landfill: CollectionPattern;
  hazardous: CollectionPattern;
  metalResource: CollectionPattern;
  paperResource: CollectionPattern;
};

type CollectionPattern =
  | { type: "weekly"; days: WeekDay[] }
  | { type: "nth_day"; nth: number[]; day: WeekDay };

type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

// areas/areas.json
type Area = {
  id: string;                   // "area_01"
  no: number;                   // 1
  name: string;                 // "大門町・桜町・..."
  patternId: string;            // patterns.jsonのキー
  representativePoint: { lat: number; lng: number };
};

// common/facilities.json
type Facility = {
  id: string;
  name: string;
  purpose: string;
  address: string;
  lat?: number;
  lng?: number;
  phone: string;
  fee?: string;
  openDays?: string;
  openHours?: string;
};

// common/recycle-stations.json
type RecycleStationsData = {
  description: string;          // "市内どこのステーションも利用可"
  openTime: string;             // "午前7時30分〜9時"
  items: string[];              // ["ペットボトル", "ガラスびん"]
  cancellationRule: string;
  groups: RecycleStationGroup[];
};

type RecycleStationGroup = {
  id: string;                   // "group_a" 〜 "group_h" (ア〜ク)
  label: string;                // "ア" "イ" ...
  schedulePattern: string;      // "偶数月第1土曜" 等
  dates: string[];              // ["2026-04-04", ...]
  locations: RecycleStationLocation[];
};

type RecycleStationLocation = {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
};
```

### 5.4 次回収集日の計算ロジック

```typescript
function getNextCollectionDate(
  pattern: CollectionPattern,
  from: Date = new Date()
): Date {
  if (pattern.type === "weekly") {
    return findNextWeekday(from, pattern.days);
  }
  return findNextNthWeekdayOfMonth(from, pattern.nth, pattern.day);
}

// 使用例
const area = areas.find(a => a.id === userArea);
const pattern = patterns[area.patternId];
const nextBurnableDate = getNextCollectionDate(pattern.burnable);
// → "2026-05-14"（次の木曜日など）
```

この関数で「次回収集日表示」と「前夜のプッシュ通知スケジュール登録」の両方をまかなえる。

### 5.5 データ更新の流れ

1. JSONファイルをGitHubリポジトリ（または Cloudflare R2）に配置
2. アプリ起動時、`meta.json`をフェッチして`version`を確認
3. AsyncStorage内のバージョンより新しければ、全JSONをダウンロードして上書き保存
4. 失敗時はバンドル版をフォールバック使用
5. 設定画面に「データ更新を確認」ボタンを置き、手動更新も可能

---

## 6. 画面設計

### 6.1 画面一覧

| 画面 | 用途 |
|---|---|
| Welcome（初回のみ） | アプリ説明、利用開始ボタン |
| AreaSelect（初回のみ） | 10地区から自分の地区を選ぶ。「他のエリアは近日対応予定」を明記 |
| Home | カメラボタン（大）、検索バー、メニュー |
| Camera | カメラビュー、撮影ボタン |
| Result | 判定結果、カテゴリ、指示、警告、収集日、施設リンク |
| ManualSearch | 文字入力での品目検索 |
| Schedule | 自地区の収集日カレンダー |
| Facilities | 施設一覧（リスト＋地図） |
| RecycleStations | リサイクルステーション一覧（自分の地区に近いア〜クグループ） |
| Settings | 地区変更、通知ON/OFF、データ更新、利用規約、プライバシー |

### 6.2 デザイントーン

- **配色**: 明るく親しみやすい色（緑・水色・黄色など、エコと清潔感を連想させる）。彩度高めで活気あるトーン
- **タイポグラフィ**: 大きく読みやすいフォント（最低16pt、結果画面の重要情報は24pt以上）
- **コントラスト**: WCAG AA基準を満たす
- **ボタン**: 最低44×44pt（タップしやすさ）
- **アニメーション**: 控えめに。判定中のローディングは安心感のあるアニメ
- **イラスト**: ごみ袋やリサイクルマークなど、シンプルで明るいアイコン

### 6.3 重要な画面の詳細

#### Home画面
- 中央にカメラボタン（画面の1/3を占めるくらい大きく）
- 上部に検索バー（プレースホルダー: 「品目名で探す（例: ペットボトル）」）
- 下部に4タブ: ホーム / 収集日 / 施設 / 設定
- 右上に「現在の地区: ○○」表示（タップで設定画面へ）

#### Result画面
- 上部: 判定された品目名（大きく）
- カテゴリバッジ（カテゴリの色で）
- 指示文（読みやすく整形）
- 警告（あれば赤背景で強調）
- 次回収集日（「次は○月○日（○）」）
- 関連施設へのリンク
- 「現在地で確認する」ボタン（地区切替用）
- ベータ表示・市公式へのリンク

---

## 7. プライバシー・セキュリティ

### 7.1 個人情報の取り扱い方針

| データ | 扱い |
|---|---|
| 撮影画像 | サーバー送信 → Geminiに渡す → **判定後即破棄。ログにも保存しない** |
| 位置情報 | **オンデマンド取得のみ（GPS常時監視なし）**。サーバーには送らない、端末内で地区判定のみ |
| 地区設定 | 端末のAsyncStorageのみ |
| 通知設定 | 端末のAsyncStorageのみ |
| 端末ID | レート制限のためにハッシュ化して使用、個人特定不可 |

### 7.2 プライバシーポリシーに明記すべき内容

1. 画像は判定にのみ使用し、サーバー・ログに保存しない
2. 位置情報は施設地図・地区判定にのみ使用し、サーバーに送信しない
3. ユーザー登録・認証は一切ない
4. アクセス解析（Google Analytics等）は最小限、または導入しない
5. データの第三者提供はない

### 7.3 セキュリティ

- Gemini APIキーは絶対にアプリに含めない。Cloudflare Workersでのみ保持
- Cloudflare Workersへのリクエストはレート制限あり
- HTTPSのみ
- 起動時のJSON更新もHTTPSで

---

## 8. データ運用方針

### 8.1 データの品質管理

- **現状**: 10地区のPDFを精読しパターン化済み（PDF原本と照合済み）
- **公開前にやること**:
  - まさゆきさんが手元の10地区PDFと照らし合わせて最終確認
  - `items.json` の主要品目を50〜100個に拡充
  - 地区の代表座標（`representativePoint`）の正確化
- **公開後**:
  - アプリ内に必ず「ベータ版」表示
  - 市公式サイトへのリンクを各画面に配置
  - 「最新情報はお住まいの地区の案内をご確認ください」のディスクレイマー
  - 地区選択画面に「上記以外のエリアは近日対応予定」を明記

### 8.2 データ更新の運用フロー

```
[まさゆきさん]
  ・JSONファイルを修正
  ・meta.jsonのversionをbump
  ・GitHubにpush（または R2にアップロード）
        │
        ▼
[ユーザーのアプリ]
  ・次回起動時にmeta.jsonをフェッチ
  ・新バージョンを検知したら全JSONをダウンロード
  ・AsyncStorageに保存
```

将来、市の担当者が直接編集できるようにしたい場合は、フェーズ3でSupabase + 管理画面を導入する。

---

## 9. 開発ロードマップ

### フェーズ0: ナレッジ整備（先行作業）

#### 進捗（2026-05-12時点）

- [x] 全市共通ルールの構造化（`basic-rules.json` 草稿）
- [x] 8カテゴリの定義（`categories.json` 草稿）
- [x] 8地区分の収集パターン抽出（`patterns.json` 草稿、6種類のパターン）
- [x] 8地区の `areas.json` 草稿
- [x] リサイクルステーションのア〜ク 8グループ、スケジュールの構造（部分的）
- [x] 持ち込み施設の構造化（`facilities.json` 草稿）
- [x] 家電・パソコン等の特別処分ルール（`special-disposal.json` 草稿）

#### これからやること

- [ ] **No.36（丹保・北条・飯沼南）のパターン確認**（OCR崩れ箇所）
- [ ] **`items.json` を主要50〜100品目に拡充**（PDFの1ページ目から精読）
- [ ] **リサイクルステーション全データの構造化**（ア〜ク × 各14〜16箇所）
- [ ] **10地区の代表座標の正確化**（実機GPS検証・微調整。No.09/10 は中心市街地で近接）
- [ ] **手動校正**（特にプラ資源とプラ製品の区分など）

### フェーズ1: MVP開発（コンテスト・行政アピール用）

- [ ] Expoプロジェクト初期化、NativeWind導入
- [ ] Cloudflare Workersプロキシ実装
- [ ] 画面実装（Welcome, AreaSelect, Home, Camera, Result, ManualSearch, Schedule, Facilities, RecycleStations, Settings）
- [ ] AsyncStorageで地区・通知設定を保存
- [ ] バンドルJSON + リモート最新版取得
- [ ] 次回収集日計算ロジック（patterns.jsonから動的に算出）
- [ ] expo-notificationsで前夜リマインダー実装
- [ ] expo-locationでオンデマンドGPS地区切替実装
- [ ] EAS Build → Google Playストア（クローズドテスト→公開）
- [ ] ほほ笑みラボ生徒数名でのテスト
- [ ] 行政アピール資料作成

### フェーズ2: 実用版

- 多言語対応（英語、中国語、ベトナム語、ポルトガル語）
- 音声読み上げ
- 「辞書にない」報告機能
- 履歴・お気に入り
- iOS対応
- **市内の残り地区への対応拡張**

### フェーズ3: 展開

- 近隣自治体への横展開（下伊那郡、伊那市、駒ヶ根市）
- Supabase導入（自治体データ管理）
- 自治体連携、自治体向けSaaS化検討
- 行政の管理画面（市の担当者が直接編集できる）

---

## 10. 行政アピールの準備事項

### 10.1 アピールポイント

1. **市民の困りごとを直接解決**: ほほ笑みラボの現場経験に基づく
2. **市役所の問い合わせ業務軽減**: 分別の問い合わせを減らす効果
3. **市民広報の補助ツール**: PDFを読まなくても情報が届く
4. **プライバシー配慮**: 画像保存なし、認証なし、市民が安心して使える
5. **実現可能性**: すでに動くプロトタイプがある
6. **共同メンテナンス提案**: データの正確性は市と共同で詰めたい
7. **横展開の絵**: 飯田 → 南信州 → 長野県 → 全国

### 10.2 交渉ポイント（v1.1で追加）

8地区PDFの精読で、データ整備の運用コストが見えてきた。市役所への打診時は以下を **具体的な依頼** として整理して持参すると効果的：

- **全市分のごみ収集カレンダーを電子データ（CSV/Excel）でご提供いただけませんか**（現在は紙PDFのみ、地区ごとに手動入力する負担を軽減）
- **データ更新時の連絡フロー**（更新があった時に通知をいただける運用にできるか）
- **本アプリで参照させていただきたい公式情報**（公式リンク先の許可）
- **将来的な共同メンテナンスの可能性**（フェーズ3で市側が直接編集できる管理画面を作る）

### 10.3 提供できる資料

- 動作デモ動画（30秒〜1分）
- スクリーンショット
- 利用シーンの説明（シニア宅・新住民・外国人住民）
- データ構造の説明（市側がメンテナンスに参加しやすい設計）

---

## 11. 未確定事項・TODO

### 11.1 データ関連

- [ ] **No.36の収集パターン確認**（OCR崩れ、特に埋立等の曜日）
- [ ] **`items.json` の品目拡充**（50〜100品目）
- [ ] **プラ資源とプラ製品の区分の確証**（PDFのOCR崩れで自信なし）
- [ ] **リサイクルステーション全データの構造化**（ア〜ク全グループ）
- [ ] **施設・リサイクルステーションの正確な緯度経度**
- [ ] **10地区の代表座標**（最近傍判定用）

### 11.2 デザイン関連

- [ ] アプリ名の正式決定（仮称「これどう捨てる？」）
- [ ] ロゴ・アイコンデザイン
- [ ] 配色パレットの確定

### 11.3 法務・規約関連

- [ ] プライバシーポリシー文面の作成
- [ ] 利用規約の作成
- [ ] 市の公式情報を引用する形になるため、利用許諾の確認

### 11.4 技術関連

- [ ] Geminiモデルの選定（gemini-2.5-flash か gemini-2.0-flash か）
- [ ] レート制限の具体的な値（10回/分でいいか）
- [ ] エラーハンドリング詳細（ネット切断時、Gemini APIエラー時など）
- [ ] 通知の時刻（前夜何時か？例: 20:00）

---

## 12. 付録: コンポーネント設計の指針

Claude Codeでの実装時の参考に、想定されるディレクトリ構成。

```
src/
├── app/                          # Expo Router
│   ├── (onboarding)/
│   │   ├── welcome.tsx
│   │   └── area-select.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home
│   │   ├── schedule.tsx
│   │   ├── facilities.tsx
│   │   └── settings.tsx
│   ├── camera.tsx
│   ├── result.tsx
│   ├── search.tsx
│   ├── recycle-stations.tsx
│   └── _layout.tsx
├── components/
│   ├── ui/                       # 汎用パーツ
│   ├── CategoryBadge.tsx
│   ├── ItemCard.tsx
│   ├── ScheduleCard.tsx
│   └── ...
├── lib/
│   ├── storage.ts                # AsyncStorageラッパー
│   ├── api.ts                    # Cloudflare Workers呼び出し
│   ├── data-loader.ts            # JSON取得・更新（バンドル＋リモート）
│   ├── area-detector.ts          # GPSから地区判定（最近傍）
│   ├── schedule-calculator.ts    # 次回収集日計算（patterns.jsonベース）
│   └── notifications.ts          # 通知スケジュール登録
├── data/                         # バンドルJSON
│   ├── common/
│   │   ├── meta.json
│   │   ├── basic-rules.json
│   │   ├── categories.json
│   │   ├── items.json
│   │   ├── special-disposal.json
│   │   ├── facilities.json
│   │   ├── recycle-stations.json
│   │   └── patterns.json
│   └── areas/
│       └── areas.json
└── types/
    └── index.ts                  # 型定義
```

---

**この要件定義書は、Claude Codeでのバイブコーディングの出発点です。**
**実装中に詰めるべき細部・変更点があれば、本ドキュメントをv1.2、v1.3と更新していきます。**
