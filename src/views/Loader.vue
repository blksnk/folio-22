<template>
  <fixed-frame id="loader" class="dotted">
    <div id="loader__background"></div>
    <div id="loader__progress__container">
      <h1 id="loader__progress">
        <div id="loader__progress__text">
          {{formattedProgress }}
        </div>
      </h1>
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
        // const el = document.getElementById("loader");
        // if (el) {
        //   el.style.pointerEvents = "none";
        //   setTimeout(() => {
        //     el.style.display = "none";
        //   }, 1000);
        // }
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
      ease: Power2.easeInOut,
      onComplete: onLoadingComplete,
    });
    gsap.to(displayProgress, {
      value: apiData.loadingProgress,
      duration: 0.6,
      delay: 0.6,
      ease: Power2.easeInOut,
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

#loader__background
  width: 100%
  height: 100%
  background-color: $c-grey-6
  transform-origin: center left
  transform: scaleX(0)
  z-index: 0
</style>
