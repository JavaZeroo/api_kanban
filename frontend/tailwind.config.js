/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ---- 品牌红 (PANTONE 185C) ---- */
        brand: {
          DEFAULT: '#C7000B',
          700: '#A00008',
          600: '#C7000B',
          500: '#D53C44',
          400: '#E3787D',
          300: '#F1B4B6',
          50: '#FFF1EF',
        },
        /* ---- 蓝色系 (信息/交互) ---- */
        info: {
          DEFAULT: '#115CAA',
          600: '#115CAA',
          500: '#4883BF',
          400: '#7FAAD4',
          300: '#B6D1E9',
          50: '#EEF8FE',
        },
        /* ---- 黄色系 (已评审/高亮) ---- */
        hi: {
          DEFAULT: '#FCC800',
          600: '#E5B600',
          500: '#FCC800',
          400: '#FFD431',
          300: '#FFDF64',
          200: '#FFEA98',
          50: '#FFF4CB',
        },
        /* ---- 绿色系 (对齐/正向) ---- */
        ok: {
          DEFAULT: '#61B230',
          600: '#519824',
          500: '#61B230',
          400: '#85C460',
          300: '#AAD690',
          200: '#CFE8C0',
          50: '#F4FAF0',
        },
        /* ---- 中性灰阶 ---- */
        line: {
          950: '#1F1F1F',
          900: '#333333',
          800: '#595959',
          700: '#8C8C8C',
          600: '#A6A6A6',
          500: '#BFBFBF',
          400: '#D9D9D9',
          300: '#E5E5E5',
          200: '#F0F0F0',
          100: '#F5F5F5',
          50: '#FAFAFA',
        },
        /* ---- 语义别名 (兼容旧组件引用) ---- */
        ink: {
          950: '#FAFAFA',
          900: '#FFFFFF',
          850: '#F5F5F5',
          800: '#F0F0F0',
        },
        accent: {
          cyan: '#115CAA',
          mint: '#61B230',
          amber: '#FCC800',
          rose: '#D53C44',
          crimson: '#C7000B',
          slate: '#A6A6A6',
        },
        status: {
          aligned: '#61B230',
          reviewed: '#FCC800',
          pending: '#D53C44',
          unsupported: '#C7000B',
          untested: '#A6A6A6',
        },
      },
      fontFamily: {
        sans: [
          'HarmonyOS Sans SC',
          'HarmonyOS Sans',
          'PingFang SC',
          'Microsoft YaHei',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'HarmonyOS Sans Mono',
          'Menlo',
          'ui-monospace',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
        'card-up': '0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
