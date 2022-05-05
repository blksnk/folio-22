<template>
  <fixed-frame id="page__info" class="dotted">
    <clipped-image/>
    
    <div id="about__content" :style="contentStyle">
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

      <h3 class="about__heading">Work experience</h3>
      <div id="jobs" class="table">
        <div class="table__header">
          <span>Client</span>
          <span>Role</span>
          <span>Year</span>
        </div>
        <a class="table__row hover_underline__parent" v-for="job in jobs" target="_blank" :title="job.client.name" :href="job.client.website">
          <div>
            <span class="hover_underline">{{job.client.name}}</span>
          </div>
          <span>{{job.role}}</span>
          <span>{{job.year}}</span>
        </a>
      </div>
      <h3 class="about__heading">Spoken languages</h3>
      <div class="table">
        <div class="table__header reversed">
          <span>Flag</span>
          <span>Language</span>
          <span>Level</span>
        </div>
        <div class="table__row reversed">
          <f-r/>
          <span>French</span>
          <span>Native Language</span>
        </div>
        <div class="table__row reversed">
          <e-n/>
          <span>English</span>
          <span>Fluent</span>
        </div>
        <div class="table__row reversed">
          <d-e/>
          <span>German</span>
          <span>C1</span>
        </div>
        <div class="table__row reversed">
          <e-s/>
          <span>Spanish</span>
          <span>B1 </span>
        </div>
        <div class="table__row reversed">
          <j-p/>
          <span>Japanese</span>
          <span>A1</span>
        </div>
      </div>
    </div>
  </fixed-frame>
</template>

<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
import { onMounted, defineProps, computed } from "vue";
import FixedFrame from "@/components/FixedFrame.vue";

import { px } from "@/utils/layout";
import ClippedImage from "@/components/ClippedImage.vue";
import { useGestureData } from "@/stores/gestureData";

import { jobs } from "@/utils/jobs";
import ES from "@/components/icons/flags/ES.vue";
import DE from "@/components/icons/flags/DE.vue";
import EN from "@/components/icons/flags/EN.vue";
import FR from "@/components/icons/flags/FR.vue";
import JP from "@/components/icons/flags/JP.vue";
import { onInfoEnter, onInfoLeave } from "@/utils/transition";

const gestureData = useGestureData()

onBeforeRouteLeave(
  onInfoLeave
);
onBeforeRouteUpdate(onInfoEnter)

onMounted(() => {
  onInfoEnter()
  gestureData.targetScrollPos = {x: 0, y: 0}
}
);

const contentStyle = computed(() => `transform: translateY(${px(-gestureData.scrollPos.y)})`)

</script>

<style lang="sass" scoped>

#about__visual
  position: fixed
  top: 44px
  @include fl-center

#about__content
  position: relative
  min-height: 100vh
  padding: 42px
  display: grid
  grid-template-columns: repeat(10, 1fr)
  grid-auto-rows: min-content
  grid-gap: 12px
  height: 100%
  max-height: 100%
  z-index: 2

  @media screen and (max-width: 600px)
    padding: 12px

  *
    grid-row: auto

  h1, h2
    grid-column: 1 / -1
    grid-row: auto
    mix-blend-mode: difference

    &.tab
      grid-column: 3 / -1
      
      @media screen and (max-width: 600px)
        grid-column: 2 / -1

  h1, h2, h3, p, span
    text-shadow: 1px 2px 24px rgba(12, 12, 12, 1)
  p
    grid-column: 3 / 6
    mix-blend-mode: difference

    @media screen and (max-width: 600px)
        grid-column: 2 / -2

    em
      mix-blend-mode: normal

    &:first-of-type
      margin-top: 64px

  .about__heading
    grid-column: 2 / -1
    margin-top: 64px
    
    @media screen and (max-width: 600px)
        grid-column: 1 / -1

  .table
    grid-column: 3 / span 4
    
    @media screen and (max-width: 600px)
        grid-column: 2 / -1

    span
      @include f-nav-link
    
    .table__row, .table__header
      display: grid
      color: $c-grey-4
      grid-template-columns: 2fr 2fr 1fr
      margin-top: 12px
      align-items: center

      &.reversed
        grid-template-columns: 1fr 2fr 2fr

    .table__header
      border-bottom: 1px solid $c-grey-6
      padding-bottom: 12px
      color: $c-grey-6

    .table__row
      transition: color .2s linear 0s
      
      &:hover
        color: $c-white


      
</style>
