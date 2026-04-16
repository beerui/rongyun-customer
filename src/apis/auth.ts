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

/** 后端真实响应 shape */
interface AgentLoginRaw {
  id: number
  userId: string
  account: string
  nickname: string
  avatar?: string
  token: string        // 业务 JWT
  ryToken: string      // 融云 token
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

export const fetchUserImCredential = () =>
  http.post<any, UserImCredential>('/api/customer/getRyToken', {})

export const agentLogin = async (account: string, password: string): Promise<AgentImCredential> => {
  const raw = await http.post<any, AgentLoginRaw>('/api/customer/login', { account, password })
  return normalizeAgent(raw)
}
