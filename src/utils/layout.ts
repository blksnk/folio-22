import { clamp } from "@/utils/math";
import { WindowData } from "@/views/IndexView.vue";

export interface Vector2 {
  [key: string]: number | Vector2;
  x: number;
  y: number;
}

export interface Vector3 extends Vector2 {
  z: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export type Boundary = {
  [k: string]: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export const WINDOW_WIDTH = window.innerWidth < 600 ? 250 : 500;
const ROTATION_AMOUNT = "35deg";
const ROTATION_DAMPENING = 25;

export const getScreenDims = () => ({
  x: window.innerWidth,
  y: window.innerHeight,
  center: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  ratio: window.innerWidth / window.innerHeight,
});

export const createWindowTransformStyle = (
  transform: Transform,
  windowCenter: Vector2
): string => {
  const x = transform.x - windowCenter.x;
  const y = transform.y - windowCenter.y; // offset to center window in frame;
  const scale = transform?.scale || 1;
  return `transform: translate3d(${x}px, ${y}px, 0px) scale(${scale}, ${scale})`;
};

export const createWindowWrapperRotation = (velocity: Vector2) => {
  const rotationX = clamp(velocity.y / ROTATION_DAMPENING, -1, 1);
  const rotationY = clamp(-velocity.x / ROTATION_DAMPENING, -1, 1);
  const rotation = [
    rotationX.toFixed(6),
    rotationY.toFixed(6),
    0,
    ROTATION_AMOUNT,
  ].join(", ");
  console.log(velocity, rotation);
  return `transform: rotate3d(${rotation})`;
};

export const isInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 ||
    rect.left >= 0 ||
    rect.bottom >=
      (window.innerHeight || document.documentElement.clientHeight) ||
    rect.right >= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export const isWindowVisible = (windowId: string | number): boolean => {
  const target = document.getElementById(String(windowId));
  return target === null ? false : isInViewport(target);
};

// create window size based on aspect ratio
export const generateWindowSize = (
  aspectRatio: number,
  baseSize: Vector2
): Vector2 => {
  const size: Vector2 = {
    x: 0,
    y: 0,
  };
  // show whole image by compensating for tab bar
  size.x = aspectRatio > 1 ? baseSize.x * aspectRatio + 41 : baseSize.x;
  size.y = aspectRatio > 1 ? baseSize.y : baseSize.y / aspectRatio + 41;
  return size;
};

// create translate boundaries based on inital window positions and sizes
export const createBoundaries = (
  windows: WindowData[],
  baseWindowSize: Vector2,
  buffer: Vector2 = getScreenDims().center
): Boundary => {
  let bounds = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  // normalize window position to take recentering into account
  const windowPositions = windows.map(({ initialPosition, thumbnail }) => {
    const windowSize = generateWindowSize(
      thumbnail.original.aspectRatio,
      baseWindowSize
    );
    const left = initialPosition.x - windowSize.x / 2;
    const right = left + windowSize.x;
    const top = initialPosition.y - windowSize.y / 2;
    const bottom = top + windowSize.y;
    return {
      top,
      bottom,
      left,
      right,
    };
  });

  console.log(windowPositions, bounds);

  windowPositions.forEach((window) => {
    const top = window.top < bounds.top ? window.top : bounds.top;
    const bottom =
      window.bottom > bounds.bottom ? window.bottom : bounds.bottom;
    const left = window.left < bounds.left ? window.left : bounds.left;
    const right = window.right > bounds.right ? window.right : bounds.right;
    bounds = {
      top,
      bottom,
      left,
      right,
    };
  });

  bounds.top -= buffer.y;
  bounds.bottom += buffer.y;
  bounds.left -= buffer.x;
  bounds.right += buffer.x;
  console.warn(bounds);
  return bounds;
};

export const isInBoundaries = (
  translatePosition: Vector2,
  bounds: Boundary
): boolean => {
  console.log(translatePosition, bounds);
  return true;
};
