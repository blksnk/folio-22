<template>
  <div v-if="!props?.hidden" id="debug">
    <code v-if="props.title" id="debug__title">{{ props.title }} <br /> </code>
    <template v-for="(line, index) in lines" :key="index">
      <code>{{ line }}</code>
      <br />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface DebugProps {
  lines: string[] | object[] | string | object | number;
  showIndex?: boolean;
  hidden?: boolean;
  title?: string;
}

const props = defineProps<DebugProps>();

function formatLine(l: string | object): string {
  console.log(typeof l);
  return typeof l === "object" ? JSON.stringify(l) : l;
}

function addIndex(formattedLine: string, index: number) {
  return props.showIndex ? `#${index}: ${formattedLine}` : formattedLine;
}

const lines = computed(() => {
  const l = props.lines;
  if (typeof l === "number") {
    return l;
  }
  if (Array.isArray(l)) {
    return l.map((line, index) => addIndex(formatLine(line), index));
  }
  return [formatLine(l)];
});
</script>

<style lang="sass">

#debug
  position: fixed
  bottom: 20px
  width: 100%
  left: 20px
  user-select: none
  pointer-events: none
  color: red

  #debug__title
    text-decoration: underline

  code
    width: 100%
</style>
