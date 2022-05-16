<template>
  <fixed-frame id="tutorial" displayTitle="How to navigate" :forceShow="!apiData.tutorialFinished" @close="onSkip" buttonText="skip">
    <div id="tutorial__box" :style="boxStyle"></div>

    <div class="tutorial__target__container" :style="currentStepStyle">
      <div class="tutorial__target"></div>
    </div>

    <transition name="fade">
      <p id="tutorial__message">
        {{ message }}
      </p>
    </transition>
  </fixed-frame>
</template>

<script lang="ts" setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  reactive,
  watchEffect,
} from "vue";
import { Vector2, Transform } from "@/utils/layout.types";
import { createTransformString } from "@/utils/layout";
import FixedFrame from "@/components/FixedFrame.vue";
import { useApiData } from "@/stores/apiData";
import { useGestureData, velocity } from "@/stores/gestureData";
import { clamp, diffLessThan } from "@/utils/math";
import { hideTutorial } from "@/utils/transition";

const apiData = useApiData();
const gestureData = useGestureData();


type StepTarget = { scale: number } | Vector2;

enum TargetCheckProp {
  x = "x",
  y = "y",
  scale = "scale",
}

type Step = {
  id: number;
  message: string;
  complete: boolean;
  target: Transform;
  targetCheck: TargetCheckProp[];
};

const steps = ref<Step[]>([
  {
    id: 0,
    message:
      "Drag with your mouse or use finger gestures to navigate.\n\nMove the box to the target.",
    complete: false,
    target: { x: window.innerWidth / 4, y: 0, scale: 0.4 },
    targetCheck: [TargetCheckProp.x, TargetCheckProp.y],
  },
  {
    id: 1,
    message:
      "Drag with your mouse or use finger gestures to navigate.\n\nMove the box to the target.",
    complete: false,
    target: { x: -window.innerWidth / 8, y: -100, scale: 0.4 },
    targetCheck: [TargetCheckProp.x, TargetCheckProp.y],
  },
  {
    id: 2,
    message: "Zoom in and out by pinching or using your mouse wheel.",
    complete: false,
    target: { x: 0, y: 0, scale: 1.8 },
    targetCheck: [TargetCheckProp.scale],
  },
]);

const currentStep = computed<Step | undefined>(() =>
  steps.value.find(({ complete }) => !complete)
);

const tutorialFinished = computed<boolean>(() =>
  steps.value.every(({ complete }) => complete)
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

const getCenterOffset = (boxSize: Vector2): Vector2 => ({
  x: window.innerWidth / 2 - boxSize.x / 2 - (apiData.isMobile ? 12 : 22),
  y: window.innerHeight / 2 - boxSize.y / 2 - (apiData.isMobile ? 42 : 47),
});

const boxTransform = reactive<Transform>({
  x: 0,
  y: 0,
  scale: gestureData.zoomFactor,
});

const offsetPosition = (source: Transform): Transform => {
  const centerOffset = getCenterOffset(size.value);
  return {
    x: centerOffset.x + source.x,
    y: centerOffset.y + source.y,
    scale: source.scale,
  };
};

const boundaries = {
  xMin: (-size.value.x * gestureData.zoomFactor) / 2 + 44,
  xMax: window.innerWidth - size.value.x * gestureData.zoomFactor,
};

const boxPosition = computed<Transform>(() => {
  const centerOffset = getCenterOffset(size.value);
  return {
    x: clamp(centerOffset.x + boxTransform.x, boundaries.xMin, boundaries.xMax),
    y: centerOffset.y + boxTransform.y,
    scale: boxTransform.scale,
  };
});

const boxStyle = computed(() => ({
  transform: createTransformString(boxPosition.value),
}));

const isTargetReached = () => {
  const matching = currentStep.value?.targetCheck.every((prop) =>
    prop === TargetCheckProp.scale
      ? diffLessThan(
          boxTransform[prop],
          currentStep.value?.target[prop] || 1,
          0.6
        )
      : diffLessThan(
          boxTransform[prop],
          currentStep.value?.target[prop] || 0,
          100
        )
  );
  return matching;
};

const transitionToContent = () => {
  hideTutorial(() => {
    setTimeout(() => {
      apiData.showTutorial = false;
      apiData.selectWindow(apiData.allWindows[1].id, false, undefined, 0.4)
    }, 200);
  });
};

const advanceStep = () => {
  if (isTargetReached() && currentStep.value && !currentStep.value?.complete) {
    (
      steps.value?.find(({ id }) => id === currentStep.value?.id) || {
        complete: false,
      }
    ).complete = true;
  }
};

watchEffect(() => {
  if (apiData.loaderAnimationFinished && !tutorialFinished.value) {
    boxTransform.x += velocity.x;
    boxTransform.y += velocity.y;
    boxTransform.scale = gestureData.zoomFactor;
    advanceStep();
  }
});

watchEffect(() => {
  if (tutorialFinished.value && !apiData.tutorialFinished) {
    apiData.tutorialFinished = true;
    transitionToContent();
  }
});

const onSkip = () => {
  apiData.tutorialFinished = true;
  transitionToContent();
}
</script>

<style lang="sass">

@keyframes grow
  0%
    transform: scale(0)

  100%
    transform: scale(1)

@keyframes glow
  0%
    transform: scale(1)
    opacity: 1
  100%
    transform: scale(2)
    opacity: 0

@mixin appearing
  animation: grow .6s ease-out 0s
  transform-origin: center center

@mixin glowing
  &:before
    content: ""
    position: absolute
    top: 0
    left: 0
    bottom: 0
    right: 0
    border-radius: 50%
    z-index: 1
    translate-origin: center
    opacity: 1
    border: 1px solid $c-grey-3

    animation: glow 2s ease-out 0s infinite


#tutorial
  background-color: $c-black


.tutorial__target__container, #tutorial__box
  position: absolute
  transform-origin: center

#tutorial__box, .tutorial__target
  width: 250px
  height: 250px

  @media screen and (max-width: 600px)
    height: 150px
    width: 150px

#tutorial__box
  background: $c-grey-6
  border-radius: $b-radius

.tutorial__target__container
  transition: transform 1s ease-in-out 0s

.tutorial__target
  @include appearing
  @include dotted
  @include glowing
  border: 1px solid $c-grey-3
  // height: 100px
  // width: 100px
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
