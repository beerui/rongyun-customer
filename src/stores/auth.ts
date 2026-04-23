import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { type AgentImCredential, agentLogin as apiAgentLogin, fetchUserImCredential } from '@/apis/auth'

export type Role = 'guest' | 'user' | 'agent'

const AGENT_SESSION_KEY = 'agent_session'
const USER_AUTH_TOKEN_KEY = 'user_auth_token'
const AGENT_AUTH_TOKEN_KEY = 'agent_auth_token'

interface AgentSession {
  rcToken: string
  agentId: string
  name: string
  avatar?: string
  peers: Array<{ id: string; name: string; avatar?: string }>
}

function loadAgentSession(): AgentSession | null {
  try {
    const raw = localStorage.getItem(AGENT_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveAgentSession(s: AgentSession) {
  localStorage.setItem(AGENT_SESSION_KEY, JSON.stringify(s))
}

export const useAuthStore = defineStore('auth', () => {
  const role = ref<Role>('guest')
  const userId = ref('')
  const name = ref('')
  const avatar = ref('')
  const rcToken = ref('')
  const peerId = ref('')
  const peers = ref<Array<{ id: string; name: string; avatar?: string }>>([])

  const isAgent = computed(() => role.value === 'agent')

  function getAuthTokenKey(): string {
    return location.pathname.startsWith('/agent') ? AGENT_AUTH_TOKEN_KEY : USER_AUTH_TOKEN_KEY
  }

  function applyAgent(cred: AgentImCredential) {
    role.value = 'agent'
    userId.value = cred.agentId
    name.value = cred.name
    avatar.value = cred.avatar ?? 'https://randomuser.me/api/portraits/men/32.jpg'
    rcToken.value = cred.rcToken
    peers.value = cred.peers ?? []
  }

  async function bootstrapUser() {
    const cred = await fetchUserImCredential()
    console.log('bootstrapUser', cred)
    role.value = 'user'
    userId.value = cred.userId
    name.value = cred.name
    avatar.value = cred.avatar ?? ''
    rcToken.value = cred.rcToken
    peerId.value = cred.peerId
  }

  async function bootstrapUserWithTarget(targetId?: string) {
    const cred = await fetchUserImCredential(targetId)
    console.log('bootstrapUser', cred)
    role.value = 'user'
    userId.value = cred.userId
    name.value = cred.name
    avatar.value = cred.avatar ?? ''
    rcToken.value = cred.rcToken
    peerId.value = cred.peerId
  }

  async function loginAgent(account: string, password: string) {
    const cred = await apiAgentLogin(account, password)
    console.log('loginAgent', cred)
    localStorage.setItem(AGENT_AUTH_TOKEN_KEY, cred.authToken || '')
    applyAgent(cred)
    saveAgentSession({
      rcToken: cred.rcToken,
      agentId: cred.agentId,
      name: cred.name,
      avatar: cred.avatar,
      peers: cred.peers,
    })
  }

  /** 从 localStorage 恢复客服会话（刷新后调用） */
  function restoreAgent(): boolean {
    const s = loadAgentSession()
    if (!s || !s.rcToken) return false
    role.value = 'agent'
    userId.value = s.agentId
    name.value = s.name
    avatar.value = s.avatar ?? ''
    rcToken.value = s.rcToken
    peers.value = s.peers ?? []
    return true
  }

  async function bootstrap() {
    const onAgent = location.pathname.startsWith('/agent')
    if (onAgent) {
      restoreAgent()
      return
    }
    try {
      await bootstrapUser()
    } catch {
      role.value = 'guest'
    }
  }

  function logout() {
    localStorage.removeItem(USER_AUTH_TOKEN_KEY)
    localStorage.removeItem(AGENT_AUTH_TOKEN_KEY)
    localStorage.removeItem(AGENT_SESSION_KEY)
    role.value = 'guest'
    userId.value = ''
    name.value = ''
    avatar.value = ''
    rcToken.value = ''
    peerId.value = ''
    peers.value = []
  }

  return {
    role,
    userId,
    name,
    avatar,
    rcToken,
    peerId,
    peers,
    isAgent,
    getAuthTokenKey,
    bootstrap,
    bootstrapUser,
    bootstrapUserWithTarget,
    loginAgent,
    restoreAgent,
    logout,
  }
})
