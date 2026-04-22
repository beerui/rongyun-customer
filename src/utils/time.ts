// src/utils/time.ts
function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function formatMessageTime(timestamp?: number): string {
  if (!timestamp) return ''

  const now = Date.now()
  const diff = now - timestamp
  const date = new Date(timestamp)

  // 1分钟内：刚刚
  if (diff < 60 * 1000) return '刚刚'

  // 1小时内：X分钟前
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }

  // 今天：HH:MM
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  // 昨天：昨天 HH:MM
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  // 今年：MM-DD
  if (date.getFullYear() === today.getFullYear()) {
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }

  // 更早：YYYY-MM-DD
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
