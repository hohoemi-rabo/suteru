/**
 * これどう捨てる？ デザインシステム
 *
 * トーン: 明るく・親しみやすく・ポップで生活感のある
 * 主役カラー: 緑（エコ・清潔感）+ 空色（情報・地区）
 *
 * このファイルは constants/Colors.ts として配置し、全画面から参照する。
 * 色のハードコードを禁止し、必ずここを経由すること。
 */

export const Palette = {
  // ── ブランドカラー（緑系・主役）──
  green: {
    50: "#F4FBF2",   // 画面背景、薄い面
    100: "#EAF3DE",  // カード内のうっすら緑
    200: "#C0DD97",  // ベータバッジ背景、アクセント
    400: "#1D9E75",  // メインの緑（カメラボタン、アクティブタブ）★主役
    600: "#3B6D11",  // 濃い緑テキスト（バッジ上の文字、サブ文）
    800: "#27500A",
    900: "#173404",  // 見出しの濃い緑
  },

  // ── 情報カラー（空色系・地区/リンク）──
  blue: {
    50: "#E6F1FB",   // 地区カードの背景
    100: "#B5D4F4",
    400: "#378ADD",
    600: "#185FA5",  // リンク文字、地区アイコン
    800: "#0C447C",
    900: "#042C53",  // 地区名の濃い文字
  },

  // ── ニュートラル ──
  bg: {
    page: "#EEF4FB",      // アプリ全体の背景（薄い青）
    surface: "#FFFFFF",   // カード・パネルの白
  },
  text: {
    primary: "#1A1A1A",   // 本文
    secondary: "#5F5E5A", // 補足
    tertiary: "#9A9A95",  // プレースホルダ・ヒント
  },
  border: {
    light: "rgba(0,0,0,0.08)",
    medium: "rgba(0,0,0,0.15)",
  },

  // ── 注意・警告 ──
  danger: {
    bg: "#FCEBEB",
    text: "#A32D2D",
  },
} as const;

/**
 * ごみカテゴリの色（収集日カレンダー・凡例・結果画面のバッジで共通使用）
 * 飯田市カレンダーの色分けに準拠
 */
export const CategoryColors = {
  burnable:         { dot: "#E24B4A", label: "燃やすごみ" },        // 赤
  plastic_resource: { dot: "#EF9F27", label: "プラスチック資源" },  // 黄/オレンジ
  landfill:         { dot: "#888780", label: "埋立ごみ" },          // グレー
  hazardous:        { dot: "#D85A30", label: "特定（有害）ごみ" },  // 朱
  metal_resource:   { dot: "#37597A", label: "金属類資源" },        // 紺
  paper_resource:   { dot: "#712B13", label: "紙類資源" },          // 茶
} as const;

/**
 * 角丸・余白・文字サイズのトークン
 */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,    // 検索バー・バッジ
  circle: "50%", // カメラボタン
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 32,
} as const;

export const FontSize = {
  caption: 11,   // バッジ、タブラベル
  small: 13,     // 補足・注意書き
  body: 15,      // 本文・ボタン
  subtitle: 16,  // 地区名
  title: 21,     // 画面タイトル
  hero: 28,      // 「今日 6月2日」など強調数字
} as const;

export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
};
