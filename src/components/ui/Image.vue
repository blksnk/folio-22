<template>
  <img
    :class="{
      ui__image: true,
      fill: props.fill,
      }"
    :srcset="srcset"
    :sizes="sizes"
    :src="defaultSrc"
    alt=""
    ref="imgRef"
  />
</template>

<script setup lang="ts">
import { ImageFormats } from "@/utils/api.types";
import { computed, ref } from "vue";

interface ImageProps {
  sources: ImageFormats;
  alt?: string;
  fill: boolean;
}

const imgRef = ref<HTMLImageElement>();

const props = defineProps<ImageProps>();

const defaultSrc = ref(props.sources.large.url);

const srcSetDefs = computed(() =>
  Object.values(props.sources)
    .map(({ width, url }) => ({ width, url }))
    .sort((a, b) => a.width - b.width)
);

const srcset = computed(() =>
  [...srcSetDefs.value]
    .sort((a, b) => a.width - b.width)
    .map(({ width, url }) => `${url} ${width}w`)
    .join(",\n")
);

const sizes = computed(() =>
  srcSetDefs.value
    .map(({ width }, index) =>
      index < srcSetDefs.value.length - 1
        ? `(max-width: ${width}px) ${width}px`
        : `${width}px`
    )
    .join(",\n")
);
</script>

<style lang="sass">
.ui__image
  image-rendering: crisp-edges
  image-rendering:  -webkit-optimize-contrast
  width: 100%
  height: 100%
  object-fit: contain
  object-position: center center
  user-select: none
  pointer-events: none
  transform: translateY(20.5px) scale(1)
  transition: transform .6s ease-in-out 0s

  &.fill
    transform: translateY(0px) scale(1.1)
    transition: transform .6s ease-out 0s
</style>
