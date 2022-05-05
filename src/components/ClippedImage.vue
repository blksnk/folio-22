<template>
  <div class="clipped-image" :style="containerStyle">
    <img
      v-for="(style, index) in imgStyles"
      v-if="imgFormats"
      :key="'img' + index"
      showcase
      :style="style"
      class="clipped-image__img"
      :src="imgFormats?.large.url"
      alt=""
      cover
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, watchEffect, ref, defineProps } from "vue";
import { useGestureData } from "@/stores/gestureData";
import { useMouseData } from "@/stores/mouseData";
import { ImageFormats } from "@/utils/api.types";
import { createTransformString, px } from "@/utils/layout";
import { createRects, preloadImage, computeBoundingRect } from "@/utils/visual";
import { RectProps } from "@/utils/visual.types";

const mouseData = useMouseData();
const gestureData = useGestureData();

let rects = ref<RectProps[]>([]);

const imgFormats = ref<ImageFormats | undefined>();

const TRANSLATE_AMOUNT = -8;

preloadImage(15).then((i) => {
  if (i) {
    imgFormats.value = i;
    rects.value = createRects(5, i.large.width, i.large.height);
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
    objectPosition: px(-rect.x) + " " + px(-rect.y),
    transform: createTransformString({
      x: TRANSLATE_AMOUNT * mouseData.normalizedMousePos.x * (index + 1),
      y:
        TRANSLATE_AMOUNT * mouseData.normalizedMousePos.y * (index + 1) -
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
</style>
