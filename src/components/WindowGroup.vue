<template>
  <div
    ref="windowRef"
    :class="{
      window: true,
      selected: props.selected,
    }"
    :style="[transformStyle, windowStyle]"
  >
    <div class="window-top">
      <h2>{{ props.title }}</h2>
      <WindowButton text="open" :enabled="props.selected" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect, reactive } from "vue";
import { Vector2 } from "@/utils/layout";
import { ImageFormat } from "@/utils/api";
import { createWindowTransformStyle } from "@/utils/layout";
import WindowButton from "./WindowButton.vue";

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface WindowProps {
  transform: Transform;
  title: string;
  id: number | string;
  selected?: boolean;
  thumbnail: ImageFormat;
  velocity: Vector2;
  zoomFactor: number;
  open: boolean,
}

const windowRef = ref<HTMLElement | null>(null);

const baseSize = reactive<Vector2>({
  x: window.innerWidth < 600 ? 250 : 500,
  y: window.innerWidth < 600 ? 250 : 500,
});
const size = reactive<Vector2>({ x: baseSize.x, y: baseSize.y });

let translateOffset = computed<Vector2>(() => ({
  x: size.x / 2,
  y: size.y / 2,
}));

const props = defineProps<WindowProps>();

const transformStyle = computed(() => {
  const center = {
    x: translateOffset.value.x,
    y: translateOffset.value.y + 46,
  }
  return createWindowTransformStyle(props.transform, center, props.velocity);
});

const defaultBg =
  "https://images.unsplash.com/photo-1643293383951-0755fda59471?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1587&q=80";

const windowStyle = computed(() => {
  return `
    background-image: url(${props.thumbnail?.url || defaultBg});
    width: ${size.x}px;
    height: ${size.y}px;
  `;
});

// watchEffect(
//   () => {
//     if (windowRef.value) {
//       windowRef.value.classList.toggle("selected", props.selected);
//     }
//   },
//   {
//     flush: "post",
//   }
// );

watchEffect(() => {
  const { width, height } = props.thumbnail;
  const ratio = width / height;

  if (ratio > 1) {
    size.x = baseSize.x * ratio + 41; // show whole image by compensating for tab bar
    size.y = baseSize.y;
  } else {
    size.x = baseSize.x;
    size.y = baseSize.y / ratio + 41;
  }
  translateOffset.value.x = size.x / 2;
  translateOffset.value.y = size.y / 2;
});

window.addEventListener("resize", () => {
  baseSize.x = window.innerWidth < 600 ? 250 : 500;
  baseSize.y = window.innerWidth < 600 ? 250 : 500;
});
</script>

<style lang="sass">

.window
  position: absolute
  min-height: 300px
  width: 400px
  user-select: none
  border: $b-width solid $c-grey-6
  border-radius: $b-radius
  // overflow: hidden
  background-position: center center
  background-size: cover
  filter: blur(4px)
  transition: filter .2s ease-out 0s, background-position .3s ease-in-out 0s,
  box-shadow: 0px 4px 24px 6px rgba(0, 0, 0, .25)
  user-select: none
  cursor: pointer

  .window-top
    @include fl-sb
    position: absolute
    border-top-left-radius: $b-radius
    border-top-right-radius: $b-radius
    top: -1px
    left: -1px
    right: -1px
    padding: 12px
    border-bottom: $b-width solid $c-grey-6
    transition: background-color .6s linear

    h2
      @include f-project-title
      color: $c-grey-1
      opacity: 0
      transition: opacity .6s linear
      user-select: none
      -webkit-user-select: none
      cursor: default

    .window-btn
      @include fl-center
      height: 18px
      width: 18px
      border-radius: 100%
      border: none
      background-color: $c-grey-6
      transition: background-color .3s linear 0s, transform .3s ease-out 0s

  &.selected
    border-color: $c-grey-6
    z-index: 2
    background-position: bottom center
    cursor: default

    .window-top
      background-color: $c-grey-6
      transition-duration: .3s

      h2
        opacity: 1
        transition-delay: .3s
        transition-duration: .3s

      .window-btn
        background-color: $c-green
        transition: background-color .2s linear 1.2s, transform .3s ease-out 0s

        &:hover
          transform: scale(1.2)

  &.selected, &:hover
    filter: blur(0px)

// .window::before {
//   content: "";
//   position: absolute;
//   top: 0;
//   left: 0;
//   height: 100%;
//   width: 100%;
//   border-radius: 50%;
//   background-color: red;
//   filter: blur(50px);
// }
</style>
