/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 主色：中国大集主色 #FA3E3E
        brand: {
          50: '#FEF5F5',
          100: '#FFECE8',
          500: '#FA3E3E',
          600: '#E83737',
          700: '#CB272D',
        },
        // 次要（Primary 蓝）
        info: {
          50: '#E6F4FF',
          500: '#1677FF',
          600: '#1890FF',
        },
        // 中性
        ink: {
          900: '#222222',
          800: '#333333',
          700: '#3D3D3D',
          600: '#666666',
        },
        line: {
          light: '#F0F0F0',
          DEFAULT: '#D8D8D8',
        },
        bg: {
          app: '#F7F8FC',
          soft: '#FAFAFA',
        },
        success: { 500: '#00B42A', 50: '#E8FFEA' },
        warn:    { 500: '#FAAD14', 700: '#D25F00', 50: '#FFF7E8' },
        error:   { 500: '#FA3E3E', 700: '#CB272D', 50: '#FFECE8' },
      },
      fontFamily: {
        sans: ['PingFang SC', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
