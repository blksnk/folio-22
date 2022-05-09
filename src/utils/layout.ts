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
): Transform => {
  const x = transform.x - windowCenter.x;
  const y = transform.y - windowCenter.y; // offset to center window in frame;
  const scale = transform?.scale || 1;
  return { x, y, scale };
  // return `transform: translate3d(${x}px, ${y}px, 0px) scale(${scale}, ${scale})`;
};

export const createTransformString = (t: Transform): string =>
  `translate3d(${t.x}px, ${t.y}px, 0px) scale(${t.scale}, ${t.scale})`;

export const createWindowWrapperRotation = (velocity: Vector2) => {
  const rotationX = clamp(velocity.y / ROTATION_DAMPENING, -1, 1);
  const rotationY = clamp(-velocity.x / ROTATION_DAMPENING, -1, 1);
  const rotation = [
    rotationX.toFixed(6),
    rotationY.toFixed(6),
    0,
    ROTATION_AMOUNT,
  ].join(", ");
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
  size.x = aspectRatio > 1 ? baseSize.x * aspectRatio + 2 : baseSize.x + 2;
  size.y = aspectRatio > 1 ? baseSize.y + 44 : baseSize.y / aspectRatio + 44;
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
  return true;
};

export const keepInBoundaries = (
  translatePosition: Vector2,
  bounds: Boundary
): void => {};

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

  const randomOffset = generateRandomOffset();
  const top = isTopWindow
    ? randomOffset
    : prevWindowPos.bottom +
      margin +
      (currentWindowSize.y - prevWindowPos.height) / 2;
  const bottom = top + currentWindowSize.y;
  const left = isTopWindow
    ? prevWindowPos.right +
      margin +
      (currentWindowSize.x - prevWindowPos.width) / 2
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
      96
    );
    windowSizes.push(currentWindowSize);
    windowPositions.push(position);
  });
  return windowPositions;
};

const generateRandomOffset = (): number => {
  let randomOffset = Math.floor(Math.random() * 300);
  if (Math.round(Math.random())) {
    randomOffset *= -1;
  }
  return randomOffset;
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
  const windows = projects.map(({ title, uid, thumbnail, tags }, index) => {
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
      tags,
    };
  });
  return windows;
};

const generateMediaWindowPosition = (
  currentMediaSize: Vector2,
  offsetX: number,
  rootWindowPos: Vector2,
  rootWindowSize: Vector2,
  margin: number,
  prevMediaSize: Vector2
): Boundary => {
  const left = offsetX + margin + (currentMediaSize.x - prevMediaSize.x) / 2;
  // const top = rootWindowPos.y + (rootWindowSize.y / 2 - currentMediaSize.y / 2);
  const alignedToBottom =
    rootWindowPos.y + (rootWindowSize.y / 2 - currentMediaSize.y / 2);
  const top = alignedToBottom + (rootWindowPos.y - alignedToBottom); // + generateRandomOffset();
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
  const margin = 96;
  let offsetX = rootWindow.initialPosition.x + rootWindowSize.x;

  const firstWindowSize = generateWindowSize(
    projectMedias[0].media.original.aspectRatio,
    baseWindowSize
  );
  const diffX = (firstWindowSize.x - rootWindowSize.x) / 2;
  offsetX += diffX;

  const sizes: Vector2[] = [];

  const mediaWindows = projectMedias.map((media, index) => {
    const size = generateWindowSize(
      media.media.original.aspectRatio,
      baseWindowSize
    );
    const position = generateMediaWindowPosition(
      size,
      offsetX,
      rootWindow.initialPosition,
      rootWindowSize,
      margin,
      sizes[index - 1] || size
    );
    // update offsetX with latest media window position
    offsetX = position.right;
    sizes.push(size);
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

export const computeZoomTarget = (windowSize: Vector2, margin = 300) => {
  const { x, y } = windowSize;
  const widthRatio = window.innerWidth / (x + margin);
  const heightRatio = window.innerHeight / (y + margin + 46);
  return Math.min(heightRatio, widthRatio);
};

export const px = (n: number | string) => n + "px";
