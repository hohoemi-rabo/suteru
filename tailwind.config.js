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
        // ベース（深い緑、エコ・環境）。白文字とのコントラスト 4.93:1 で WCAG AA 通過
        brand: {
          100: '#DCFCE7',
          500: '#15803D', // CTA 背景。白文字 4.93:1
          600: '#166534', // リンク・バッジ文字。白背景 7.09:1、brand-100 上 6.44:1
        },
        // アクセント（水色、補助情報）
        accent: {
          500: '#0EA5E9',
        },
        // 警告（赤、火災注意等）。warn-100 上で 6.81:1
        warn: {
          100: '#FEE2E2',
          600: '#991B1B', // 白背景 8.31:1
        },
        // 成功
        success: {
          500: '#10B981',
        },
        // テキスト・グレースケール
        ink: {
          200: '#E5E7EB',
          500: '#6B7280',
          900: '#1F2937',
        },
        // 画面背景
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
