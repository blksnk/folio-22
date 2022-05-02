<template>
  <fixed-frame id="page__about" class="dotted">
      <clipped-image/>
    
    <div id="about__content">
      <h1>Jean-Nicolas Veigel</h1>
      <h2>Paris-area&#8212;<em>based</em></h2>
      <h2>Creative Developer</h2>
      <h2 class="tab">& UX/UI Designer</h2>
      <p class="description">
        I am an junior <em>art director</em> and freelance creative
        <em>web developer</em> since 2019. I was born West Palm Beach, FL and
        now live in and work from Paris, France.
      </p>
      <p>
        I have had the opportunity to work with various clients in the field,
        learning and teaching skills along the way.
      </p>
    </div>
  </fixed-frame>
</template>

<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
import { onMounted, defineProps } from "vue";
import FixedFrame from "@/components/FixedFrame.vue";

import { translateFrame } from "@/utils/layout";
import ClippedImage from "@/components/ClippedImage.vue";
import { useMouseData } from "@/stores/mouseData";

const mouseData = useMouseData()

onBeforeRouteLeave(
  () =>
    new Promise((resolve, reject) => {
      const el = document.getElementById("page__about");
      if (el) {
        console.log(el);
        translateFrame(el, 0);
        setTimeout(() => resolve(true), 600);
      } else resolve(false);
    })
);

onMounted(
  () =>
    new Promise((resolve, reject) => {
      const el = document.getElementById("page__about");
      if (el) {
        console.log(el);
        translateFrame(el, 1);
        setTimeout(() => resolve(true), 600);
      } else resolve(false);
    })
);

</script>

<style lang="sass" scoped>

#about__visual
  position: fixed
  top: 44px
  @include fl-center

#about__content
  position: relative
  min-height: 100vh
  padding: 44px
  display: grid
  grid-template-columns: repeat(10, 1fr)
  grid-auto-rows: min-content
  grid-gap: 12px
  height: 100%
  max-height: 100%
  z-index: 2

  *
    grid-row: auto

  h1, h2
    grid-column: 1 / -1
    grid-row: auto

    &.tab
      grid-column: 3 / -1

  p
    grid-column: 3 / 6

    &:first-of-type
      margin-top: 52px
      
</style>
