import { http } from './http'

export interface CreateGroupParams {
  name: string
  memberIds: string[]
  avatar?: string
  description?: string
}

export interface GroupInfo {
  groupId: string
  name: string
  avatar?: string
  memberIds: string[]
  ownerId: string
  createdAt: string
}

/**
 * 创建群聊
 * 后端需要：
 * 1. 创建融云群组（调用融云服务端 API）
 * 2. 将成员加入群组
 * 3. 返回群组信息
 */
export const createGroup = async (params: CreateGroupParams): Promise<GroupInfo> => {
  return http.post<CreateGroupParams, GroupInfo>('/api/group/create', params)
}

/**
 * 获取群聊信息
 */
export const getGroupInfo = async (groupId: string): Promise<GroupInfo> => {
  return http.post<{ groupId: string }, GroupInfo>('/api/group/info', { groupId })
}

/**
 * 添加群成员
 */
export const addGroupMembers = async (groupId: string, memberIds: string[]): Promise<void> => {
  return http.post('/api/group/addMembers', { groupId, memberIds })
}

/**
 * 移除群成员
 */
export const removeGroupMembers = async (groupId: string, memberIds: string[]): Promise<void> => {
  return http.post('/api/group/removeMembers', { groupId, memberIds })
}

/**
 * 退出群聊
 */
export const quitGroup = async (groupId: string): Promise<void> => {
  return http.post('/api/group/quit', { groupId })
}

/**
 * 解散群聊（仅群主）
 */
export const dismissGroup = async (groupId: string): Promise<void> => {
  return http.post('/api/group/dismiss', { groupId })
}
