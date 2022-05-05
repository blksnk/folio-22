<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";

const route = useRoute();

interface RouteMap {
  [path: string]: { element: () => HTMLElement | null; title: string };
}

const routeElementsMap: RouteMap = {
  "/": {
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
    <RouterLink
      v-for="[path, r] of Object.entries(routeElementsMap)"
      class="link hover_underline"
      :to="path"
      :key="path"
      >{{ r.title }}</RouterLink
    >
    <!-- <a class="link" href="/work">Work,&nbsp;</a> -->
  </nav>
</template>

<style lang="sass">

nav
  @include fl-center
  padding-top: 22px
  align-items: baseline
  height: 70px
  position: fixed
  right: 32px
  bottom: 0px

  @media screen and (max-width: 600px)
    right: 22px

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
