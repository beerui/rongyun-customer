import {
  type DajiCSBootOptions,
  type DajiCSEventType,
  type OpenOptions,
  boot,
  mountLauncher,
  on,
  open,
  refreshIdentity,
  setUnreadCount,
  toggleWidget,
  unmountLauncher,
  version,
} from '@daji/cs-sdk'

// 1) 初始化：baseUrl / apiBase 由 .env.[mode] 注入（dev/staging/production 三套）
const baseUrl = import.meta.env.VITE_CS_BASE_URL
const apiBase = import.meta.env.VITE_CS_API_BASE
if (!baseUrl || !apiBase) {
  throw new Error('[demo] 缺少 VITE_CS_BASE_URL / VITE_CS_API_BASE，请检查 .env 文件')
}

const bootCfg: DajiCSBootOptions = {
  baseUrl,
  apiBase,
  debug: true,
  autoCloseOnEnd: true,
  endCloseDelay: 3000,
}
boot(bootCfg)
console.log('[demo] DajiCS version:', version, 'mode:', import.meta.env.MODE)

// 2) 事件监控器（HUD）
const logEl = document.getElementById('log') as HTMLPreElement
const lines: string[] = []
function hud(msg: string) {
  const ts = new Date().toLocaleTimeString()
  lines.push(`[${ts}] ${msg}`)
  if (lines.length > 30) lines.shift()
  logEl.textContent = lines.join('\n')
}

const allEvents: DajiCSEventType[] = [
  'ready',
  'window:open',
  'window:focus',
  'window:close',
  'presend:start',
  'presend:success',
  'presend:error',
  'launcher:mount',
  'launcher:click',
  'launcher:unmount',
  'widget:open',
  'widget:close',
  'unread:change',
  'message:incoming',
  'conversation:end',
  'error',
]
allEvents.forEach((ev) => {
  on(ev, (payload) => hud(`${ev} ${payload ? JSON.stringify(payload) : ''}`))
})

// 3) 模拟产品列表
interface Product {
  id: string
  title: string
  price: number
  origin: number
  cover: string
}
const products: Product[] = [
  {
    id: 'SPU_9001',
    title: '新疆灰枣 5kg 礼盒',
    price: 128,
    origin: 168,
    cover: 'https://placehold.co/260x180/FA3E3E/fff?text=Dates',
  },
  {
    id: 'SPU_9002',
    title: '云南古树普洱生茶 357g',
    price: 288,
    origin: 398,
    cover: 'https://placehold.co/260x180/06b6d4/fff?text=Tea',
  },
  {
    id: 'SPU_9003',
    title: '内蒙古肥牛卷 500g',
    price: 78,
    origin: 98,
    cover: 'https://placehold.co/260x180/10b981/fff?text=Beef',
  },
  {
    id: 'SPU_9004',
    title: '山东烟台红富士 10 斤',
    price: 59,
    origin: 89,
    cover: 'https://placehold.co/260x180/f59e0b/fff?text=Apple',
  },
]

const common: Omit<OpenOptions, 'card'> = {
  userId: 'demo_visitor_vite',
  userName: 'Vite 访客',
  supplierId: 'shop_vite_demo',
  priceType: 'retail',
}

function renderProducts() {
  const host = document.getElementById('products')!
  host.innerHTML = products
    .map(
      (p) => `
    <div class="card" data-id="${p.id}">
      <img src="${p.cover}" alt="${p.title}" />
      <div class="info">
        <div class="title">${p.title}</div>
        <div><span class="price">¥${p.price}</span><span class="origin">¥${p.origin}</span></div>
        <button data-id="${p.id}">咨询客服</button>
      </div>
    </div>`,
    )
    .join('')

  host.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button')
    if (!btn) return
    const id = btn.dataset.id
    const product = products.find((p) => p.id === id)
    if (!product) return
    open({
      ...common,
      card: {
        title: product.title,
        imgUrl: product.cover,
        spuId: product.id,
        intr: `仅需 ¥${product.price}`,
        jumpUrl: `https://shop.example.com/p/${product.id}`,
      },
    })
  })
}
renderProducts()

// 4) 工具栏
let unread = 0
document.querySelector('.toolbar')!.addEventListener('click', (e) => {
  const btn = e.target as HTMLButtonElement
  if (btn.tagName !== 'BUTTON') return
  switch (btn.dataset.act) {
    case 'mount':
      mountLauncher({
        position: 'bottom-right',
        primary: '#FA3E3E',
        title: '大集客服',
        mode: 'iframe',
        openWith: common,
      })
      break
    case 'unmount':
      unmountLauncher()
      break
    case 'toggle':
      toggleWidget()
      break
    case 'unread-plus':
      setUnreadCount(++unread)
      break
    case 'unread-reset':
      unread = 0
      setUnreadCount(0)
      break
    case 'refresh-id': {
      const ok = refreshIdentity({ token: `new-${Date.now()}`, language: 'zh' })
      hud(`refreshIdentity -> ${ok}`)
      break
    }
    case 'sim-end':
      // 模拟 iframe 推 conversation-end（demo 同源，origin 在白名单内）
      window.postMessage(
        {
          source: 'daji-cs',
          version: '0.1.0',
          type: 'daji:conversation-end',
          payload: { reason: 'agent' },
        },
        location.origin,
      )
      break
  }
})
