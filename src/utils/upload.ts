import { http } from '@/apis/http'

/**
 * 上传走后端统一中转：POST /metaman/api/oss/upload/
 * 响应拦截器已自动 unwrap 最外层 {code, data}，这里拿到的是业务层对象。
 * 老约定形如 `{ data: 'https://...' }`；也兼容 `{ url, name, size }`。
 * 失败直接抛错，不做本地预览兜底（由调用方 markFailed 体现失败态）。
 */

export interface UploadResult {
  url: string
  name?: string
  size?: number
  width?: number
  height?: number
  duration?: number
}

async function remoteUpload(file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('file', file)
  const body: any = await http.post('/metaman/api/oss/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const url: string | undefined =
    typeof body === 'string' ? body :
    body?.url ?? body?.data ?? body?.fileUrl
  if (!url) throw new Error('上传响应缺少 url 字段')
  return { url }
}

async function probeImage(file: File): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => { resolve({}); URL.revokeObjectURL(url) }
    img.src = url
  })
}

async function probeVideo(file: File): Promise<{ width?: number; height?: number; duration?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      resolve({ width: v.videoWidth, height: v.videoHeight, duration: v.duration })
      URL.revokeObjectURL(url)
    }
    v.onerror = () => { resolve({}); URL.revokeObjectURL(url) }
    v.src = url
  })
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const [{ url }, meta] = await Promise.all([remoteUpload(file), probeImage(file)])
  return { url, name: file.name, size: file.size, ...meta }
}

export async function uploadVideo(file: File): Promise<UploadResult> {
  const [{ url }, meta] = await Promise.all([remoteUpload(file), probeVideo(file)])
  return { url, name: file.name, size: file.size, ...meta }
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const { url } = await remoteUpload(file)
  return { url, name: file.name, size: file.size }
}
