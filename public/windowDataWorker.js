const generateWindowSize = (
  aspectRatio,
  baseSize
) => {
  const size = {
    x: 0,
    y: 0,
  };
  // show whole image by compensating for tab bar
  size.x = aspectRatio > 1 ? baseSize.x * aspectRatio + 2 : baseSize.x + 2;
  size.y = aspectRatio > 1 ? baseSize.y + 44 : baseSize.y / aspectRatio + 44;
  return size;
};

const generateWindowPosition = (
  currentWindowSize,
  windowPositions,
  index,
  margin
) => {
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

const generateWindowPositions = (
  ratios,
  baseWindowSize
) => {
  const windowSizes = [];
  const windowPositions = [];
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

const generateRandomOffset = () => {
  let randomOffset = Math.floor(Math.random() * 300);
  if (Math.round(Math.random())) {
    randomOffset *= -1;
  }
  return randomOffset;
};

const createProjectWindows = (
  projects,
  baseWindowSize
) => {
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
  currentMediaSize,
  offsetX,
  rootWindowPos,
  rootWindowSize,
  margin,
  prevMediaSize
) => {
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

const createMediaWindows = (
  rootWindow,
  projectMedias,
  baseWindowSize
) => {
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

  const sizes = [];

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

const createAllProjectsMediaWindows = (
  projects,
  windows,
  baseWindowSize
) =>
  projects.map(({ media, uid }, index) => {
    return {
      projectUid: uid,
      mediaWindows: createMediaWindows(windows[index], media, baseWindowSize),
    };
  });

onmessage = (e) => {
  const {projects, baseWindowSize} = e.data
  const p = JSON.parse(projects)
  const bws = JSON.parse(baseWindowSize)
  const projectWindows = createProjectWindows(p, bws)
  postMessage({ progress: 50, projectWindows })
  const mediaWindows = createAllProjectsMediaWindows(p, projectWindows, bws)
  postMessage({ progress: 90, mediaWindows })
}