import { http } from './http'

/** 挂起当前会话（客服主动挂起） */
export const suspendConversation = (targetId: string) =>
  http.post('/api/customer/suspend', { targetId })

/** 转接到其他客服 */
export const transferConversation = (targetId: string, toAgentId: string) =>
  http.post('/api/customer/transfer', { targetId, toAgentId })

/** 结束会话 */
export const endConversation = (targetId: string) =>
  http.post('/api/customer/end', { targetId })

/** 获取客服可选的会话（客服工作台用） */
export const fetchAgentConversations = () =>
  http.post<any, any[]>('/api/customer/conversations', {})

/** 获取可转接的客服列表 */
export const fetchAgentsForTransfer = () =>
  http.post<any, Array<{ id: string; name: string; avatar?: string; online?: boolean }>>(
    '/api/customer/agents',
    {},
  )
