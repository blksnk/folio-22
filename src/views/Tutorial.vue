<template>
  <fixed-frame id="tutorial">
    <div id="tutorial__box" :style="boxStyle"></div>

    <div class="tutorial__target__container" :style="currentStepStyle">
      <div class="tutorial__target"></div>
    </div>

    <p id="tutorial__message">
      {{ message }}
    </p>
  </fixed-frame>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watchEffect } from "vue";
import { Vector2, Transform } from "@/utils/layout.types";
import { createTransformString } from "@/utils/layout";
import FixedFrame from "@/components/FixedFrame.vue";
import { useApiData } from "@/stores/apiData";
import { useGestureData, velocity } from "@/stores/gestureData";
import GestureHandler from "@/utils/gesture";
import { storeToRefs } from "pinia";

const apiData = useApiData();
const gestureData = useGestureData()

const gestureDataRefs = storeToRefs(gestureData)

let frameId = 0


type StepTarget = { scale: number } | Vector2;

enum TargetCheckProp {
  x = "x",
  y = "y",
  scale = "scale",
}

type Step = {
  message: string;
  complete: boolean;
  target: Transform;
  targetCheck: TargetCheckProp | TargetCheckProp[];
};

const steps: Step[] = [
  {
    message: "test message",
    complete: false,
    target: { x: 0, y: 0, scale: 1 },
    targetCheck: [TargetCheckProp.x, TargetCheckProp.y],
  },
];

const currentStep = computed<Step | undefined>(() =>
  steps.find(({ complete }) => !complete)
);

const message = computed<string>(() => currentStep.value?.message || "");

const currentStepStyle = computed<{ transform: string }>(() => ({
  transform: createTransformString(
    offsetPosition(currentStep.value?.target || { x: 0, y: 0, scale: 0 })
  ),
}));

const size = computed<Vector2>(() => ({
  x: apiData.baseWindowSize.x / 2,
  y: apiData.baseWindowSize.y / 2,
}));

const centerOffset = ref<Vector2>({
  x: window.innerWidth / 2 - size.value.x / 2 - (apiData.isMobile ? 12 : 22),
  y: window.innerHeight / 2 - size.value.y / 2 - (apiData.isMobile ? 42 : 47),
});

const boxTransform = ref<Transform>({ x: 0, y: 0, scale: 1 });

const offsetPosition = (source: Transform): Transform => ({
  x: centerOffset.value.x + source.x,
  y: centerOffset.value.y + source.y,
  scale: source.scale,
});

const boxPosition = computed<Transform>(() => ({
  x: centerOffset.value.x + boxTransform.value.x,
  y: centerOffset.value.y + boxTransform.value.y,
  scale: boxTransform.value.scale,
}));

const boxStyle = computed(() => ({
  transform: createTransformString(boxPosition.value),
}));

const animate = () => {
  console.log(velocity.x)
  boxTransform.value.x += velocity.x
  boxTransform.value.y += velocity.y
  frameId = requestAnimationFrame(animate)
}

onMounted(() => {
  frameId = requestAnimationFrame(animate)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId)
})
</script>

<style lang="sass">

@keyframes grow
  0%
    transform: scale(0)

  100%
    transform: scale(1)


@mixin appearing
  animation: grow .6s ease-out 0s
  transform-origin: center center


#tutorial
  background-color: $c-black


.tutorial__target__container, #tutorial__box
  position: absolute
  transform-origin: center


#tutorial__box
  width: 250px
  height: 250px
  background: $c-grey-6

  @media screen and (max-width: 600px)
    height: 150px
    width: 150px


.tutorial__target
  @include appearing
  @include dotted
  border: 1px solid $c-grey-3
  transition: border-color .2s linear
  height: 100px
  width: 100px
  border-radius: 50%

  &.reached
    border-color: $c-primary

#tutorial__message
  position: absolute
  bottom: 32px
  left: 0
  right: 0
  text-align: center
  @include f-project-title__light
</style>
