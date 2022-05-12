<template>
  <fixed-frame id="page__info" class="dotted">
    <clipped-image />

    <div id="about__content" :style="contentStyle">
      <h1>Jean-Nicolas Veigel</h1>
      <h2>Paris-area&#8212;<em>based</em></h2>
      <h2>Creative Developer</h2>
      <h2 class="tab">& UX/UI Designer</h2>
      <p class="description">
        I am a junior <em>art director</em> and freelance creative
        <em>web developer</em> since 2019. I was born West Palm Beach, FL and
        now live in and work from Paris, France.
      </p>
      <p>
        I have had the opportunity to work with various clients in the field,
        learning and teaching skills along the way.
      </p>

      <h3 class="about__heading">Work <em>experience</em></h3>
      <div id="jobs" class="table">
        <div class="table__header reversed">
          <span>Year</span>
          <span>Client</span>
          <span>Role</span>
        </div>
        <a
          class="table__row hover_underline__parent reversed"
          v-for="job in jobs"
          target="_blank"
          :title="job.client.name"
          :href="job.client.website"
        >
          <span>{{ job.year }}</span>
          <div>
            <span class="hover_underline">{{ job.client.name }}</span>
          </div>
          <span>{{ job.role }}</span>
        </a>
      </div>
      <h3 class="about__heading">Spoken <em>languages</em></h3>
      <div class="table">
        <div class="table__header reversed">
          <span>Flag</span>
          <span>Language</span>
          <span>Level</span>
        </div>
        <div class="table__row reversed">
          <f-r />
          <span>French</span>
          <span>Native Language</span>
        </div>
        <div class="table__row reversed">
          <e-n />
          <span>English</span>
          <span>Fluent</span>
        </div>
        <div class="table__row reversed">
          <d-e />
          <span>German</span>
          <span>C1</span>
        </div>
        <div class="table__row reversed">
          <e-s />
          <span>Spanish</span>
          <span>B1 </span>
        </div>
        <div class="table__row reversed">
          <j-p />
          <span>Japanese</span>
          <span>A1</span>
        </div>
      </div>
      <h3 class="about__heading">Education</h3>
      <div class="table">
        <div class="table__header reversed">
          <span>Year</span>
          <span>Diploma</span>
          <span>School</span>
        </div>
        <div class="table__row reversed">
          <span>2023</span>
          <span>Art Direction</span>
          <span>Sup de création,<br/>Paris</span>
        </div>
        <div class="table__row reversed">
          <span>2018</span>
          <span>Web Development Bootcamp</span>
          <span>IronHack,<br/>Paris</span>
        </div>
        <div class="table__row reversed">
          <span>2018</span>
          <span>DUT Business & Marketing</span>
          <span>IUT Robert Schuman,<br/>Strasbourg</span>
        </div>
        <div class="table__row reversed">
          <span>2017</span>
          <span>Baccalauréat ES</span>
          <span>Gymnase Jean Sturm,<br/>Strasbourg</span>
        </div>
      </div>
      <h2 class="about__heading">Let's make<br /><em>something great</em></h2>
      
      <a
        href="mailto:hello@genmetsu.art"
        target="_blank"
        class="contact__bubble hover_underline__parent m"
        id="b_0"
      >
        <span class="hover_underline">email</span>
      </a>
      <a
        href="tel:+33658238758"
        class="contact__bubble hover_underline__parent s"
        id="b_1"
      >
        <span class="hover_underline">call me</span>
      </a>
      <a
        href="https://instagram.com/chxmpetre"
        target="_blank"
        class="contact__bubble hover_underline__parent l"
        id="b_2"
      >
        <span class="hover_underline">instagram</span>
      </a>
      <a
        href="https://linkedin.com/in/jn-veigel/"
        target="_blank"
        class="contact__bubble hover_underline__parent s"
        id="b_3"
      >
        <span class="hover_underline">linkedin</span>
      </a>
      <div id="credits">
        <span>Design & Code — Myself</span>
      </div>
    </div>
  </fixed-frame>
</template>

<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
import { onMounted, computed } from "vue";
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

const gestureData = useGestureData();

onBeforeRouteLeave(onInfoLeave);
onBeforeRouteUpdate(onInfoEnter);

const setScrollMax = () => {
  const content = document.getElementById("about__content");
  if (content) {
    const scrollMaxY = content.offsetHeight - window.innerHeight / 3 - 40;
    gestureData.setScrollMax({ y: scrollMaxY });
  }
};

