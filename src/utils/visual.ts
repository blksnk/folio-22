import { formatMedia } from "./api";
import { ImageResponse_Raw, ImageFormats } from "./api.types";
import { RectProps } from "./visual.types";
const API_URL = import.meta.env.VITE_API_URL;

const createRandomRect = (
  imgWidth: number,
  imgHeight: number,
  maxSize = 600,
  minSize = 100
) => {
  const ratio = imgWidth / imgHeight;
  const width = Math.max(
    minSize,
    Math.round(Math.min(imgWidth, Math.random() * (maxSize * ratio) * 1.5))
  );
  const height = Math.max(
    minSize,
    Math.round(Math.random() * (maxSize * ratio) * 1.2)
  );
  const x = Math.round(Math.random() * (imgWidth - width));
  const y = Math.round(Math.random() * (imgHeight - height));

  return {
    x,
    y,
    width,
    height,
  };
};

export const createRects = (
  count: number,
  imgWidth: number,
  imgHeight: number
) => {
  const rects: RectProps[] = [];
  for (let i = 0; i < count; i++) {
    rects.push(createRandomRect(imgWidth, imgHeight));
  }

  const sorted = rects.sort((a: RectProps, b: RectProps) =>
    a.width * a.height < b.width * b.height ? 1 : -1
  );

  return sorted;
};

export const preloadImage = async (
  imgId: number,
  givenUrl?: string
): Promise<ImageFormats | null> => {
  const url =
    givenUrl ||
    `${
      API_URL || "https://art-folio-api.herokuapp.com/api/"
    }upload/files/${imgId}`;
  try {
    const res = await fetch(url, { method: "GET" });
    const imgData = await res.json();
    const attributes: ImageResponse_Raw = { attributes: imgData, id: imgId };
    const imgFormats = formatMedia({ data: attributes });
    const img = new Image();
    img.src = imgFormats.large.url;

    return imgFormats;
  } catch (e) {
    console.error("Error fetching Image", e);
    return null;
  }
};

export const preloadImg = (url: string): Promise<boolean> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => reject(false);
    img.src = url;
  });

export const computeBoundingRect = (rects: RectProps[]): RectProps => {
  return rects.reduce(
    (acc, rect) => ({
      x: Math.min(acc.x, rect.x),
      width: Math.max(acc.width, rect.x + rect.width),
      y: Math.min(acc.y, rect.y),
      height: Math.max(acc.height, rect.y + rect.height),
    }),
    { x: 10000, width: 0, y: 10000, height: 0 }
  );
};
