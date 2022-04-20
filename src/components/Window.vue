<template>
  <div
    class="window__wrapper"
    :style="windowTransformStyleString"
    ref="windowWrapper"
  >
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
        :alt="props.title"
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
    <div v-if="tags" id="window__tags" :class="{ hidden }">
      <div v-for="tag in tags" :key="tag.uid" class="window__tag">
        <span>{{ tag.title }}</span>
      </div>
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
  watch,
} from "vue";
import { generateWindowSize } from "@/utils/layout";
import { Vector2, Transform } from "@/utils/layout.types";
import { isBetween } from "@/utils/math";
import { ImageFormats, ProjectTag } from "@/utils/api.types";
import {
  createWindowTransformStyle,
  createTransformString,
  createWindowWrapperRotation,
} from "@/utils/layout";
import WindowButton from "./WindowButton.vue";
import Image from "./ui/Image.vue";
import { ScreenDims } from "@/utils/layout.types";

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
  tags?: ProjectTag[];
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

const size = computed<Vector2>(() => {
  const { aspectRatio } = props.thumbnail.large;

  const s = generateWindowSize(aspectRatio, props.baseSize);
  if (props.open) {
    s.y -= 46;
  }
  return s;
});

let translateOffset = computed<Vector2>(() => ({
  x: size.value.x / 2,
  y: size.value.y / 2,
}));

const emit = defineEmits(["open", "close"]);

const onClick = () => {
  emit(props.open ? "close" : "open");
};

// check for window visibility
const isVisible = (t: Transform): boolean =>
  t.x + size.value.x > -size.value.x / 2 &&
  t.x - size.value.x / 2 < props.screenSize.x * 2 &&
  t.y + size.value.y > -size.value.y / 2 &&
  t.y - size.value.y / 2 < props.screenSize.y * 2;

// const transformStyle = computed(() => {
//   const center = {
//     x: translateOffset.value.x + draggableTransformOffset.x,
//     y: translateOffset.value.y + draggableTransformOffset.y + 46,
//   };
//   // console.log(transform)

//   if (isVisible(props.transform) && !props.hidden) {
//     const style = createWindowTransformStyle(props.transform, center);
//     prevStyle = style;
//     return style;
//   }
//   return prevStyle;
// });

const windowTransform = ref({ x: 0, scale: 0, y: 0 });

watchEffect(() => {
  if (isVisible(props.transform) && !props.hidden) {
    const center = {
      x: translateOffset.value.x + draggableTransformOffset.x,
      y: translateOffset.value.y + draggableTransformOffset.y + 46,
    };
    windowTransform.value = createWindowTransformStyle(props.transform, center);
  }
});

const windowTransformStyleString = computed(() =>
  createTransformString(windowTransform.value)
);

// watchEffect(() => {
//   wrapperStyle.value = createWindowWrapperRotation(props.?);
// });

const windowStyle = computed(
  () => `
    width: ${size.value.x}px;
    height: ${size.value.y}px;
  `
);

const tagWrapperStyle = computed(() =>
  createTransformString({
    ...props.transform,
    // scale: 1,
    x: props.transform.x * props.transform.scale,
    y: props.transform.y + (size.value.y / 2) * props.transform.scale,
  })
);

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
  transform-origin: center center
  // transition: transform .8s ease-out 0s
  min-height: 300px
  width: 400px
  width: min-content
  height: min-content

.window
  position: relative
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
  transform-origin: center center
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
    // filter: blur(0px)

  &.hidden
    transition: filter .2s ease-out 0s, background-position .3s ease-in-out 0s, opacity .6s linear 0s, transform .6s ease-in 0s
    opacity: 0
    pointer-events: none
    user-select: none

  &.open
    transition: filter .2s ease-out 0s, background-position .3s ease-in-out 0s, opacity .6s linear 0s, height .3s linear 0s

    .window-top
      transform: translateY(-46px)
      transition: background-color .6s linear, transform 0.3s ease-in 0s

#window__tags
  position: absolute
  left: 0
  top: calc(100% + 12px)
  display: flex
  justify-content: flex-start
  align-items: center
  transform-origin: top left
  gap: 12px
  opacity: 1
  transition: opacity .2s linear 0s

  .window__tag
    @include blur-bg
    padding: 6px 12px
    color: $c-grey-6
    border-radius: 24px
    background-color: rgba(12, 12, 12, .8)

  &.hidden
    opacity: 0
</style>
