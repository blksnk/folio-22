<template>
  <div class="text-window" :style="style">
    <h3 v-if="props?.title">{{ props.title }}</h3>
    <p>{{ props.content }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  Vector2,
  Transform,
  WINDOW_WIDTH,
  createWindowTransformStyle,
} from "@/utils/layout";

export interface TextWindowProps {
  transform?: Transform;
  title?: string;
  content: string;
  zoomFactor: number;
  id: number | string;
}

const style = computed(() => {
  return `width: ${WINDOW_WIDTH}px; `;
  // const transform = createWindowTransformStyle
});

const props = defineProps<TextWindowProps>();
</script>

<style lang="sass">
.text-window
  @include bordered
  @include blur-bg
  position: absolute
  padding: 12px
</style>
