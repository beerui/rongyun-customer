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
  import('vconsole').then((module) => {
    new module.default()
  })
}

createApp(App).use(createPinia()).use(router).mount('#app')
