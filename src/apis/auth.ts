import { http } from './http'

export interface UserImCredential {
  rcToken: string
  userId: string
  name: string
  avatar?: string
  /** 客服侧对端 userId（一客一群就绪后改为 groupId） */
  peerId: string
}

export interface AgentImCredential {
  rcToken: string
  agentId: string
  name: string
  avatar?: string
  /** 当前客服的会话对端列表（一客一群就绪后即为 group 列表） */
  peers: Array<{ id: string; name: string; avatar?: string }>
}

/** 用户端进站获取融云凭证（游客或已登录用户） */
export const fetchUserImCredential = () =>
  http.post<any, UserImCredential>('/api/customer/getRyToken', {})

/** 客服登录 */
export const agentLogin = (account: string, password: string) =>
  http.post<any, AgentImCredential & { authToken: string }>('/api/customer/login', { account, password })
