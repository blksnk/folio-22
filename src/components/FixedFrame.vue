<template>
  <div id="overlay__frame">
    <div
      :class="{
        show: displayTitle,
      }"
      id="overlay__frame__title"
    >
      <h1><span class="folder__name">Index // </span>{{ title }}</h1>
      <WindowButton
        enabled
        active
        activeText="close"
        text="open"
        @click="onClick()"
      />
    </div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from "vue";
import WindowButton from "@/components/WindowButton.vue";

interface FixedFrameProps {
  displayTitle?: boolean;
  title?: string;
}

defineProps<FixedFrameProps>();

const emit = defineEmits(["close"]);

const onClick = () => emit("close");
</script>

<style lang="sass">
#overlay__frame
  position: fixed
  top: 20px
  bottom: 70px
  left: 20px
  right: 20px
  border: $b-width solid $c-grey-6
  border-radius: 12px
  overflow: hidden
  -webkit-overflow: hidden
  clip-path: border-box

  #overlay__frame__title
    @include fl-sb
    position: absolute
    top: 0
    left: 0
    right: 0
    padding: 12px
    background-color: $c-grey-6
    z-index: 100
    transform: translateY(-48px)
    transition: transform .2s ease-in

    &.show
      transform: translateY(0px)
      transition: transform .4s ease-out

    h1
      @include f-project-title
      color: $c-grey-1
      transition: opacity .6s linear
      user-select: none
      -webkit-user-select: none
      cursor: default

      .folder__name
        @include f-project-title__light
        color: $c-grey-3

  @media screen and (max-width: 600px)
    top: 10px
    left: 10px
    right: 10px
</style>
