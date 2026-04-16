import type { ProductPayload, OrderPayload, CouponPayload } from '@/im/types'

/** 模拟商品（下一步可替换为 `GET /api/customer/products` 返回） */
export const mockProducts: ProductPayload[] = [
  {
    productId: 'p_001',
    title: '云南红糖姜茶 小袋装 独立 108g',
    cover: 'https://picsum.photos/seed/p1/200/200',
    price: 29.9,
    originPrice: 49.9,
    spec: '108g × 2 袋',
    stock: 328,
    url: 'https://example.com/p/001',
  },
  {
    productId: 'p_002',
    title: '有机原切山茶油 1L 物理压榨',
    cover: 'https://picsum.photos/seed/p2/200/200',
    price: 128,
    originPrice: 168,
    spec: '1L/瓶',
    stock: 56,
    url: 'https://example.com/p/002',
  },
  {
    productId: 'p_003',
    title: '速溶黑咖啡 2g × 30 条 0 蔗糖',
    cover: 'https://picsum.photos/seed/p3/200/200',
    price: 39,
    originPrice: 59,
    spec: '2g × 30 条',
    stock: 120,
    url: 'https://example.com/p/003',
  },
  {
    productId: 'p_004',
    title: '蓝山风味挂耳咖啡 10g × 10 片',
    cover: 'https://picsum.photos/seed/p4/200/200',
    price: 59,
    spec: '10g × 10 片',
    stock: 82,
    url: 'https://example.com/p/004',
  },
]

/** 模拟订单（按用户 ID 返回不同数据，用 userId 的 hash 决定） */
export function mockOrdersFor(userId: string): OrderPayload[] {
  const seed = userId.length
  const base: OrderPayload[] = [
    {
      orderId: `ORD-2026-${String(1000 + seed).slice(-4)}1`,
      status: '待发货',
      createdAt: '2026-04-15 14:32',
      totalAmount: 59.8,
      items: [
        { title: mockProducts[0].title, cover: mockProducts[0].cover, qty: 2, price: 29.9 },
      ],
    },
    {
      orderId: `ORD-2026-${String(1000 + seed).slice(-4)}2`,
      status: '已发货',
      createdAt: '2026-04-10 09:18',
      totalAmount: 128,
      items: [
        { title: mockProducts[1].title, cover: mockProducts[1].cover, qty: 1, price: 128 },
      ],
    },
    {
      orderId: `ORD-2026-${String(1000 + seed).slice(-4)}3`,
      status: '已完成',
      createdAt: '2026-03-28 20:04',
      totalAmount: 98,
      items: [
        { title: mockProducts[2].title, cover: mockProducts[2].cover, qty: 1, price: 39 },
        { title: mockProducts[3].title, cover: mockProducts[3].cover, qty: 1, price: 59 },
      ],
    },
  ]
  return base
}

export const mockCoupons: CouponPayload[] = [
  { couponId: 'c_10',  title: '满 99 减 10',  amount: 10,  threshold: 99,  expireAt: '2026-04-30' },
  { couponId: 'c_30',  title: '满 200 减 30', amount: 30,  threshold: 200, expireAt: '2026-04-30' },
  { couponId: 'c_50',  title: '生鲜专享 50',  amount: 50,  threshold: 300, expireAt: '2026-05-15' },
  { couponId: 'c_new', title: '新人专享 20',  amount: 20,  threshold: 0,   expireAt: '2026-12-31' },
]

export const quickReplies: string[] = [
  '您好，有什么可以帮您？',
  '正在为您查询订单信息，请稍候…',
  '您的订单预计今日送达，请留意配送信息。',
  '已为您提交售后申请，客服会在 24 小时内联系您。',
  '非常感谢您的耐心等待，还有什么可以帮您？',
  '感谢您的咨询，祝您生活愉快！',
]
