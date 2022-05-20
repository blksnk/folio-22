<template>
  <div id="cursor__container" :style="containerStyle" v-if="!mouseData.isTouch">
    <div
      id="cursor"
      :class="{
        active: mouseData.showCursor,
        transparent: mouseData.transparent,
      }"
    >
      <ion-icon v-if="mouseData.cursorIcon" :name="mouseData.cursorIcon" id="cursor__icon"></ion-icon>
      <span v-else-if="mouseData.cursorText" id="cursor__text">{{ mouseData.cursorText }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Vector2 } from "@/utils/layout.types";
import { useMouseData } from "@/stores/mouseData";

const mouseData = useMouseData();

const size: Vector2 = { x: 110, y: 110 };

const containerStyle = computed(
  () =>
    `transform: translate(${mouseData.mousePos.x - size.x / 2}px, ${
      mouseData.mousePos.y - size.y / 2
    }px) rotate(${mouseData.mouseDelta.x * 0.5}deg);`
);

</script>

<style lang="sass">

#cursor__container
  height: 110px
  width: 110px
  position: fixed
  transform-origin: center center
  z-index: 3
  pointer-events: none

#cursor
  @include fl-center
  height: 110px
  width: 110px
  border-radius: 50%
  position: fixed
  border: $b-style
  transition: transform .3s ease-out .0s, background-color .3s linear .3s
  transform: scale(0.15)
  background-color: $c-white

  #cursor__text
    color: $c-grey-6
    text-transform: uppercase
    opacity: 0
    transition: opacity .2s linear
    @include f-nav-link

  #cursor__icon
    color: $c-grey-6
    opacity: 0
    font-size: 36px
    --ionicon-stroke-weight: 1px

  &.active:not(.transparent)
    @include blur-bg
  
  &.active
    background-color: transparent
    transition: transform .2s ease-out 0s, background-color .3s linear 0s
    transform: scale(1)

    #cursor__text, #cursor__icon
      opacity: 1
</style>
