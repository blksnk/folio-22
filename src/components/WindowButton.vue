<template>
  <button
    :class="{
      window__btn: true,
      enabled: props?.enabled,
      active: props?.active,
    }"
    :data-content="props.active ? props.activeText : props.text"
    @click="emit('click')"
  ></button>
</template>

<script setup lang="ts">
import { defineEmits } from "vue";
interface WindowButtonProps {
  enabled?: boolean;
  active?: boolean;
  text: string;
  activeText?: string;
}

const props = defineProps<WindowButtonProps>();
const emit = defineEmits([ "click" ]);

</script>

<style lang="sass">
.window__btn
  @include fl-center
  justify-content: flex-start
  position: relative
  height: 18px
  width: 60px
  border-radius: 9px
  border: none
  overflow: hidden
  -wekit-overflow: hidden
  clip-path: border-box
  background: none

  &::before
    @include fl-center
    content: attr(data-content)
    position: absolute
    top: 0
    right: 0
    height: 18px
    border-radius: 9px
    background-color: $c-grey-1
    padding: 0px 21px 0px 6px
    transform: translateX(calc(100% - 18px))
    transition: transform .3s ease-out 0s
    font-family: "Neue"
    font-size: 12px
    line-height: 12px
    font-weight: 400
    color: $c-grey-6
    text-transform: uppercase

  &::after
    content: ""
    position: absolute
    top: 0
    right: 0
    height: 18.2px
    width: 18.2px
    border-radius: 50%
    background-color: $c-grey-6
    transform: scale(1)
    transition: background-color .3s linear 0s, transform .3s ease-out 0s


  span
    opacity: 0
    font-family: "Neue"
    font-size: 12px
    line-height: 12px
    height: 12px
    font-weight: 400
    color: $c-grey-6
    pointer-events: none
    text-transform: uppercase

  &.enabled:hover span
    opacity: 1

  &.enabled::after
    background-color: $c-green

  &.enabled:hover::after
    transform: scale(0.6666)

  &.enabled:hover::before
    cursor: pointer
    transform: translateX(0)

  &.active
    width: 67px
    
  &.active::after
    background-color: $c-primary
    
</style>