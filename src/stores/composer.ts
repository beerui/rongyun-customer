import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 跨组件共享"待发送文本草稿"。
 * 其它组件（快捷话术抽屉、推荐回复按钮等）通过 insert() 把文本写进输入框。
 */
export const useComposerStore = defineStore('composer', () => {
  const draft = ref('')
  /** 每次调用 insert 时自增，让 MessageInput 能用 watch 检测到同一字符串的重复插入 */
  const version = ref(0)

  function insert(text: string) {
    draft.value = text
    version.value++
  }

  function append(text: string) {
    draft.value = draft.value ? `${draft.value}\n${text}` : text
    version.value++
  }

  function clear() {
    draft.value = ''
    version.value++
  }

  return { draft, version, insert, append, clear }
})
