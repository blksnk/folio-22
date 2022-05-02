<template>
  <div class="clipped-image" :style="containerStyle">
    <img v-for="(style, index) in imgStyles" v-if="imgFormats" :key="'img' + index"  showcase  :style="style" class="clipped-image__img" :src="imgFormats?.large.url" alt="" cover />
  </div>
</template>

<script lang="ts" setup>
import { useMouseData } from "@/stores/mouseData";
import { ImageFormats } from "@/utils/api.types";
import GestureHandler from "@/utils/gesture";
import { px } from "@/utils/layout";
import { Vector2 } from "@/utils/layout.types";
import { createRects, preloadImage } from "@/utils/visual";
import { RectProps } from "@/utils/visual.types";
import { computed, onBeforeUnmount, onMounted, ref, defineProps } from "vue";

const mouseData = useMouseData()



let rects = ref<RectProps[]>([]);

const imgFormats = ref<ImageFormats | undefined>();


const TRANSLATE_AMOUNT = -7

preloadImage(15).then((i) => {
  if (i) {
    imgFormats.value = i;
    rects.value = createRects(7, i.large.width, i.large.height);
  }
});

const imgStyles = computed(() => rects.value.map((rect, index) => {
  return {
  height: px(rect.height),
  width: px(rect.width),
  top: px(rect.y),
  left: px(rect.x),
  objectPosition: px(-rect.x) + ' ' + px(-rect.y),
  transform: `
    translateX(${px(TRANSLATE_AMOUNT * (mouseData.normalizedMousePos?.x || 0) * (index + 1))})
    translateY(${px(TRANSLATE_AMOUNT * (mouseData.normalizedMousePos?.y || 0) * (index + 1))})
  `
}}))

const containerStyle = computed(() => ({
  width: px(imgFormats.value?.large.width || 0),
  height: px(imgFormats.value?.large.height || 0),
}))
// const onMove = (mousePos: Vector2) => {
//   normalizedMousePos.value.x = (mousePos.x / window.innerWidth - .5) * 2
//   normalizedMousePos.value.y = (mousePos.y / window.innerHeight - .5) * 2
// }

// onMounted(() => {
//   gestures = new GestureHandler({
//     onMove,
//   })
// })

// onBeforeUnmount(() => {
//   if(gestures) gestures.destroy()
// })

</script>

<style lang="sass">

.clipped-image
  position: fixed
  z-index: 0
  filter: hue-rotate(160deg)
  right: 44px
  top: 44px

.clipped-image__img
  @include bordered
  position: absolute
  top: 0
  left: 0
  object-fit: none
</style>
