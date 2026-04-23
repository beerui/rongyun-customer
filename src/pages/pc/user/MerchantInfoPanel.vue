<script setup lang="ts">
import { useImStore } from '@/stores/im'
import type { ProductPayload } from '@/im/types'

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
  { productId: '1', title: '智能音箱家用殿堂级智能家居系统华为小米智联互动', cover: '', price: 899, minOrder: '100件起批' } as any,
  { productId: '2', title: '智能音箱家用殿堂级智能家居系统华为小米智联互动', cover: '', price: 899, minOrder: '100件起批' } as any,
  { productId: '3', title: '智能音箱家用殿堂级智能家居系统华为小米智联互动', cover: '', price: 899, minOrder: '100件起批' } as any,
  { productId: '4', title: '智能音箱家用殿堂级智能家居系统华为小米智联互动', cover: '', price: 899, minOrder: '100件起批' } as any,
]

function sendProduct(p: ProductPayload) {
  im.sendCard('product', p)
}
</script>

<template>
  <div class="h-full overflow-y-auto scrollbar-thin px-[10px] py-5 flex flex-col gap-5 bg-[#f7f8fc]">
    <!-- 商家信息 -->
    <div class="bg-[#f7f8fc] rounded-lg p-[10px]">
      <div class="text-base font-medium text-[#333] mb-[10px]">商家信息</div>
      <div class="flex flex-col gap-[10px]">
        <div class="text-xs font-medium text-[#333]">{{ merchantInfo.name }}</div>
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

    <!-- 商品推荐 -->
    <div class="bg-[#f7f8fc] rounded-lg p-[10px]">
      <div class="text-base font-medium text-[#333] mb-[10px]">商品推荐</div>
      <div class="flex flex-col">
        <div
          v-for="(product, idx) in products"
          :key="product.productId"
          class="flex flex-row items-center gap-[4px] pb-[6px]"
          :class="idx < products.length - 1 ? 'border-b border-[#edeef1]' : ''"
        >
          <div class="w-10 h-10 rounded-[4px] bg-[#acacac] shrink-0 overflow-hidden border border-[#edeef1]">
            <img v-if="product.cover" :src="product.cover" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 flex flex-col gap-1">
            <div class="flex flex-row justify-between gap-[2px]">
              <div class="text-xs text-[#000] leading-[17px] line-clamp-2 w-[145px]">{{ product.title }}</div>
              <div class="text-sm text-[#000] text-right">¥{{ product.price }}</div>
            </div>
            <div class="flex flex-row justify-between items-center">
              <span class="text-xs text-[#999]">{{ (product as any).minOrder }}</span>
              <button class="bg-[#FA3E3E] text-white text-xs rounded-[6px] px-[10px] py-[4px]" @click="sendProduct(product)">
                发送商品
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
