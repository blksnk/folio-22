<template>
  <fixed-frame>
    <div class="about">
      <h1>This is an about page</h1>
    </div>
  </fixed-frame>
</template>

<script setup lang="ts">
import FixedFrame from "@/components/FixedFrame.vue";
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
