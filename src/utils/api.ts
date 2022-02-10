import { Store } from "pinia";
import qs from "qs";

const API_URL = import.meta.env.VITE_API_URL;

export interface ImageFormat {
  height: number;
  width: number;
  ext?: string;
  path: string | null;
  size: number;
  url: string | null;
  hash?: string;
  mime?: string;
  name?: string;
  aspectRatio: number;
}

export interface ImageFormats {
  [k: string]: any;
  large: ImageFormat;
  medium: ImageFormat;
  small: ImageFormat;
  thumbnail: ImageFormat;
  original: ImageFormat;
}

export interface ProjectTag {
  uid: string;
  title: string;
}

export const client = async (endpoint: string) => {
  try {
    const url = `${API_URL}/api/${endpoint}`;
    const res = await fetch(url, { method: "GET" });
    return await res.json();
  } catch (e) {
    console.error(e);
    return e;
  }
};

const projectQuery = qs.stringify({
  populate: ["type", "tags", "thumbnail", "media", "texts", "media.media"],
});

export const fetchProjects = async () =>
  await client(`projects?${projectQuery}`);

export const extractProjectType = ({
  data,
}: {
  data: { attributes: { name: string } };
}) => data.attributes.name;

export const formatImageFormat = (format: ImageFormat): ImageFormat => {
  const { height, width, ext, path, size, url } = format;
  return {
    height,
    width,
    aspectRatio: width / height,
    ext,
    path,
    size,
    url: (API_URL as string) + url,
  };
};

export const formatMedia = (media: any) => {
  const formats = media.data.attributes.formats;
  console.log(formats, media)
  return {
    ...Object.fromEntries(
      Object.entries(formats as ImageFormats).map(([key, value]) => {
        return [key, formatImageFormat(value as ImageFormat)];
      })
    ),
    original: formatImageFormat(media.data.attributes),
  };
};

export const formatTags = ({ data }: { data: any[] }): ProjectTag[] =>
  data.map(({ attributes }) => ({
    title: attributes.title,
    uid: attributes.uid,
  }));

export const formatProjectMedias = ({ data }: { data: any[] }) =>
  data.map(({ attributes }) => ({
    media: formatMedia(attributes.media),
    title: attributes.title,
    uid: attributes.uid,
  }));

export const formatProjectTexts = ({ data }: { data: any[] }) =>
  data.map(({ attributes }) => ({
    title: attributes.title,
    content: attributes.content,
  }));

export const formatProjects = (projects: any[]) => {
  console.log(projects);
  return projects
    .map(({ attributes }) => {
      const { title, uid, type, thumbnail, index, tags, media, texts } = attributes;
      return {
        title,
        uid,
        index,
        tags: formatTags(tags),
        texts: formatProjectTexts(texts),
        type: extractProjectType(type),
        media: formatProjectMedias(media),
        thumbnail: formatMedia(thumbnail),
      };
    })
    .sort((a, b) => a.index - b.index);
};

export const loadApi = async () => {
  try {
    const projects = await fetchProjects();
    const formattedProjects = formatProjects(projects.data);
    console.log(formattedProjects);

    // if (storeReference) {
    //   storeReference.$patch({
    //     projects: formattedProjects,
    //   });
    // }

    return { projects: formattedProjects };
  } catch (e) {
    console.error(e);
  }
};
