<template>
  <div class="window__wrapper" :style="transformStyle" ref="windowRef">
    <div
      :class="{
        window: true,
        selected: props.selected,
        hidden: props.hidden,
        open: props.open,
      }"
      :id="String(props.id)"
      :style="[windowStyle]"
      :data-id="props.id"
      ref="windowRef"
    >
      <Image
        class="window-image"
        :sources="thumbnail"
        :fill="!props.selected"
        :showcase="props.open"
      />
      <div class="window-top" ref="windowTop">
        <h2>{{ props.title }}</h2>
        <WindowButton
          text="open"
          activeText="close"
          :active="props.open"
          :enabled="props.selected"
          @click="onClick"
        />
      </div>
    </div>
    <div class="window-tags">

    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  watchEffect,
  reactive,
  defineEmits,
  onMounted,
} from "vue";
import { generateWindowSize } from "@/utils/layout";
import { Vector2 } from '@/utils/layout.types'
import { isBetween } from "@/utils/math";
import { ImageFormats } from "@/utils/api.types";
import {
  createWindowTransformStyle,
  createWindowWrapperRotation,
} from "@/utils/layout";
import WindowButton from "./WindowButton.vue";
import Image from "./ui/Image.vue";
import { ScreenDims } from "@/utils/layout.types";

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
  thumbnail: ImageFormats;
  velocity?: Vector2;
  zoomFactor: number;
  open: boolean;
  draggable?: boolean;
  hidden: boolean;
  baseSize: Vector2;
  screenSize: ScreenDims;
}
const props = defineProps<WindowProps>();

const windowTop = ref<HTMLElement | null>(null);

const windowRef = ref<HTMLElement | null>(null);

const windowWrapper = ref<HTMLElement | null>(null);

let wrapperStyle = ref<string>("transform: rotate3d(0,0,0,0deg)");

let prevStyle = "";

const draggableTransformOffset = reactive<Vector2>({
  x: 0,
  y: 0,
});

const mouseDown = ref(false);
const lastMousePos: Vector2 = {
  x: 0,
  y: 0,
};

const size = reactive<Vector2>({ x: props.baseSize.x, y: props.baseSize.y });

let translateOffset = computed<Vector2>(() => ({
  x: size.x / 2,
  y: size.y / 2,
}));

const emit = defineEmits(["open", "close"]);

const onClick = () => {
  emit(props.open ? "close" : "open");
};

// check for window visibility
const isVisible = (t: Transform): boolean =>
  t.x + size.x > 0 &&
  t.x - size.x / 2 < props.screenSize.x &&
  t.y + size.y > 0 &&
  t.y - size.y / 2 < props.screenSize.y;

const transformStyle = computed(() => {
  const center = {
    x: translateOffset.value.x + draggableTransformOffset.x,
    y: translateOffset.value.y + draggableTransformOffset.y + 46,
  };
  const transform = {
    ...props.transform,
    scale: props.hidden ? props.transform.scale - 0.5 : props.transform.scale,
  };
  // console.log(transform)

  if (isVisible(transform)) {
    const style = createWindowTransformStyle(transform, center);
    prevStyle = style;
    return style;
  }
  return prevStyle;
});

// watchEffect(() => {
//   wrapperStyle.value = createWindowWrapperRotation(props.?);
// });

const windowStyle = computed(() => {
  return `
    width: ${size.x}px;
    height: ${size.y}px;
  `;
});

watchEffect(() => {
  const { aspectRatio } = props.thumbnail.large;

  const s = generateWindowSize(aspectRatio, props.baseSize);
  if (props.open) {
    s.y -= 41;
  }
  size.x = s.x;
  size.y = s.y;
});

function resetDraggableOffset() {
  const move = () => {
    draggableTransformOffset.x += (0 - draggableTransformOffset.x) * 0.015;
    draggableTransformOffset.y += (0 - draggableTransformOffset.y) * 0.015;
  };
  const loop = () => {
    if (
      !isBetween(draggableTransformOffset.x, -0.1, 0.1) ||
      !isBetween(draggableTransformOffset.x, -0.1, 0.1)
    ) {
      move();
      requestAnimationFrame(loop);
    }
  };
  loop();
}

watchEffect(() => {
  if (
    !props.draggable &&
    (draggableTransformOffset.x !== 0 || draggableTransformOffset.y !== 0)
  ) {
    resetDraggableOffset();
  }
});

const onStart = (e: MouseEvent) => {
  lastMousePos.x = e.clientX;
  lastMousePos.y = e.clientY;
  if (props.draggable) {
    mouseDown.value = true;
  }
};

const onMove = (e: MouseEvent) => {
  if (mouseDown.value) {
    const delta: Vector2 = {
      x: lastMousePos.x - e.clientX,
      y: lastMousePos.y - e.clientY,
    };
    console.log(delta);
    draggableTransformOffset.x += delta.x;
    draggableTransformOffset.y += delta.y;
  }
  lastMousePos.x = e.clientX;
  lastMousePos.y = e.clientY;
};

const onEnd = () => {
  mouseDown.value = false;
};

onMounted(() => {
  if (windowTop.value) {
    windowTop.value.addEventListener("mousedown", onStart);
  }
  // window.addEventListener("resize", () => {
  //   baseSize.x = window.innerWidth < 600 ? 250 : 500;
  //   baseSize.y = window.innerWidth < 600 ? 250 : 500;
  // });
  window.addEventListener("mouseup", onEnd);
  window.addEventListener("mousemove", onMove);
});
</script>

<style lang="sass">

.window__wrapper
  position: absolute
  height: auto
  width: auto
  // transition: transform .8s ease-out 0s

.window
  position: absolute
  min-height: 300px
  width: 400px
  user-select: none
  border: $b-width solid $c-grey-6
  border-radius: $b-radius
  overflow: hidden
  transition: filter .2s ease-out 0s, background-position .3s ease-in-out 0s, opacity .6s linear 0s, height .6s linear 0s
  box-shadow: 0px 4px 24px 6px rgba(0, 0, 0, .25)
  user-select: none
  cursor: pointer
  opacity: 1

  .window-img
    position: absolute
    top: 0
    bottom: 0
    left: 0
    right: 0
    object-fit: cover
    object-position: center center

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
    transition: background-color .6s linear, transform 0.6s ease-out .3s

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
      transition: background-color .3s linear, transform 0.3s ease-out .3s

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

  &.hidden
    transition: filter .2s ease-out 0s, background-position .3s ease-in-out 0s, opacity .6s linear 0s, transform .6s ease-in 0s
    opacity: 0
    pointer-events: none
    user-select: none

  &.open .window-top
    transform: translateY(-46px)
    transition: background-color .6s linear, transform 0.3s ease-in 0s

.window-tags
  position: relative
  top: 100%
  left: 0px
  background-color: red
  height: 100px
  width: 100px
</style>
