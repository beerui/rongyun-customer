import axios from 'axios'
import { http } from '@/apis/http'

/**
 * 文件上传：优先走后端统一上传（待后端给接口）；
 * 目前用 data: URL 做预览兜底，保证 UI 流程能跑通。
 * 后端接入后只需把 remoteUpload 换成真实接口。
 */

export interface UploadResult {
  url: string
  name?: string
  size?: number
  width?: number
  height?: number
  duration?: number
}

/** 待后端给出统一上传接口后替换此实现 */
async function remoteUpload(file: File): Promise<UploadResult | null> {
  try {
    const form = new FormData()
    form.append('file', file)
    // TODO: 后端接口路径待确认；临时尝试常见路径，失败则回退到本地预览
    const data: any = await http.post('/api/customer/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    if (data?.url) return { url: data.url, name: file.name, size: file.size }
    return null
  } catch (e) {
    return null
  }
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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
  const remote = await remoteUpload(file)
  const meta = await probeImage(file)
  if (remote) return { ...remote, ...meta }
  const url = await toDataUrl(file)
  return { url, name: file.name, size: file.size, ...meta }
}

export async function uploadVideo(file: File): Promise<UploadResult> {
  const meta = await probeVideo(file)
  const remote = await remoteUpload(file)
  if (remote) return { ...remote, ...meta }
  // 大视频用 objectURL 仅本地预览可见
  const url = URL.createObjectURL(file)
  return { url, name: file.name, size: file.size, ...meta }
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const remote = await remoteUpload(file)
  if (remote) return remote
  const url = await toDataUrl(file)
  return { url, name: file.name, size: file.size }
}
