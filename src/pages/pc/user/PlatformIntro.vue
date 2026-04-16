<template>
  <div class="h-full overflow-y-auto scrollbar-thin px-10 py-12 bg-white">
    <div class="max-w-2xl">
      <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 text-[11px] mb-4">
        <span>✨</span><span>我们随时为您服务</span>
      </div>
      <h1 class="text-[24px] font-semibold text-ink-900 mb-3">欢迎来到中国大集</h1>
      <p class="text-sm text-ink-600 leading-relaxed mb-10">
        左侧为您提供了专属的在线客服入口，遇到任何问题都可以随时咨询。我们致力于为您提供优质的服务体验。
      </p>

      <div class="grid grid-cols-2 gap-4 mb-10">
        <div class="rounded-xl bg-gradient-to-br from-brand-50 to-white border border-brand-100 p-5">
          <div class="text-brand-500 text-2xl mb-2">⚡</div>
          <div class="text-sm font-semibold text-ink-900 mb-1">极速响应</div>
          <div class="text-xs text-ink-600 leading-relaxed">专属客服 7×12 小时在线，平均响应 30 秒内。</div>
        </div>
        <div class="rounded-xl bg-gradient-to-br from-warn-50 to-white border border-warn-50 p-5">
          <div class="text-warn-700 text-2xl mb-2">🛡️</div>
          <div class="text-sm font-semibold text-ink-900 mb-1">安全保障</div>
          <div class="text-xs text-ink-600 leading-relaxed">消息全程加密传输，聊天记录云端备份。</div>
        </div>
        <div class="rounded-xl bg-gradient-to-br from-success-50 to-white border border-success-50 p-5">
          <div class="text-success-500 text-2xl mb-2">📦</div>
          <div class="text-sm font-semibold text-ink-900 mb-1">订单助手</div>
          <div class="text-xs text-ink-600 leading-relaxed">售前咨询、订单追踪、售后理赔，一站式解决。</div>
        </div>
        <div class="rounded-xl bg-gradient-to-br from-info-50 to-white border border-info-50 p-5">
          <div class="text-info-500 text-2xl mb-2">💡</div>
          <div class="text-sm font-semibold text-ink-900 mb-1">智能推荐</div>
          <div class="text-xs text-ink-600 leading-relaxed">基于您的偏好，推送最值得关注的商品和活动。</div>
        </div>
      </div>

      <h2 class="text-base font-semibold text-ink-900 mb-3">常见问题</h2>
      <ul class="space-y-2 text-sm text-ink-700">
        <li class="flex items-center gap-2 rounded-md hover:bg-bg-soft px-3 py-2 cursor-pointer">
          <span class="text-brand-500">›</span>如何查询订单物流？
        </li>
        <li class="flex items-center gap-2 rounded-md hover:bg-bg-soft px-3 py-2 cursor-pointer">
          <span class="text-brand-500">›</span>退换货流程是怎样的？
        </li>
        <li class="flex items-center gap-2 rounded-md hover:bg-bg-soft px-3 py-2 cursor-pointer">
          <span class="text-brand-500">›</span>如何修改收货地址？
        </li>
        <li class="flex items-center gap-2 rounded-md hover:bg-bg-soft px-3 py-2 cursor-pointer">
          <span class="text-brand-500">›</span>发票如何开具？
        </li>
      </ul>
    </div>
  </div>
</template>
