import { formatMedia } from "./api";
import { ImageResponse_Raw, ImageFormats } from "./api.types";
import { RectProps } from "./visual.types";
const API_URL = import.meta.env.VITE_API_URL;

const createImage = () => {
  const i = document.createElement("img");
  return i;
};

const createRandomRect = (
  imgWidth: number,
  imgHeight: number,
  maxSize = 600,
  minSize = 150
) => {
  const ratio = imgWidth / imgHeight;
  const width = Math.max(
    minSize,
    Math.round(Math.random() * (maxSize * ratio) * 1.2)
  );
  const height = Math.max(
    minSize,
    Math.round(Math.random() * (maxSize * ratio) * 1.5)
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

  console.log(sorted);

  return sorted;
};

export const preloadImage = async (
  imgId: number
): Promise<ImageFormats | null> => {
  const url = `${
    API_URL || "https://art-folio-api.herokuapp.com/api/"
  }upload/files/${imgId}`;
  try {
    const res = await fetch(url, { method: "GET" });
    const imgData = await res.json();
    console.log(imgData);
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

const computeBoundingRect = (rects: RectProps[]) => {};
