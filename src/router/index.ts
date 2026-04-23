import { type RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'
import { isMobile } from '@/utils/device'

const UserChat = () => import('@/pages/pc/user/UserChat.vue')
const ChatEntry = () => import('@/pages/pc/user/ChatEntry.vue')
const AgentLogin = () => import('@/pages/pc/agent/AgentLogin.vue')
const AgentWorkbench = () => import('@/pages/pc/agent/AgentWorkbench.vue')
const MobileChat = () => import('@/pages/mobile/user/MobileChat.vue')
const MobileIntro = () => import('@/pages/mobile/user/MobileIntro.vue')

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/buyer/default' },
  { path: '/buyer/:targetId', component: UserChat },
  { path: '/chat', component: ChatEntry },
  { path: '/agent/login', component: AgentLogin },
  { path: '/agent', component: AgentWorkbench, meta: { requiresAgent: true } },
  { path: '/m', component: MobileChat },
  { path: '/m/intro', component: MobileIntro },
  { path: '/:pathMatch(.*)*', redirect: '/buyer/default' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const mobile = isMobile()

  // 客服路由仅 PC 可访问；移动端一律跳到用户端
  if (to.path.startsWith('/agent') && mobile) {
    return '/m'
  }

  // 移动端访问 PC 用户端首页 → 跳 /m
  if (mobile && to.path === '/') {
    return '/m'
  }

  // PC 访问移动端路由 → 跳 PC 首页
  if (!mobile && to.path.startsWith('/m')) {
    return '/'
  }

  // 客服路由守卫：没登录就去登录页
  if (to.meta.requiresAgent) {
    const token = localStorage.getItem('agent_auth_token')
    if (!token) return '/agent/login'
  }

  return true
})

export default router
