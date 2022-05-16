<template>
  <fixed-frame id="loader" class="dotted">
    <div id="loader__background"></div>
    <div id="loader__progress__container">
      <h1 id="loader__progress">
        <div id="loader__progress__text">
          {{ formattedProgress }}
        </div>
      </h1>
      <div id="loader__message__container">
        <Transition name="loader__message">
          <span :key="apiData.loadingProgress">{{ apiData.loadingMessage }}</span>
        </Transition>
      </div>
    </div>
  </fixed-frame>
</template>

<script lang="ts" setup>
import { watch, computed, ref, onMounted } from "vue";
import gsap, { Power2 } from "gsap";
import FixedFrame from "@/components/FixedFrame.vue";
import { useApiData } from "@/stores/apiData";
import {
  hideLoaderText,
  hideLoader,
  transitionToTutorial,
} from "@/utils/transition";

const apiData = useApiData();

const displayProgress = ref<number>(apiData.loadingProgress);

const formattedProgress = computed<string>(() => displayProgress.value > 9 ? String(Math.round(displayProgress.value)) : `0${Math.round(displayProgress.value)}`)

const onLoadingComplete = () => {
  if (apiData.loadingProgress === 100) {
    const loader = document.getElementById("loader");
    if (loader) {
      const hideElement = () => {
        apiData.loaderAnimationFinished = true
        setTimeout(() => {
          apiData.showLoader = false
        }, 400)
      }
      hideLoaderText(() => {
        if (apiData.tutorialFinished) {
          hideLoader(hideElement);
        } else {
          transitionToTutorial(() => hideLoader(hideElement));
        }
      });
    }
  }
};

onMounted(() => {
  if (apiData.loaderAnimationFinished) {
    onLoadingComplete();
  }
});

watch(
  () => apiData.loadingProgress,
  () => {
    gsap.to("#loader__background", {
      scaleX: apiData.loadingProgress / 100,
      duration: 0.6,
      delay: 0.6,
      lazy: true,
      overwrite: 'auto',
      ease: Power2.easeInOut,
      onComplete: onLoadingComplete,
    });
    gsap.to(displayProgress, {
      value: apiData.loadingProgress,
      duration: 0.6,
      delay: 0.6,
      overwrite: 'auto',
      ease: Power2.easeOut,
    });
  }
);
</script>

<style lang="sass">
#loader
  background-color: $c-black
  pointer-events: all
  opacity: 1
  @include fl-center

  #loader__progress__container
    @include fl-center
    gap: 12px
    flex-direction: column
    position: absolute
    top: 0
    left: 0
    bottom: 0
    right: 0

    h1
      color: $c-primary
      z-index: 1
      overflow: hidden
      font-weight: 700

    #loader__message__container
      width: max-content
      oveflow: hidden

    span
      font-family: "Canela"
      font-style: italic
      color: $c-white
      mix-blend-mode: difference

#loader__background
  width: 100%
  height: 100%
  background-color: $c-grey-6
  transform-origin: center left
  transform: scaleX(0)
  z-index: 0
</style>
