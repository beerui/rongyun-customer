import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchUserImCredential, agentLogin as apiAgentLogin } from '@/apis/auth'

export type Role = 'guest' | 'user' | 'agent'

export const useAuthStore = defineStore('auth', () => {
  const role = ref<Role>('guest')
  const userId = ref('')
  const name = ref('')
  const avatar = ref('')
  const rcToken = ref('')
  /** 私聊模式下为对端 userId；群模式下为 groupId */
  const peerId = ref('')
  /** 客服持有的对端/群列表 */
  const peers = ref<Array<{ id: string; name: string; avatar?: string }>>([])

  const isAgent = computed(() => role.value === 'agent')

  async function bootstrapUser() {
    const cred = await fetchUserImCredential()
    role.value = 'user'
    userId.value = cred.userId
    name.value = cred.name
    avatar.value = cred.avatar ?? ''
    rcToken.value = cred.rcToken
    peerId.value = cred.peerId
  }

  async function loginAgent(account: string, password: string) {
    const cred = await apiAgentLogin(account, password)
    localStorage.setItem('auth_token', cred.authToken)
    role.value = 'agent'
    userId.value = cred.agentId
    name.value = cred.name
    avatar.value = cred.avatar ?? ''
    rcToken.value = cred.rcToken
    peers.value = cred.peers ?? []
  }

  /** App.vue 启动时决定是否自动加载用户端凭证 */
  async function bootstrap() {
    if (location.pathname.startsWith('/agent')) return
    try {
      await bootstrapUser()
    } catch {
      role.value = 'guest'
    }
  }

  function logout() {
    localStorage.removeItem('auth_token')
    role.value = 'guest'
    userId.value = ''
    name.value = ''
    avatar.value = ''
    rcToken.value = ''
    peerId.value = ''
    peers.value = []
  }

  return {
    role, userId, name, avatar, rcToken, peerId, peers, isAgent,
    bootstrap, bootstrapUser, loginAgent, logout,
  }
})
