<script setup lang="ts">
import { useApiData } from "@/stores/apiData";
import { useMouseData } from "@/stores/mouseData";
import { onMounted, watch } from "@vue/runtime-dom";
import { RouterLink, useRoute } from "vue-router";
import AppLogo from "./icons/AppLogo.vue";
import { revealNavbar } from "@/utils/transition";

const apiData = useApiData();
const mouseData = useMouseData();
const route = useRoute();

interface RouteMap {
  [path: string]: { onClick?: () => void | null; title: string };
}

const resetIndexView = () => {
  if (apiData.openWindow) {
    apiData.closeWindow(apiData.openWindow.id);
  }
};

const onHover = (path: string) => {
  console.log("hover");
  if (route.path !== path) {
    mouseData.transparent = true;
    mouseData.showCursor = true;
    mouseData.cursorIcon = undefined;
    mouseData.cursorText = undefined;
  }
};

const onLeave = () => {
  console.log("out");
  mouseData.showCursor = false;
  mouseData.transparent = false;
};

const routeElementsMap: RouteMap = {
  "/index": {
    title: "Index,\xa0",
    onClick: resetIndexView,
  },
  "/info": {
    title: "Information",
  },
};
watch(() => apiData.loaderAnimationFinished, revealNavbar);
</script>

<template>
  <nav>
    <div id="nav__left">
      <router-link to="/index" @click.prevent="resetIndexView">
        <AppLogo />
      </router-link>
      <span id="nav__title">
        <span v-if="!apiData.isMobile">Jean-Nicolas </span>Veigel</span
      >
    </div>
    <div id="nav__links">
      <RouterLink
        v-for="[path, r] of Object.entries(routeElementsMap)"
        :class="{ link: true, hover_underline: true }"
        :to="path"
        :key="path"
        @click="r.onClick"
        @mouseout="onLeave"
        @mouseover="onHover(path)"
        >{{ r.title }}</RouterLink
      >
    </div>
  </nav>
</template>

<style lang="sass">

nav
  @include fl-sb
  // padding-top: 22px
  align-items: center
  height: 70px
  position: fixed
  right: 32px
  left: 32px
  bottom: 0px
  transform: translateY(100px)

  @media screen and (max-width: 600px)
    right: 22px
    left: 22px

  #nav__links
    @include fl-center
    align-items: baseline
    padding-top: 22px
    height: 100%

  #nav__left
    @include fl-center
    // padding-top: 22px
    height: 100%
    gap: 12px


    #nav__title
      color: $c-grey-6
      @include f-nav-link
      font-weight: 700
      text-transform: uppercase
      padding-bottom: 6px

.link
  color: $c-grey-6
  @include f-nav-link

  &.router-link-active
    @include f-nav-link__active
    color: $c-primary

  // &:not(.router-link-active):hover::after
  //   transform: scaleX(1)
  //   transform-origin: center left
  //   // text-decoration: underline
  //   // text-decoration-color: $c-primary
</style>
