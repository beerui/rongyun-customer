import js from '@eslint/js'
import typescriptPlugin from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import vuePlugin from 'eslint-plugin-vue'
import globals from 'globals'
import vueParser from 'vue-eslint-parser'

const golbalConfig = {
  ref: 'readonly',
  reactive: 'readonly',
  computed: 'readonly',
  watch: 'readonly',
  watchEffect: 'readonly',
  onMounted: 'readonly',
  onUnmounted: 'readonly',
  onBeforeUnmount: 'readonly',
  nextTick: 'readonly',
}

export default [
  // 全局忽略配置
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.output/**',
      '*.local',
      'public/**',
      'docs/superpowers/**',
      'examples/**/dist/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...golbalConfig,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.vue'],
    plugins: {
      vue: vuePlugin,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: '2020',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
        parser: typescriptParser,
      },
      globals: {
        ...golbalConfig,
      },
    },
    rules: {
      ...vuePlugin.configs['essential'].rules,
      ...vuePlugin.configs['recommended'].rules,
      'vue/multi-word-component-names': 'off',
      'vue/no-v-model-argument': 'off',
      'vue/no-unused-vars': 'warn',
      'vue/no-unused-components': 'warn',
      'vue/return-in-computed-property': 'off',
      'vue/no-expose-after-await': 'off',
    },
  },
]
