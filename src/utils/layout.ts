import { clamp } from "@/utils/math";
import { Project } from "@/utils/api.types";
import { WindowData } from "@/utils/layout.types";

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

export interface WindowPosition extends Boundary {
  width: number;
  height: number;
}

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
  size.x = aspectRatio > 1 ? baseSize.x * aspectRatio : baseSize.x;
  size.y = aspectRatio > 1 ? baseSize.y + 41 : baseSize.y / aspectRatio + 41;
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
  return bounds;
};

export const isInBoundaries = (
  translatePosition: Vector2,
  bounds: Boundary
): boolean => {
  console.log(translatePosition, bounds);
  return true;
};

export const keepInBoundaries = (
  translatePosition: Vector2,
  bounds: Boundary
): void => {
  console.log(translatePosition, bounds);
};

const generateWindowPosition = (
  currentWindowSize: Vector2,
  windowPositions: WindowPosition[],
  index: number,
  margin: number
): WindowPosition => {
  const prevWindowPos = windowPositions[windowPositions.length - 1] || {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    height: 0,
    width: 0,
  };
  const isTopWindow = index % 2 === 0;
  const top = isTopWindow ? 0 : prevWindowPos.height + margin;
  const bottom = top + currentWindowSize.y;
  const left = isTopWindow
    ? prevWindowPos.right + margin
    : prevWindowPos.left +
      Math.max(currentWindowSize.x - prevWindowPos.width, 0) / 2;
  const right = left + currentWindowSize.x;

  return {
    top,
    bottom,
    left,
    right,
    width: currentWindowSize.x,
    height: currentWindowSize.y,
  };
};

export const generateWindowPositions = (
  projects: Project[],
  baseWindowSize: Vector2
): WindowPosition[] => {
  const windowSizes: Vector2[] = [];
  const windowPositions: WindowPosition[] = [];
  projects.forEach((project, index) => {
    const currentWindowSize = generateWindowSize(
      project.thumbnail.original.aspectRatio,
      baseWindowSize
    );
    const position = generateWindowPosition(
      currentWindowSize,
      windowPositions,
      index,
      baseWindowSize.x / 8
    );
    // TODO: increment first position by screenSize.center
    windowSizes.push(currentWindowSize);
    windowPositions.push(position);
  });

  return windowPositions;
};

export const createProjectWindows = (
  projects: Project[],
  baseWindowSize: Vector2
): WindowData[] => {
  // const windows = [];
  const positions = generateWindowPositions(projects, baseWindowSize);
  console.log(positions);
  const windows = projects.map(({ title, uid, thumbnail }, index) => {
    const pos = positions[index];

    const initialPosition = {
      x: pos.left,
      y: pos.top,
    };
    const transform = {
      ...initialPosition,
      scale: 1,
    };
    return {
      transform,
      targetTransform: transform,
      initialPosition,
      transformPreZoom: initialPosition,
      title,
      id: uid,
      selected: index === 0,
      thumbnail,
      open: false,
      hidden: false,
    };
  });
  return windows;
};
