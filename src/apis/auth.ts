import { http } from './http'

export interface UserImCredential {
  rcToken: string
  userId: string
  name: string
  avatar?: string
  /** 对端 ID：private 模式下为客服 userId；group 模式下为 groupId */
  peerId: string
}

export interface AgentImCredential {
  rcToken: string
  agentId: string
  name: string
  avatar?: string
  peers: Array<{ id: string; name: string; avatar?: string }>
  authToken?: string
}

/** 用户端进站获取融云凭证 */
export const fetchUserImCredential = () =>
  http.post<any, UserImCredential>('/api/customer/getRyToken', {})

/** 客服登录 */
export const agentLogin = (account: string, password: string) =>
  http.post<any, AgentImCredential>('/api/customer/login', { account, password })
