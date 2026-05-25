/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ベース（行政シビック・ブルー）。エコ緑からネイビー＋ブルー基調へ刷新
        brand: {
          100: '#E0F2FE', // 情報カード・ヘッダー行の薄い青背景（旧 薄緑 #DCFCE7）
          500: '#0369A1', // CTA 背景。白文字 5.9:1 で WCAG AA 通過
          600: '#075985', // リンク・見出しアクセント・バッジ文字。白背景 7.0:1 で AA 通過
        },
        // アクセント（青、補助情報・リンク・位置情報）。旧 #0EA5E9 は白背景 2.8:1 で AA 不通過のため変更
        accent: {
          50: '#E0F2FE', // 情報カードの薄い青背景
          600: '#0369A1', // 情報リンク・位置情報アクション。白背景 5.9:1 / 白文字 5.9:1 で AA 通過
        },
        // 警告（赤、火災注意等）。warn-100 上で 6.81:1
        warn: {
          100: '#FEE2E2',
          600: '#991B1B', // 白背景 8.31:1
        },
        // エコ・完了（旧ブランド緑を限定用途で温存）
        success: {
          100: '#DCFCE7',
          500: '#15803D', // 白文字 4.9:1
        },
        // テキスト・ニュートラル（スレート系で高コントラスト化）
        ink: {
          200: '#E2E8F0', // 枠線（slate-200）
          500: '#475569', // 補助テキスト（slate-600）。白背景 7.5:1
          900: '#0F172A', // 本文・見出し（slate-900 / ネイビー）。白背景 16:1
        },
        // カード・検索ボックス等の「面」の白。画面背景は ScreenBackground のグラデが担う
        bg: {
          DEFAULT: '#FFFFFF',
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
