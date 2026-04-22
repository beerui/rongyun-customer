import { http } from './http'

export interface UserImCredential {
  rcToken: string
  userId: string
  name: string
  avatar?: string
  peerId: string
}

export interface AgentImCredential {
  rcToken: string
  agentId: string
  name: string
  avatar?: string
  authToken: string
  peers: Array<{ id: string; name: string; avatar?: string }>
}

interface AgentLoginRaw {
  id: number
  userId: string
  account: string
  nickname: string
  avatar?: string
  token: string
  ryToken: string
  online?: number
  status?: number
}

function normalizeAgent(raw: AgentLoginRaw): AgentImCredential {
  return {
    rcToken: raw.ryToken,
    agentId: String(raw.userId ?? raw.id),
    name: raw.nickname || raw.account,
    avatar: raw.avatar,
    authToken: raw.token,
    peers: [],
  }
}

/** 获取或生成访客 UUID（持久化到 localStorage，全局唯一） */
function getOrCreateGuestUuid(): string {
  const key = 'guest_uuid'
  let uuid = localStorage.getItem(key)
  if (!uuid) {
    uuid = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(key, uuid)
  }
  return uuid
}

/**
 * 访客获取融云 token。
 * 后端 getRyToken 暂未就绪（1015 错误），返回 mock 凭证保证 UI 可跑通；
 * 后端修复后自动走真实响应，不需再改前端。
 */
export const fetchUserImCredential = async (): Promise<UserImCredential> => {
  const uuid = getOrCreateGuestUuid()
  const params = new URLSearchParams(window.location.search)
  const target = params.get('target')

  try {
    const payload: any = { uuid }
    if (target) payload.customerId = target

    const raw: any = await http.post('/api/customer/getRyToken', payload)
    return {
      rcToken: raw.ryToken,
      userId: String(raw.userId),
      name: raw.nickname || `访客${uuid.slice(-4)}`,
      avatar: raw.avatar,
      peerId: target || String(raw.customerId || ''),
    }
  } catch (e) {
    console.warn('[mock] getRyToken unavailable, using mock visitor credential:', e)
    return {
      rcToken: `mock-visitor-${uuid}`,
      userId: `visitor_${uuid.slice(-8)}`,
      name: `访客${uuid.slice(-4)}`,
      avatar: '',
      peerId: target || 'agent_default',
    }
  }
}

export const agentLogin = async (account: string, password: string): Promise<AgentImCredential> => {
  const raw = await http.post<any, AgentLoginRaw>('/api/customer/login', { account, password })
  return normalizeAgent(raw)
}
