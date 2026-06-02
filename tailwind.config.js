/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // elevation（Spotify の shadow ベース elevation をライト向けに翻訳。生グレー枠の代替）
      // ネイビー slate-900(15,23,42) を淡く乗せて面を浮かせる。RN New Arch の boxShadow 経由
      boxShadow: {
        card: '0px 1px 3px rgba(15, 23, 42, 0.10), 0px 1px 2px rgba(15, 23, 42, 0.06)',
        elevated: '0px 8px 24px rgba(15, 23, 42, 0.14)',
      },
      colors: {
        // カード・検索ボックス等の「面」の白。画面背景は ScreenBackground のグラデが担う
        bg: {
          DEFAULT: '#FFFFFF',
        },
        // ── デザイントークン（constants/Colors.ts の Palette と同期。値を変える時は両方）──
        green: {
          50: '#F4FBF2',
          100: '#EAF3DE',
          200: '#C0DD97',
          400: '#1D9E75', // 主役の緑（カメラボタン・アクティブタブ・主要ボタン）
          600: '#3B6D11',
          800: '#27500A',
          900: '#173404',
        },
        blue: {
          50: '#E6F1FB',
          100: '#B5D4F4',
          400: '#378ADD',
          600: '#185FA5', // リンク・地区アイコン
          800: '#0C447C',
          900: '#042C53', // 地区名の濃い文字
        },
        page: '#EEF4FB', // 画面背景（薄い青）※ホームは緑グラデを使用
        body: '#1A1A1A', // 本文
        muted: '#5F5E5A', // 補足
        hint: '#9A9A95', // プレースホルダ・ヒント
        line: 'rgba(0,0,0,0.08)', // 細ボーダー
        danger: {
          DEFAULT: '#A32D2D',
          bg: '#FCEBEB',
        },
        // カテゴリ8色（categories.json の color と一致させる）
        cat: {
          burnable: '#E63946',
          plastic: '#F59E0B',
          landfill: '#6B7280',
          hazardous: '#EA580C',
          metal: '#475569',
          paper: '#92400E',
          oversized: '#7C3AED',
          special: '#1E3A8A',
        },
      },
    },
  },
  plugins: [],
};
