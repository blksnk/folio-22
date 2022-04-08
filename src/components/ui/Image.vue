<template>
  <img :srcset="srcset" :sizes="sizes" :src="defaultSrc" alt="" />
</template>

<script setup lang="ts">
import { ImageFormats } from "@/utils/api.types";
import { computed, ref } from "vue";

interface ImageProps {
  sources: ImageFormats;
  alt?: string;
}

const props = defineProps<ImageProps>();

const defaultSrc = ref(props.sources.large.url);

const srcSetDefs = computed(() =>
  Object.values(props.sources)
    .map(({ width, url }) => ({ width, url }))
    .sort((a, b) => a.width - b.width)
);

const srcset = computed(() =>
  srcSetDefs.value.map(({ width, url }) => `${url} ${width}w`).join(",")
);

const sizes = computed(() =>
  srcSetDefs.value
    .map(({ width }, index) =>
      index ? `(max-width: ${width}) ${width}px` : `${width}px`
    )
    .join(",")
);
</script>
