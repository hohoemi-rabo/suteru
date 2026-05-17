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
        // ベース（明るい緑、エコ・環境）
        brand: {
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#16A34A',
        },
        // アクセント（水色、補助情報）
        accent: {
          500: '#0EA5E9',
        },
        // 警告（赤、火災注意等）
        warn: {
          100: '#FEE2E2',
          600: '#DC2626',
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
