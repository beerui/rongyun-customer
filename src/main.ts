import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/index.css'

// vconsole 条件加载：开发环境或 URL 参数 ?vconsole=1 时在移动端启用
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
const hasVconsoleParam = new URLSearchParams(window.location.search).get('vconsole') === '1'
const shouldLoadVconsole = isMobile && (import.meta.env.DEV || hasVconsoleParam)

if (shouldLoadVconsole) {
  import('https://unpkg.com/vconsole@latest/dist/vconsole.min.js')
    .then((module) => {
      new (module as any).default()
    })
    .catch(() => {
      // 降级方案：通过 script 标签加载
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/vconsole@latest/dist/vconsole.min.js'
      script.onload = () => {
        new (window as any).VConsole()
      }
      document.head.appendChild(script)
    })
}

createApp(App).use(createPinia()).use(router).mount('#app')
