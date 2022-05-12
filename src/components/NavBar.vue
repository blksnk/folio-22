<script setup lang="ts">
import { useApiData } from "@/stores/apiData";
import { RouterLink } from "vue-router";
import AppLogo from "./icons/AppLogo.vue";

const apiData = useApiData()

interface RouteMap {
  [path: string]: { onClick?: () => void | null; title: string };
}

const resetIndexView = () => {
  console.log('aaaaa')
  if(apiData.openWindow) {
    apiData.closeWindow(apiData.openWindow.id)
  }
}

const routeElementsMap: RouteMap = {
  "/index": {
    title: "Index,\xa0",
    onClick: resetIndexView
  },
  "/info": {
    title: "Information",
  },
};
</script>

<template>
  
  <nav>
    <div id="nav__left">
      <router-link to="/index" @click.prevent="resetIndexView">
        <AppLogo/>
      </router-link>
      <span id="nav__title">Jean-Nicolas Veigel</span>
    </div>
    <div id="nav__links">
      <RouterLink
      v-for="[path, r] of Object.entries(routeElementsMap)"
      class="link hover_underline"
      :to="path"
      :key="path"
      @click="r.onClick"
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
      font-weight: 700
      text-transform: uppercase

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
