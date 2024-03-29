<template>
  <div id="minimap" :style="minimapStyle">
    <div
      class="minimap__item"
      v-for="(item, index) in minimapItemStyles"
      :key="'item' + index"
      :style="item.style"
      :class="{ active: item.selected, hidden: item.hidden }"
      @click="apiData.selectWindow(item.id)"
      @mouseover="onMouseOver"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { generateWindowSize } from "@/utils/layout";
import { Vector2, ScreenDims } from "@/utils/layout.types"
import { useApiData } from "@/stores/apiData";
import { useMouseData } from '@/stores/mouseData'
import { useGestureData } from "@/stores/gestureData";

interface MinimapItem {
  transform: Vector2;
  ratio: number;
  height: number;
  width: number;
  selected: boolean;
  id: string;
  hidden: boolean;
}

interface MinimapItemProps {
  style: string;
  id: string;
  selected: boolean;
  hidden: boolean;
}

const mouseData = useMouseData()
const gestureData = useGestureData()
const apiData = useApiData()

const items = computed<MinimapItem[]>(() =>
  apiData.allWindows.map(({ transform, thumbnail, selected, id, hidden }) => ({
    transform: {
      x: transform.x,
      y: transform.y,
    },
    ratio: thumbnail.large.aspectRatio,
    selected,
    height: thumbnail.large.height,
    width: thumbnail.large.width,
    hidden,
    id,
  }))
);

const HEIGHT = 150;
const SCALE_FACTOR = 6;
const ITEM_SIZE = HEIGHT / SCALE_FACTOR;


const WIDTH = computed(() => HEIGHT * gestureData.screenSize.ratio);

const renderRatio = computed<Vector2>(() => ({
  x: WIDTH.value / gestureData.screenSize.x,
  y: HEIGHT / gestureData.screenSize.y,
}));

const itemScales = computed(() => items.value.map(({ ratio }) => {
  const s = generateWindowSize(ratio, { x: 1, y: 1} )
  return {
    x: s.x - 2,
    y: s.y - 44
  }
}))


const minimapItemStyles = computed<MinimapItemProps[]>(() =>
  items.value
    .map(({ transform, ratio, selected, hidden, ...item }, index) => ({
      x:
        (transform.x * renderRatio.value.x) / 2 +
        WIDTH.value / 4 -
        ITEM_SIZE / 2,
      y: (transform.y * renderRatio.value.y) / 2 + HEIGHT / 4 - ITEM_SIZE / 2,
      
      
      scale: itemScales.value[index],
      selected,
      hidden,
      ...item,
    }))
    .map(({ id, selected, hidden, ...item }) => ({
      style: `height: ${ITEM_SIZE}px; width: ${ITEM_SIZE}px ; transform: translate(${item.x}px, ${item.y}px) scale(${item.scale.x}, ${item.scale.y});`,
      selected,
      id,
      hidden,
    }))
);

const minimapStyle = computed(
  () => `height: ${HEIGHT}px; width: ${WIDTH.value}px;`
);

const onMouseOver = () => {
  mouseData.showCursor = false
}
</script>

<style lang="sass">

#minimap
  @include blur-bg
  position: absolute
  bottom: 32px
  left: 32px
  overflow: hidden
  border: $b-style
  border-radius: 5px
  z-index: 5
  pointer-events: all

  @media screen and (max-width: 600px)
    left: 22px
    bottom: 22px

  .minimap__item
    position: absolute
    background-color: transparent
    transition: background-color .2s linear 0s, opacity .3s linear 0s
    transform-origin: center center
    pointer-events: all
    border: 1px solid $c-grey-6
    background-color: transparent
    opacity: 1
    pointer-events: all

    &.hidden
      opacity: 0
      pointer-events: none

    &.active
      background-color: $c-primary
      z-index: 4

    &:hover, &.active
      border-color: $c-primary
</style>
