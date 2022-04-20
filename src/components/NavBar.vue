<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <nav>
    <RouterLink class="link" to="/">Index,&nbsp;</RouterLink>
    <!-- <RouterLink class="link" to="/work">Work,&nbsp;</RouterLink> -->
    <RouterLink class="link" to="/info">Information</RouterLink>
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
  position: relative
  @include f-nav-link

  &::after
    position: absolute
    content: ""
    bottom: -2px
    left: 0
    background-color: $c-primary
    height: 1px
    width: 100%
    transform: scaleX(0)
    transition: transform .3s ease-in
    transform-origin: center right

  &.router-link-active
    @include f-nav-link__active
    color: $c-primary

  &:not(.router-link-active):hover::after
    transform: scaleX(1)
    transform-origin: center left
    // text-decoration: underline
    // text-decoration-color: $c-primary
</style>
