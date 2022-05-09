<script setup lang="ts">
import { RouterLink } from "vue-router";
import AppLogo from "./icons/AppLogo.vue";


interface RouteMap {
  [path: string]: { element: () => HTMLElement | null; title: string };
}

const routeElementsMap: RouteMap = {
  "/index": {
    element: () => document.getElementById("page__index"),
    title: "Index,\xa0",
  },
  "/info": {
    element: () => document.getElementById("page__index"),
    title: "Information",
  },
};
</script>

<template>
  
  <nav>
    <div id="nav__left">
      <AppLogo/>
      <span id="nav__title">Jean-Nicolas Veigel</span>
    </div>
    <div id="nav__links">
      <RouterLink
      v-for="[path, r] of Object.entries(routeElementsMap)"
      class="link hover_underline"
      :to="path"
      :key="path"
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
      font-family: 'Canela'
      font-style: italic


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
