import { clamp } from "@/utils/math";
import { Project, ProjectMedia } from "@/utils/api.types";
import {
  Vector2,
  Transform,
  Boundary,
  WindowPosition,
  WindowData,
  ProjectMediaWindows,
} from "@/utils/layout.types";
import { root } from "postcss";

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
    height: 1,
    width: 1,
  };

  const isTopWindow = index % 2 === 0;
  const ratio = prevWindowPos.width / prevWindowPos.height;

  const top = isTopWindow ? 0 : prevWindowPos.bottom + margin / ratio;
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
  ratios: number[],
  baseWindowSize: Vector2
): WindowPosition[] => {
  const windowSizes: Vector2[] = [];
  const windowPositions: WindowPosition[] = [];
  ratios.forEach((ratio, index) => {
    const currentWindowSize = generateWindowSize(ratio, baseWindowSize);
    const position = generateWindowPosition(
      currentWindowSize,
      windowPositions,
      index,
      baseWindowSize.x / 6
    );
    windowSizes.push(currentWindowSize);
    windowPositions.push(position);
  });

  // apply random offset every column
  for (let i = 2; i < windowPositions.length; i += 2) {
    let randomOffset = Math.floor(Math.random() * 300);
    if (Math.round(Math.random())) {
      randomOffset *= -1;
    }
    windowPositions[i].top += randomOffset;
    if (windowPositions[i + 1]) {
      windowPositions[i + 1].top += randomOffset;
    }
  }

  return windowPositions;
};

export const createProjectWindows = (
  projects: Project[],
  baseWindowSize: Vector2
): WindowData[] => {
  // const windows = [];
  const positions = generateWindowPositions(
    projects.map(({ thumbnail }) => thumbnail.original.aspectRatio),
    baseWindowSize
  );
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

const generateMediaWindowPosition = (
  currentMediaSize: Vector2,
  offsetX: number,
  centerY: number,
  margin: number
): Boundary => {
  const left = offsetX + margin;
  const top = centerY; //- currentMediaSize.y;
  return {
    left,
    right: left + currentMediaSize.x,
    top,
    bottom: top + currentMediaSize.y,
  };
};

export const createMediaWindows = (
  rootWindow: WindowData,
  projectMedias: ProjectMedia[],
  baseWindowSize: Vector2
): WindowData[] => {
  // align media windows hozirontally with project window
  if (projectMedias.length < 1) {
    return [];
  }
  const rootWindowSize = generateWindowSize(
    rootWindow.thumbnail.original.aspectRatio,
    baseWindowSize
  );
  const margin = baseWindowSize.x / 6;
  let offsetX =
    rootWindow.initialPosition.x +
    rootWindowSize.x * projectMedias[0].media.original.aspectRatio +
    margin;
  const centerY = rootWindow.initialPosition.y; //  + rootWindowSize.y / 2;
  const mediaWindows = projectMedias.map((media) => {
    console.warn("offsetX: ", offsetX);
    const size = generateWindowSize(
      media.media.original.aspectRatio,
      baseWindowSize
    );
    const position = generateMediaWindowPosition(
      size,
      offsetX,
      centerY,
      margin
    );
    // update offsetX with latest media window position
    offsetX = position.right;
    // generate WindowData
    const pos = { x: position.left, y: position.top };
    const t = { ...pos, scale: 1 };
    return {
      transform: t,
      targetTransform: t,
      transformPreZoom: pos,
      title: media.title,
      id: media.uid,
      selected: false,
      thumbnail: media.media,
      initialPosition: pos,
      open: false,
      hidden: true,
    };
  });
  return mediaWindows;
};

export const createAllProjectsMediaWindows = (
  projects: Project[],
  windows: WindowData[],
  baseWindowSize: Vector2
): ProjectMediaWindows[] =>
  projects.map(({ media, uid }, index) => {
    return {
      projectUid: uid,
      mediaWindows: createMediaWindows(windows[index], media, baseWindowSize),
    };
  });

export const isMediaWindow = (windowId: string) => windowId.includes("media");