onMounted(() => {
  onInfoEnter();
  // move to top on mount
  gestureData.targetScrollPos = { x: 0, y: 0 };
  setTimeout(setScrollMax, 500)
});

const contentStyle = computed(
  () => `transform: translateY(${px(-gestureData.scrollPos.y)})`
);
</script>

<style lang="sass" scoped>

#about__visual
  position: fixed
  top: 44px
  @include fl-center

#about__content
  position: relative
  overflow: visible
  min-height: 100vh
  padding: 42px
  display: grid
  grid-template-columns: repeat(10, 1fr)
  grid-auto-rows: min-content
  grid-gap: 12px
  // height: 100%
  // max-height: 100%
  z-index: 2

  @media screen and (max-width: 600px)
    padding: 12px

  *
    grid-row: auto

  h1, h2
    grid-column: 1 / -1
    grid-row: auto
    mix-blend-mode: difference
    z-index: 3
    posititon: relative

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

  // &:last-of-type em
  //   margin-left: calc((100vw - 44px) * 0.1)

  .table
    grid-column: 3 / span 4

    @media screen and (max-width: 600px)
      grid-column: 1 / -1

    span
      @include f-nav-link

    .table__row, .table__header
      display: grid
      color: $c-grey-4
      grid-template-columns: 2fr 2fr 1fr
      margin-top: 12px
      align-items: baseline

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

      .flag
        align-self: center

  #credits
    @include f-project-title__light
    grid-column: 1 / -1
    color: $c-grey-4
    text-align: right

  .contact__bubble
    position: relative
    // margin-top: 12px
    @include bordered
    border-radius: 50%
    @include fl-center

    &:before
      content: ""
      position: absolute
      background-color: $c-grey-6
      top: 0
      bottom: 0
      left: 0
      right: 0
      border-radius: 100%
      transform: scale(0)
      opacity: 0
      transition: transform 0.6s ease-in 0s, opacity 0.6s linear 0s

    &:hover:before
      transform: scale(1)
      opacity: 1
      transition: transform 0.3s ease-out 0s, opacity 0.3s linear 0s

    &:hover span
      color: $c-primary

    &.s
      width: calc((100vw - 44px) * 0.15)
      height: calc((100vw - 44px) * 0.15)
      grid-row: span 2
      grid-column: span 2

      @media screen and (max-width: 950px)
        width: calc((100vw - 44px) * 0.2)
        height: calc((100vw - 44px) * 0.2)

      @media screen and (max-width: 600px)
        width: calc((100vw - 44px) * 0.3)
        height: calc((100vw - 44px) * 0.3)
        grid-row: span 3
        grid-column: span 3

    &.m
      width: calc((100vw - 44px) * 0.2)
      height: calc((100vw - 44px) * 0.2)
      grid-row: span 2
      grid-column: span 2

      @media screen and (max-width: 950px)
        width: calc((100vw - 44px) * 0.25)
        height: calc((100vw - 44px) * 0.25)

      @media screen and (max-width: 600px)
        width: calc((100vw - 44px) * 0.4)
        height: calc((100vw - 44px) * 0.4)
        grid-row: span 4
        grid-column: span 4


    &.l
      width: calc((100vw - 44px) * 0.3)
      height: calc((100vw - 44px) * 0.3)
      grid-row: span 3
      grid-column: span 3

      @media screen and (max-width: 950px)
        width: calc((100vw - 44px) * 0.35)
        height: calc((100vw - 44px) * 0.35)

      @media screen and (max-width: 600px)
        width: calc((100vw - 44px) * 0.5)
        height: calc((100vw - 44px) * 0.5)
        grid-row: span 4
        grid-column: span 4

    &#b_0
      grid-column: 3 / span 2

      @media screen and (max-width: 600px)
        grid-column: 1 / span 3

    &#b_1
      grid-column: 5 / span 2
      grid-row: span 3

      @media screen and (max-width: 600px)
        grid-column: 4 / span 3

    &#b_2
      grid-column: 4 / span 3
      margin-top: -64px

      @media screen and (max-width: 950px)
        margin-top: -32px

      @media screen and (max-width: 600px)
        grid-column: 2 / span 4

    &#b_3
      grid-column: 7 / span 2
      margin-top: -33%

      @media screen and (max-width: 600px)
        grid-column: 6 / span 3

    span
      @include f-nav-link
      text-transform: uppercase
      color: $c-grey-6
      transition: color 0.3s linear 0s
      // mix-blend-mode: exclusion


@media screen and (max-width: 600px)
  h1
    margin-top: 30vh

  h2:last-of-type
    margin-bottom: 64
</style>
