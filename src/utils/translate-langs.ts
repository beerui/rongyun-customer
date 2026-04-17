/**
 * 翻译目标语言清单 + 默认值 + localStorage 持久化
 * 第一项为默认值；扩充时按显示优先级排序
 */
export interface TranslateLang {
  code: string
  label: string
}

export const TRANSLATE_LANGS: TranslateLang[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
]

const STORAGE_KEY = 'translate_default_lang'

export function getDefaultLang(): string {
  return localStorage.getItem(STORAGE_KEY) || TRANSLATE_LANGS[0]?.code || 'zh'
}

export function setDefaultLang(code: string): void {
  localStorage.setItem(STORAGE_KEY, code)
}
