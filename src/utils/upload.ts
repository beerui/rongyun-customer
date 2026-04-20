import { OSS_DIR } from '@/constants/common'
import { uploadToOss } from '@/utils/oss'

/**
 * 上传：获取 STS 后直传 OSS（对齐 trade-exhibition-mobile `utils/oss.js`）。
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
  const url = await uploadToOss(file, OSS_DIR.CUSTOMER)
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
