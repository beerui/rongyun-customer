<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
  }>(),
  {
    placeholder: '搜索',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const inputRef = ref<HTMLInputElement>()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <input
    ref="inputRef"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    class="w-full h-8 rounded-[20px] border border-[rgba(0,0,0,0.2)] px-3 text-xs focus:outline-none focus:border-[#fa3e3e] focus:bg-white"
    @input="handleInput"
  />
</template>
