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
      <div id="jobs" class="table" @mouseleave="hideCursor">
        <div class="table__header reversed">
          <span>Year</span>
          <span>Client</span>
          <span>Role</span>
        </div>
        <a
          class="table__row hover_underline__parent reversed job__row"
          v-for="job in jobs"
          target="_blank"
          :title="job.client.name"
          :href="job.client.website"
          @mouseenter="showCursor('arrow-redo-outline')"
        >
          <span>{{ job.year }}</span>
          <div>
            <span class="hover_underline">{{ job.client.name }}</span>
          </div>
          <span>{{ job.role }}</span>
        </a>
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
          <span>Art Direction Bachelor</span>
          <span>Sup de création,<br />Paris</span>
        </div>
        <div class="table__row reversed">
          <span>2018</span>
          <span>Web Development Bootcamp</span>
          <span>IronHack,<br />Paris</span>
        </div>
        <div class="table__row reversed">
          <span>2018</span>
          <span>DUT Business & Marketing</span>
          <span>IUT Robert Schuman,<br />Strasbourg</span>
        </div>
        <div class="table__row reversed">
          <span>2017</span>
          <span>Baccalauréat ES</span>
          <span>Gymnase Jean Sturm,<br />Strasbourg</span>
        </div>
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
      <h3 class="about__heading">Honed <em>skills</em></h3>
      <div class="table skills">
        <div class="table__row reversed no__gap">
          <div class="table__header reversed no__gap">
            <span>Category</span>
          </div>
          <div class="table__header reversed no__gap">
            <span>Skill</span>
          </div>
          <template v-for="{ cat, skills } in allSkills">
            <template v-for="(skill, index) in skills">
              <span v-if="index === 0" class="skill__cat">{{ cat }}</span>
              <span class="skill">{{ skill }}</span>
            </template>
          </template>
        </div>
      </div>
      <h2 class="about__heading" id="contact__title">
        Let's make<br /><em>something great</em>
      </h2>
      <a
        href="mailto:hello@genmetsu.art"
        target="_blank"
        class="contact__item c_l hover_underline__parent"
        id="contact__mail"
        @mouseenter="showCursor('mail-unread-outline')"
        @mouseleave="hideCursor"
      >
        <span class="underline">hello@genmetsu.art</span>
      </a>
      <a
        href="tel:+33658238758"
        class="contact__item c_r hover_underline__parent"
        id="contact__phone"
        @mouseenter="showCursor('call-outline')"
        @mouseleave="hideCursor"
      >
        <span class="underline">+33 6 58 23 87 58</span>
      </a>
      <a
        href="https://instagram.com/chxmpetre"
        target="_blank"
        class="contact__item c_l hover_underline__parent"
        id="contact__instagram"
        @mouseenter="showCursor('logo-instagram')"
        @mouseleave="hideCursor"
      >
        <span class="underline">Instagram</span>
      </a>
      <a
        href="https://linkedin.com/in/jn-veigel/"
        target="_blank"
        class="contact__item c_r hover_underline__parent"
        id="contact__linkedin"
        @mouseenter="showCursor('logo-linkedin')"
        @mouseleave="hideCursor"
      >
        <span class="underline">LinkedIn</span>
      </a>
      <div id="credits">
        <span>Projects, Design & Code — Jean-Nicolas Veigel ©2022</span>
      </div>
    </div>
  </fixed-frame>
</template>

<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
import { onMounted, computed, onBeforeUnmount } from "vue";
import FixedFrame from "@/components/FixedFrame.vue";

import { px } from "@/utils/layout";
import ClippedImage from "@/components/ClippedImage.vue";
import { useGestureData } from "@/stores/gestureData";

import { jobs, allSkills } from "@/utils/aboutData";
import ES from "@/components/icons/flags/ES.vue";
import DE from "@/components/icons/flags/DE.vue";
import EN from "@/components/icons/flags/EN.vue";
import FR from "@/components/icons/flags/FR.vue";
import JP from "@/components/icons/flags/JP.vue";
import { onInfoEnter, onInfoLeave } from "@/utils/transition";
import { useMouseData } from "@/stores/mouseData";

