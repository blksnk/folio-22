<template>
  <div id="overlay__frame">
    <slot></slot>
  </div>
</template>

<style lang="sass">
#overlay__frame
  position: fixed
  top: 20px
  bottom: 70px
  left: 20px
  right: 20px
  border: $b-width solid $c-grey-6
  border-radius: 12px
  overflow: hidden
  -webkit-overflow: hidden
  clip-path: border-box

  @media screen and (max-width: 600px)
    top: 10px
    left: 10px
    right: 10px
</style>
