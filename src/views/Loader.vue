<template>
  <fixed-frame id="loader" class="dotted">
    <div id="loader__background"></div>
    <h1>{{ Math.round(displayProgress) }}%</h1>
  </fixed-frame>
</template>

<script lang="ts" setup>
import { watch, computed, ref, onMounted } from "vue";
import gsap, { Power2 } from "gsap";
import FixedFrame from "@/components/FixedFrame.vue";
import { useApiData } from "@/stores/apiData";

const apiData = useApiData();

const progress = computed(() =>
  !apiData.indexEnterFinished
    ? 0
    : apiData.loaded
    ? 100
    : apiData.imgsPreloaded
    ? 50
    : 25
);

const displayProgress = ref<number>(progress.value);

const onTweenComplete = () => {
  if (progress.value === 100) {
    const el = document.getElementById("loader");
    gsap.to("#loader", {
      opacity: 0,
      duration: 0.6,
      onComplete: () => {
        apiData.loaderAnimationFinished = true;
        if (el) {
          el.style.pointerEvents = "none";
          setTimeout(() => {
            el.style.display = "none";
          }, 1000);
        }
      },
    });
  }
};

onMounted(() => {
  if (apiData.loaderAnimationFinished) {
    console.log("aaaa");
    onTweenComplete();
  }

})


watch(
  () => progress.value,
  () => {
    console.log("runs");
    gsap.to("#loader__background", {
      scaleX: progress.value / 100,
      duration: 0.6,
      delay: 0.6,
      lazy: true,
      ease: Power2.easeInOut,
      onComplete: onTweenComplete,
    });
    gsap.to(displayProgress, {
      value: progress.value,
      duration: 0.6,
      delay: 0.6,
      ease: Power2.easeInOut,
    });
  }
);
</script>

<style lang="sass">
#loader
  @include fl-center
  background-color: $c-black
  pointer-events: all

  h1
    mix-blend-mode: difference
    position: relative
    z-index: 1

#loader__background
  position: absolute
  top: 0
  left: 0
  right: 0
  bottom: 0
  width: 100%
  background-color: $c-grey-6
  transform-origin: center left
  transform: scaleX(0)
  z-index: 0
</style>