const gestureData = useGestureData();
const mouseData = useMouseData();
let observer: IntersectionObserver | null = null;

onBeforeRouteLeave(onInfoLeave);
onBeforeRouteUpdate(onInfoEnter);

const setScrollMax = () => {
  const content = document.getElementById("about__content");
  if (content) {
    const scrollMaxY = content.offsetHeight - window.innerHeight + 104;
    gestureData.setScrollMax({ y: scrollMaxY });
  }
};

const onIntersect = (entries: IntersectionObserverEntry[]) => {
  entries.forEach((entry) => {
    entry.target.classList.toggle("visible", entry.isIntersecting);
  });
};

const createObserver = () => {
  observer = new IntersectionObserver(onIntersect, {
    root: document.getElementById("page__info"),
    rootMargin: "0px",
    threshold: 0,
  });

  const tableRows = document.querySelectorAll(".table__row, .contact__item, .skill, .skill__cat");
  [...tableRows].forEach((row) => observer?.observe(row));
};

const showCursor = (icon = "arrow-redo-outline") => {
  mouseData.showCursor = true;
  mouseData.cursorIcon = icon;
};

const hideCursor = () => {
  mouseData.showCursor = false;
};

onMounted(() => {
  onInfoEnter();
  // move to top on mount
  gestureData.targetScrollPos = { x: 0, y: 0 };
  setTimeout(setScrollMax, 500);
  createObserver();
  window.addEventListener("resize", setScrollMax);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", setScrollMax);
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

    @media screen and (max-width: 750px)
      grid-column: 1 / -1

    span
      @include f-nav-link

    .table__row, .table__header
      display: grid
      color: $c-grey-4
      grid-template-columns: 2fr 2fr 1fr
      margin-top: 12px
      align-items: baseline
    
      &:not(.no__gap)
        column-gap: 12px
        row-gap: 12px

      &.reversed
        grid-template-columns: 1fr 2fr 2fr

    .table__header
      border-bottom: 1px solid $c-grey-6
      padding-bottom: 12px
      color: $c-grey-6

    .table__row
      transition: color .2s linear 0s
      overflow: hidden

      .table__header
        margin-bottom: 12px

      & > *
        transform: translateY(0)
        transition: transform 0.3s ease-out 0.3s,

      &:not(.visible) > *
        transform: translateY(110%)
        transition: transform 0.3s ease-out 0s,

      &.job__row:hover
        color: $c-white

      .flag
        align-self: center

      .skill
        grid-column-start: 2
        margin-top: 3px

        &:not(.visible) span
        transform: translateY(100px)
        transition: color .2s linear 0s, transform 0.3s ease-out 0s

      .skill__cat
        margin-top: 12px
        grid-row: auto / span 2
        grid-column: 1 / span 1

        &:not(.visible) span
        transform: translateY(100px)
        transition: color .2s linear 0s, transform 0.3s ease-out 0s

    &.skills .table__row, &.skills .table__header
      grid-template-columns: auto 1fr

  #credits
    @include f-project-title__light
    grid-column: 1 / -1
    color: $c-grey-4
    text-align: right

  .contact__item
    @include f-nav-link
    color: $c-grey-4
    margin-top: 12px
    margin-bottom: 52px
    width: max-content
    // overflow: hidden

    span
      transition: color .2s linear 0s, transform 0.3s ease-out 0.3s
      transform: translateY(0)

      &:before
        background-color: $c-primary

    &:not(.visible) span
        transform: translateY(100px)
        transition: color .2s linear 0s, transform 0.3s ease-out 0s

    &:hover
      color: $c-white

    &.c_l
      grid-column: 3 / span 2

    &.c_r
      grid-column: 5 / span 2

    &#contact__mail
      word-break: break-word

    @media screen and (max-width: 600px)
      &.c_l
        grid-column: 1 / span 5

      &.c_r
        grid-column: 6 / span 5


@media screen and (max-width: 600px)
  h1
    margin-top: 30vh

  h2:last-of-type
    margin-bottom: 64px
</style>
