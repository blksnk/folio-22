<template>
  <Window
    v-for="window in windows"
    :key="window.id"
    :title="window.title"
    :transform="window.transform"
    :id="window.id"
    :selected="true"
    :thumbnail="window.thumbnail"
    :open="false"
    :zoomFactor="zoomFactor.value"
    :hidden="!show"
    :baseSize="baseWindowSize"
    :screenSize="screenSize"
  />
</template>

<script setup lang="ts">
import { computed, defineProps, ref, watchEffect } from "vue";
import { ScreenDims, Vector2, WindowData } from "@/utils/layout.types";
import Window from "./Window.vue";

interface SelectedProjectWindowProps {
  mediaWindows: WindowData[];
  show: boolean;
  baseWindowSize: Vector2;
  zoomFactor: { value: number };
  screenSize: ScreenDims;
}

const props = defineProps<SelectedProjectWindowProps>();

const windows = ref<WindowData[]>([])


watchEffect(() => {
  if(props.mediaWindows.length === 0 && !props.show) {
    setTimeout(() => {
      windows.value = props.mediaWindows
    }, 650)
  }
  else if (props.mediaWindows.length > 0) {
    windows.value = props.mediaWindows
  }
})




// const windows = computed(() => {
//   const generatedWindows =
// })
</script>
