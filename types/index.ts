/**
 * 「これどう捨てる？」アプリ共通型定義
 *
 * ソース・オブ・トゥルース: REQUIREMENTS.md §5.3 + data/ 配下の実JSON
 * JSON 構造を変えたときは、ここの型も同時に更新する。
 */

// ============================================================
// 共通: 曜日・カテゴリID
// ============================================================

export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/**
 * 全カテゴリID。items.json の categoryId と一致（11 値）。
 * 公式さんあ〜るへの全置換に伴い plastic_product / oversized を削除。
 * patternsId（収集パターンに紐づくもの）と非収集カテゴリの両方を含む。
 */
export type CategoryId =
  | 'burnable'
  | 'plastic_resource'
  | 'landfill'
  | 'hazardous'
  | 'metal_resource'
  | 'paper_resource'
  | 'bottle_pet'
  | 'home_appliances'
  | 'pc'
  | 'small_appliances'
  | 'not_accepted';

/**
 * 定期収集パターンを持つカテゴリ。patterns.json の各パターン内のキーと一致。
 * Schedule 計算（lib/schedule-calculator.ts）で使う。
 */
export type CollectionCategoryId =
  | 'burnable'
  | 'plastic_resource'
  | 'landfill'
  | 'hazardous'
  | 'metal_resource'
  | 'paper_resource';

// ============================================================
// data/common/meta.json
// ============================================================

export interface Meta {
  version: string;
  lastUpdated: string;
  dataSource: string;
  disclaimer: string;
  officialUrl: string;
}

// ============================================================
// data/common/basic-rules.json
// ============================================================

export interface BasicRules {
  collectionTime: string;
  location: string;
  bagRules: {
    designated: string;
    limitPerCollection: string;
    weightLimit: string;
    oversizeRule: string;
  };
  stampRules: {
    burnable: string;
    landfill: string;
    metalResource: string;
  };
  salesPoints: string;
}

// ============================================================
// data/common/categories.json
// ============================================================

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
  icon: string;
  bagType: string;
  stampRequired: boolean;
  description: string;
  notes: string[];
  outOfScope?: string[];
}

export interface CategoriesData {
  version: string;
  lastUpdated: string;
  categories: Category[];
}

// ============================================================
// data/common/items.json
// ============================================================

export interface Item {
  name: string;
  aliases: string[];
  categoryId: CategoryId;
  instruction: string;
  warnings: string[];
}

export interface ItemsData {
  version: string;
  lastUpdated: string;
  sourceDocument: string;
  items: Item[];
}

// ============================================================
// data/common/patterns.json
// ============================================================

export type CollectionPattern =
  | { type: 'weekly'; days: WeekDay[] }
  | { type: 'nth_day'; nth: number[]; day: WeekDay };

/**
 * 1つの収集パターン定義。地区がこのいずれかを参照する。
 */
export interface Pattern {
  description: string;
  burnable: CollectionPattern;
  plastic_resource: CollectionPattern;
  landfill: CollectionPattern;
  hazardous: CollectionPattern;
  metal_resource: CollectionPattern;
  paper_resource: CollectionPattern;
}

export interface PatternsData {
  version: string;
  lastUpdated: string;
  sourceDocument: string;
  patterns: Record<string, Pattern>;
  notes?: string[];
}

// ============================================================
// data/areas/areas.json
// ============================================================

export interface Area {
  id: string;
  no: number;
  name: string;
  /** patterns.json の patterns キー、または特別値（例: "TBD_NEEDS_VERIFICATION"） */
  patternId: string;
  representativePoint: { lat: number; lng: number };
}

export interface AreasData {
  version: string;
  lastUpdated: string;
  areaCountNote?: string;
  areas: Area[];
}

// ============================================================
// data/common/special-disposal.json
// ============================================================

export interface SpecialDisposalEntry {
  id: string;
  name: string;
  applicableItems: string[];
  description: string;
  steps: string[];
  contacts?: { label: string; value: string }[];
  feeNote?: string;
}

export interface SpecialDisposalData {
  version: string;
  lastUpdated: string;
  entries: SpecialDisposalEntry[];
}

// ============================================================
// data/common/facilities.json
// ============================================================

export interface Facility {
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
  /** 受入品目（持ち込み施設のみ）。ガイドブック P9 由来 */
  acceptedItems?: string[];
}

export interface FacilitiesData {
  version: string;
  lastUpdated: string;
  facilities: Facility[];
}

// ============================================================
// data/common/recycle-stations.json
// ============================================================

export interface RecycleStationLocation {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface RecycleStationGroup {
  id: string;
  label: string;
  schedulePattern: string;
  dates: string[];
  locations: RecycleStationLocation[];
}

export interface RecycleStationsData {
  version: string;
  lastUpdated: string;
  description: string;
  openTime: string;
  items: string[];
  cancellationRule: string;
  groups: RecycleStationGroup[];
}

// ============================================================
// Worker API: /api/identify
// worker/src/types.ts と整合させること
// ============================================================

export interface IdentifyRequest {
  /** base64エンコードされた画像（data URI prefixなし） */
  image: string;
  /** 画像のMIMEタイプ。省略時は "image/jpeg" */
  mimeType?: string;
}

export type IdentifyResponse =
  | {
      success: true;
      identifiedName: string | null;
      reason?: 'could_not_identify' | 'not_garbage';
    }
  | {
      success: false;
      error: string;
      errorCode:
        | 'invalid_request'
        | 'rate_limited'
        | 'gemini_error'
        | 'internal_error';
    };

// ============================================================
// アプリ内: AsyncStorage で管理するユーザー設定
// ============================================================

export interface UserSettings {
  /** 設定地区 ID（areas.json の Area.id）。未設定時はオンボーディング誘導 */
  areaId: string | null;
  /** 収集日前夜の通知 ON/OFF */
  notificationsEnabled: boolean;
  /** 通知時刻 HH:mm（24h）。デフォルト "20:00" */
  notificationTime: string;
  /** 最後に取り込んだデータ version（meta.json.version） */
  dataVersion: string | null;
}

// ============================================================
// アプリ内: 次回収集日の表示用
// ============================================================

export interface NextCollection {
  categoryId: CollectionCategoryId;
  categoryName: string;
  date: Date;
}
