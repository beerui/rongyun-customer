import axios from 'axios'
import { getUploadPolicy } from '@/apis/oss'
import { OSS_DIR, OSS_DIR_NAME, OSS_RESIZE_KEY } from '@/constants/common'

const ossAxios = axios.create({ timeout: 30000 })

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function randomString(length: number, type: 'letter' | 'number' | 'mix' = 'letter', prefix = ''): string {
  const numbers = '0123456789'
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let chars = ''
  let result = prefix
  if (type === 'number' || type === 'mix') chars += numbers
  if (type === 'letter' || type === 'mix') chars += letters
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function ossDirKeyForPath(directory: string): string {
  const entry = Object.entries(OSS_DIR).find(([, v]) => v === directory)
  return entry?.[0] ?? ''
}

export interface UploadToOssOptions {
  fileName?: string
  prefix?: string
  onProgress?: (percent: number) => void
}

/**
 * 直传阿里云 OSS（PostObject），流程对齐 trade-exhibition-mobile `src/utils/oss.js`。
 */
export async function uploadToOss(
  file: File,
  directory: (typeof OSS_DIR)[keyof typeof OSS_DIR],
  options: UploadToOssOptions = {},
): Promise<string> {
  if (!directory) {
    console.error('请指定文件夹')
  }
  const image = ossDirKeyForPath(directory)
  if (import.meta.env.DEV && !image) {
    const keys = Object.keys(OSS_DIR)
      .map((key) => `OSS_DIR.${key}`)
      .join('、')
    throw new Error(`directory 属性必须为 ${keys} 其中一个`)
  }
  if (import.meta.env.DEV) {
    console.log(`上传至【${OSS_DIR_NAME[directory as keyof typeof OSS_DIR_NAME]}】文件夹`)
  }

  const res = await getUploadPolicy({ image })
  const { accessKeyId, dir, policy, signature, host, baseUrl } = res

  const randomStringLength = 6
  const rawName = options.fileName || file.name
  const ext = rawName.lastIndexOf('.') > -1 ? rawName.substring(rawName.lastIndexOf('.')) : ''
  const uniqueName = generateUUID()
  const objectKey = `${dir}/${randomString(randomStringLength, 'mix', options.prefix || '')}_${Date.now()}_${uniqueName}${ext}`

  const form = new FormData()
  form.append('key', objectKey)
  form.append('policy', policy)
  form.append('OSSAccessKeyId', accessKeyId)
  form.append('success_action_status', '200')
  form.append('signature', signature)
  form.append('file', file)

  await ossAxios.post(host, form, {
    onUploadProgress: (evt) => {
      if (!options.onProgress || !evt.total) return
      options.onProgress(Math.round((evt.loaded * 100) / evt.total))
    },
  })

  return `${baseUrl}/${objectKey}`
}

const resizeKeyMap: Record<string, string> = {
  mode: 'm',
  width: 'w',
  height: 'h',
  longest: 'l',
  smallest: 's',
  limit: 'limit',
  color: 'color',
}

/**
 * 图片缩放 URL（对齐 oss.js `getImageResizeUrl`）
 */
export function getImageResizeUrl(
  url: string,
  options: Record<string, string | number>,
): string {
  if (!url || typeof url !== 'string') return url
  if (!options || typeof options !== 'object') return url
  const params: string[] = ['x-oss-process=image/resize']
  Object.entries(options).forEach(([key, raw]) => {
    const realKey = resizeKeyMap[key] || key
    let value: string | number = raw
    if (key === 'width' || key === 'height') {
      value = String(value).replace('px', '')
    }
    params.push(`${realKey}_${value}`)
  })
  const paramsString = params.join()
  return url.includes('?') ? `${url}&${paramsString}` : `${url}?${paramsString}`
}

export function addOssImgParams(url: string, imageParam: string): string {
  if (!url) return ''
  const ossProcessKey = 'x-oss-process'
  const imagePrefix = 'image/'
  const urlObj = new URL(url)
  urlObj.searchParams.set(ossProcessKey, `${imagePrefix}${imageParam}`)
  return urlObj.toString()
}

export function addOssResizeParams(
  url: string,
  resize: Partial<Record<keyof typeof OSS_RESIZE_KEY, string | number>>,
): string {
  if (!resize || typeof resize !== 'object') return url
  const resizeArray = Object.keys(resize)
    .filter((key) => OSS_RESIZE_KEY[key as keyof typeof OSS_RESIZE_KEY] && (resize as any)[key] !== '' && (resize as any)[key] !== undefined)
    .map((key) => `${key}_${(resize as any)[key]}`)
  if (!resizeArray.length) return url
  return addOssImgParams(url, `resize,${resizeArray.join(',')}`)
}

export function addWebpParams(url: string): string {
  return addOssImgParams(url, 'format,webp')
}
