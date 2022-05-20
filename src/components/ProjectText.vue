<template>
  <div id="project__text__container" :class="{ display }">
    <div id="project__text" :class="{ open }">
      <div class="inner" v-html="displayText"></div>
    </div>
    <button
      @click="open = !open"
      id="project__text__info"
      :title="open ? 'close info' : 'show info'"
      :class="{ open, display }"
      @mouseover="onHover"
      @mouseleave="onLeave"
    >
      <ion-icon :name="icon" id="project__text__info__icon"></ion-icon>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { useApiData } from "@/stores/apiData";
import { useMouseData } from "@/stores/mouseData";
import { ref, computed } from "@vue/reactivity";
import { marked } from "marked";

const apiData = useApiData();
const mouseData = useMouseData();

const open = ref(false);

const icon = computed<string>(() =>
  open.value ? "close-sharp" : "information-sharp"
);

const onHover = () => {
  mouseData.showCursor = true;
  mouseData.cursorIcon = icon.value;
};

const onLeave = () => {
  mouseData.showCursor = false;
};

const selectedProjectText = computed<string | undefined>(
  () =>
    apiData.projects.find(({ uid }) => uid === apiData.openWindow?.id)?.texts[0]
      ?.content
);

const displayText = computed(() => marked(selectedProjectText.value || ""));
const display = computed(() => open && selectedProjectText.value !== undefined);
</script>

<style lang="sass">
#project__text__container
  position: absolute
  bottom: 32px
  right: 32px
  z-index: 10
  transform-origin: bottom right
  transform: scale(0)
  opacity: 0
  transition: transform 0.3s ease-in 0s, opacity 0.3s linear 0s

  @media screen and (max-width: 600px)
    bottom: 22px
    right: 22px

  &.display
    transform: scale(1)
    opacity: 1
    transition: transform 0.3s ease-out 0.6s, opacity 0.3s linear 0.6s
    

  #project__text
    @include blur-bg
    @include bordered
    border-width: 1px
    border-color: $c-grey-4
    max-width: 360px
    padding: 12px
    transform-origin: bottom right
    transition: transform .3s ease-in
    transform: scale(0)

    &.open
      transform: scale(1)
      transition: transform .5s ease-out

    // margin-bottom: 18px

  #project__text__info
    @include fl-center
    height: 36px
    width: 36px
    position: absolute
    bottom: -18px
    right: -18px
    border-radius: 100%
    cursor: pointer
    background-color: $c-primary
    transition: background-color .3s linear

    #project__text__info__icon
      font-size: 16px

    &:not(.open).display
      @include glowing

    &:not(.open) #project__text__info__icon
        color: $c-white

    &.open
      @include blur-bg
      @include bordered
      border-radius: 100%

      #project__text__info__icon
        color: $c-primary


.fade-enter-active, .fade-leave-active
  transition: opacity .5s linear 0s

.fade-enter-from, .fade-leave-to
  opacity: 0

.scale-enter-active
  transition: transform .6s ease-out 0s

.scale-leave-active
  transition: transform .3s ease-in 0s

.scale-enter-from, .scale-leave-to
  transform: scale(0, 0)
</style>
