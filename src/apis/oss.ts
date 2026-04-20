import { http } from '@/apis/http'

/** 与 trade-exhibition-mobile `getUploadPolicy` 对齐的后端 STS 响应 */
export interface OssStsToken {
  accessKeyId: string
  dir: string
  policy: string
  signature: string
  host: string
  baseUrl: string
}

/** GET /api/user-web/client/oss/stsToken?image=CUSTOMER */
export function getUploadPolicy(params: { image: string }) {
  return http.get<any, OssStsToken>('/gateway/api/user-web/client/oss/stsToken', { params })
}
