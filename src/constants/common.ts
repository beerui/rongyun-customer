// 公用资源存储oss 地址
export const ossUrl = 'https://static.chinamarket.cn/static/trade-exhibition'

/** 上传文件夹 */
export const OSS_DIR = {
  CUSTOMER: 'customer', // 客服
} as const

export type OssDirValue = (typeof OSS_DIR)[keyof typeof OSS_DIR]

export const OSS_DIR_NAME: Record<OssDirValue, string> = {
  [OSS_DIR.CUSTOMER]: '客服',
}

// resize方法 https://help.aliyun.com/zh/oss/user-guide/resize-images-4
export const OSS_RESIZE_KEY = {
  p: 'p', // 按百分比缩放图片
  w: 'w', // 指定目标缩放图的宽度
  h: 'h', // 指定目标缩放图的高度
  m: 'm', // 缩放模式 lfit/mfit/fill/pad/fixed
  l: 'l', // 指定目标缩放图的最长边
  s: 's', // 指定目标缩放图的最短边
  limit: 'limit', // 目标图片分辨率大于原图时是否缩放
  color: 'color', // pad 模式填充颜色
} as const

export const UUID = '__UUID__'
