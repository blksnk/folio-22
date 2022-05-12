<template>
  <main class="overlay__frame">
    <div
      :class="{
        show: forceShow || show,
        overlay__frame__title: true,
      }"
    >
      <div class="overlay__frame__title__left">
        <h1>
          <span
            @click="onClick()"
            class="folder__name hover_underline"
            v-if="!displayTitle"
          >
            Index //
          </span>
          {{ displayTitle || apiData.openWindow?.title }}
        </h1>
        <div v-if="apiData.openWindow?.tags" class="tags">
          <div
            v-for="tag in apiData.openWindow?.tags"
            :key="tag.uid"
            class="tag"
          >
            {{ tag.title }}
          </div>
        </div>
      </div>

      <WindowButton
        enabled
        active
        :activeText="buttonText || 'close'"
        text="open"
        @click="onClick()"
      />
    </div>
    <slot></slot>
  </main>
</template>

<script setup lang="ts">
import { computed, defineEmits } from "vue";
import WindowButton from "@/components/WindowButton.vue";
import { useApiData } from "@/stores/apiData";
import { useRoute } from "vue-router";

const apiData = useApiData();
const route = useRoute();

interface FixedFrameProps {
  displayTitle?: string;
  forceShow?: boolean;
  buttonText?: string;
}

const show = computed(() =>
  route.path === "/info" ? false : apiData.isWindowOpen
);

defineProps<FixedFrameProps>();

const emit = defineEmits(["close"]);

const onClick = () => emit("close");
</script>

<style scoped lang="sass">
.overlay__frame
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
  // transform: scale(0)
  transform-origin: center center
  transition: opacity .6s linear

  .overlay__frame__title
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
    pointer-events: none

    &.show
      transform: translateY(0px)
      transition: transform .4s ease-out
      pointer-events: all,

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
        transition: color .2s linear

        &:hover
          color: $c-primary

  .overlay__frame__title__left
    @include fl-start

    .tags
      @include fl-start
      transform-origin: top left
      flex-direction: row
      gap: 12px
      width: max-content
      transition: opacity .3s linear 0s

    .tag
      @include f-window-tag
      border: 1px solid $c-grey-1
      padding: 3px 6px
      color: $c-grey-1
      border-radius: 24px
      transition: border-color .3s linear .3s, color .3s linear .6s
      // background-color: rgba(12, 12, 12, .8)

  @media screen and (max-width: 600px)
    top: 10px
    left: 10px
    right: 10px
</style>
