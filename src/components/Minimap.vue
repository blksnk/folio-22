<template>
  <div id="minimap" :style="minimapStyle">
    <div
      class="minimap__item"
      v-for="(item, index) in minimapItemStyles"
      :key="'item' + index"
      :style="item.style"
      :class="{ active: item.selected }"
      @click="onSelect(item.id)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { ScreenDims } from "@/views/IndexView.vue";
import { Vector2 } from "@/utils/gesture";

interface MinimapItem {
  transform: Vector2;
  ratio: number;
  height: number;
  width: number;
  selected: boolean;
  id: string | number;
}

interface MinimapProps {
  items: MinimapItem[];
  screenSize: ScreenDims;
  onSelect: (id: string | number) => void;
  zoomFactor: { value: number };
}

interface MinimapItemProps {
  style: string;
  id: string | number;
  selected: boolean;
}

const props = defineProps<MinimapProps>();

const HEIGHT = 150;
const SCALE_FACTOR = 5;
const ITEM_SIZE = HEIGHT / SCALE_FACTOR;

const WIDTH = computed(() => HEIGHT * props.screenSize.ratio);

const renderRatio = computed<Vector2>(() => ({
  x: WIDTH.value / props.screenSize.x,
  y: HEIGHT / props.screenSize.y,
}));

const minimapItemStyles = computed<MinimapItemProps[]>(() =>
  props.items
    .map(({ transform, ratio, selected, ...item }) => ({
      x:
        (transform.x * renderRatio.value.x) / 2 +
        WIDTH.value / 4 -
        ITEM_SIZE / 2,
      y: (transform.y * renderRatio.value.y) / 2 + HEIGHT / 4 - ITEM_SIZE / 2,
      scale: { x: 1, y: 1 / ratio },
      selected,
      ...item,
    }))
    .map(({ id, selected, ...item }) => ({
      style: `height: ${ITEM_SIZE}px; width: ${ITEM_SIZE}px ; transform: translate(${item.x}px, ${item.y}px) scale(${item.scale.x}, ${item.scale.y});`,
      selected,
      id,
    }))
);

watch(
  () => props.screenSize,
  () => console.log(props.screenSize)
);

const minimapStyle = computed(
  () => `height: ${HEIGHT}px; width: ${WIDTH.value}px;`
);
</script>

<style lang="sass">

#minimap
  @include blur-bg
  position: fixed
  bottom: 82px
  left: 32px
  overflow: hidden
  border: $b-style
  border-radius: 5px
  z-index: 5

  @media screen and (max-width: 600px)
    left: 22px

  .minimap__item
    position: absolute
    background-color: transparent
    transition: background-color .2s linear 0s
    transform-origin: center center
    pointer-events: all
    border: 1px solid $c-grey-6

    &.active
      background-color: $c-primary
      z-index: 4

    &:hover, &.active
      border-color: $c-primary
</style>
