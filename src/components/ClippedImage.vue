<template>
  <div class="clipped-image" :style="containerStyle">
    <div
      v-for="(style, index) in imgStyles"
      v-if="imgFormats"
      :key="'img' + index"
      :style="style"
      class="clipped-image__img"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, watchEffect, ref, defineProps } from "vue";
import { useGestureData } from "@/stores/gestureData";
import { useMouseData } from "@/stores/mouseData";
import { ImageFormat, ImageFormats } from "@/utils/api.types";
import { createTransformString, px } from "@/utils/layout";
import { createRects, preloadImage, computeBoundingRect } from "@/utils/visual";
import { RectProps } from "@/utils/visual.types";
import { useApiData } from "@/stores/apiData";
import { Vector2 } from "@/utils/layout.types";

const mouseData = useMouseData();
const gestureData = useGestureData();
const apiData = useApiData()

let rects = ref<RectProps[]>([]);

const imgFormats = ref<ImageFormats | undefined>();



const imgSize = ref<Vector2>({ x: 100, y: 100 })

const createImageSize = ({ width, height } : ImageFormat): Vector2 => {
  const x = apiData.isMobile ? window.innerWidth - 100 : (window.innerWidth - 124) * 0.4
  const ratio = width / height;
  const y = x / ratio
  return {
    x, y
  }
}

const TRANSLATE_AMOUNT = computed(() => apiData.isMobile ? -2 : -10)

preloadImage(15).then((i) => {
  if (i) {
    imgFormats.value = i;
    imgSize.value = createImageSize(i.large)
    rects.value = createRects(apiData.isMobile ? 3 : 5, imgSize.value.x, imgSize.value.y);
  }
});

const boundingRect = computed<RectProps>(() =>
  computeBoundingRect(rects.value)
);

const imgStyles = computed(() =>
  rects.value.map((rect, index) => ({
    height: px(rect.height),
    width: px(rect.width),
    top: px(rect.y - boundingRect.value.y),
    left: px(rect.x - boundingRect.value.x),
    backgroundImage: `url(${imgFormats.value?.large.url})`,
    backgroundSize: `${px(imgSize.value.x)} ${px(imgSize.value.y)}`,
    backgroundPosition: px(-rect.x) + " " + px(-rect.y),
    transform: createTransformString({
      x: TRANSLATE_AMOUNT.value * mouseData.normalizedMousePos.x * (index + 1),
      y:
        TRANSLATE_AMOUNT.value * mouseData.normalizedMousePos.y * (index + 1) -
        gestureData.scrollPos.y * 0.3 * ((index + 1) * .5),
      scale: 1,
    }),
  }))
);

const containerStyle = computed(() => ({
  width: px(boundingRect.value.width - boundingRect.value.x || 0),
  height: px(boundingRect.value.height - boundingRect.value.y || 0),
}));
</script>

<style lang="sass">

.clipped-image
  position: fixed
  z-index: 0
  // filter: hue-rotate(160deg)
  right: 44px
  top: 44px

.clipped-image__img
  @include bordered
  position: absolute
  top: 0
  left: 0
  object-fit: none
  object-size: 70vw auto
  mix-blend-mode: exclusion

  @media screen and (max-width: 600px)
    mix-blend-mode: normal
</style>
