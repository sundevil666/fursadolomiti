<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLanguageChange } from '@/composables/useLanguageChange'

interface Props {
  text: string
  tag?: string
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'span',
})

const { locale } = useI18n()
const { languageChangeCounter } = useLanguageChange()
const currentText = ref(props.text)
const isAnimating = ref(false)
const animationKey = ref(0)
const textParts = computed(() => {
  const match = currentText.value.match(/^(.*?)(\s+)(\d)(★)$/u)

  if (!match) {
    return {
      text: currentText.value,
      space: '',
      number: '',
      star: '',
    }
  }

  return {
    text: match[1],
    space: match[2],
    number: match[3],
    star: match[4],
  }
})

watch(
  () => props.text,
  (newText, oldText) => {
    if (newText !== oldText) {
      isAnimating.value = true
      animationKey.value += 1
      setTimeout(() => {
        currentText.value = newText
      }, 150)
      setTimeout(() => {
        isAnimating.value = false
      }, 300)
    }
  },
  { immediate: true }
)

watch([locale, languageChangeCounter], () => {
  isAnimating.value = true
  animationKey.value += 1
  setTimeout(() => {
    currentText.value = props.text
  }, 150)
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
})
</script>

<template>
  <component
    :is="tag"
    class="animated-text"
    :class="{ 'animated-text--animating': isAnimating }"
    data-aos="text-rise"
    data-aos-once="true"
    data-aos-duration="900"
    data-aos-offset="0"
  >
    <Transition name="animated-text">
      <span :key="currentText" class="animated-text__content">
        <template v-if="textParts.number">
          <span v-text="textParts.text" />
          <span v-text="textParts.space" />
          <span class="animated-text__rating-number" v-text="textParts.number" />
          <span v-text="textParts.star" />
        </template>
        <template v-else>
          {{ currentText }}
        </template>
      </span>
    </Transition>
  </component>
</template>

<style scoped lang="scss">
.animated-text {
  display: inline-block;
  position: relative;

  &__content {
    display: inline-block;
    white-space: pre-line;
  }

  &__rating-number {
    display: inline-block;
    transform: translateY(-0.2em);
  }
}

.animated-text-enter-active {
  animation: textTransformIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.animated-text-leave-active {
  animation: textTransformOut 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

@keyframes textTransformIn {
  0% {
    opacity: 0;
    transform: translate3d(0, 0.18em, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes textTransformOut {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  100% {
    opacity: 0;
    transform: translate3d(0, -0.16em, 0);
  }
}
</style>
