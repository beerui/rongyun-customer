import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchUserImCredential, agentLogin as apiAgentLogin, type AgentImCredential } from '@/apis/auth'

export type Role = 'guest' | 'user' | 'agent'

const AGENT_SESSION_KEY = 'agent_session'

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
  } catch { return null }
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

  function applyAgent(cred: AgentImCredential) {
    role.value = 'agent'
    userId.value = cred.agentId
    name.value = cred.name
    avatar.value = cred.avatar ?? ''
    rcToken.value = cred.rcToken
    peers.value = cred.peers ?? []
  }

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
    localStorage.setItem('auth_token', cred.authToken || '')
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
    localStorage.removeItem('auth_token')
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
    role, userId, name, avatar, rcToken, peerId, peers, isAgent,
    bootstrap, bootstrapUser, loginAgent, restoreAgent, logout,
  }
})
