<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useImStore } from '@/stores/im'
import type { ProductPayload } from '@/im/types'

const router = useRouter()
const im = useImStore()

const merchantInfo = {
  name: '上海欧仕克五金工具有限公司',
  mainProducts:
    '微波炉手套,烫衣板套,烫衣板罩,擦手巾,抹布,洗车手套,清洁巾,围裙,浴帽,杯垫,隔热垫,厨房毛巾,雪尼尔擦手球,烫衣垫,擦车巾,冰箱洗衣机罩 桌布,浴巾,浴帘,沥水垫餐垫,束发带',
  tradeType: '-',
  businessMode: '-',
  address: '地址:上海市嘉定区嘉定区上海市嘉定区曹安路4988号1幢4090室',
  contact: '183211113464',
}

const products: ProductPayload[] = [
  { productId: '1', title: '智能音箱家用殿堂级智能家居系统华为小米智联互动', cover: '', price: 899 },
  { productId: '2', title: '智能音箱家用殿堂级智能家居系统华为小米智联互动', cover: '', price: 899 },
  { productId: '3', title: '智能音箱家用殿堂级智能家居系统华为小米智联互动', cover: '', price: 899 },
  { productId: '4', title: '智能音箱家用殿堂级智能家居系统华为小米智联互动', cover: '', price: 899 },
]

function sendProduct(p: ProductPayload) {
  im.sendCard('product', p)
  router.back()
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-[#f7f8fc]">
    <header class="h-12 bg-white flex items-center px-3 border-b border-[#f0f0f0]">
      <button class="text-gray-500 text-lg" @click="router.back()">‹</button>
      <div class="flex-1 text-center text-sm font-medium text-gray-800">商家信息</div>
      <div class="w-6" />
    </header>

    <main class="flex-1 min-h-0 overflow-y-auto px-[10px] py-5 flex flex-col gap-5">
      <!-- 商家信息卡片 -->
      <div class="bg-[#f7f8fc] rounded-lg p-[10px]">
        <div class="text-base font-medium text-[#333] mb-[10px]">商家信息</div>
        <div class="flex flex-col gap-[10px]">
          <!-- 商家名称 -->
          <div class="flex flex-row gap-[10px]">
            <span class="text-xs text-[#666] w-12 shrink-0">{{ merchantInfo.name }}</span>
          </div>
          <!-- 字段行 -->
          <div
            v-for="(item, idx) in [
              { label: '主营商品', value: merchantInfo.mainProducts },
              { label: '贸易类型', value: merchantInfo.tradeType },
              { label: '经营模式', value: merchantInfo.businessMode },
              { label: '商家地址', value: merchantInfo.address },
              { label: '联系方式', value: merchantInfo.contact },
            ]"
            :key="idx"
            class="flex flex-row gap-[10px]"
          >
            <span class="text-xs text-[#666] w-12 shrink-0">{{ item.label }}</span>
            <span class="text-xs text-[#333] flex-1">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <!-- 商品推荐卡片 -->
      <div class="bg-[#f7f8fc] rounded-lg p-[10px]">
        <div class="text-base font-medium text-[#333] mb-[10px]">商品推荐</div>
        <div class="flex flex-col">
          <div
            v-for="(product, idx) in products"
            :key="product.productId"
            class="flex flex-row items-center gap-[4px] pb-[6px]"
            :class="idx < products.length - 1 ? 'border-b border-[#edeef1]' : ''"
          >
            <!-- 商品图片 -->
            <div class="w-10 h-10 rounded-[4px] bg-[#acacac] shrink-0 overflow-hidden border border-[#edeef1]">
              <img v-if="product.cover" :src="product.cover" class="w-full h-full object-cover" />
            </div>
            <!-- 商品信息 -->
            <div class="flex-1 flex flex-col gap-1">
              <div class="flex flex-row justify-between gap-[2px]">
                <div class="text-xs text-[#000] leading-[17px] line-clamp-2 w-[145px]">{{ product.title }}</div>
                <div class="text-sm text-[#000] text-right">¥{{ product.price }}</div>
              </div>
              <div class="flex flex-row justify-between items-center">
                <span class="text-xs text-[#999]">{{ product.spec }}</span>
                <button class="bg-[#FA3E3E] text-white text-xs rounded-[6px] px-[10px] py-[4px]" @click="sendProduct(product)">
                  发送商品
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <nav class="h-12 border-t bg-white flex">
      <button class="flex-1 text-xs text-brand-500" @click="router.push('/m')">💬 咨询</button>
      <button class="flex-1 text-xs text-gray-700">🏠 商家</button>
    </nav>
  </div>
</template>
