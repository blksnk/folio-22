import { Store } from "pinia";
import qs from "qs";
import {
  Project,
  ProjectMedia,
  ProjectText,
  uid,
  ImageFormat,
  ImageFormats,
  ProjectType,
  ProjectsResponse_Raw,
  Project_Raw,
  ProjectTag_Raw,
  ProjectText_Raw,
  ProjectType_Raw,
  ProjectMedia_Raw,
  ImageResponse_Raw,
  ImageFormat_Raw,
} from "./api.types";

const API_URL = import.meta.env.VITE_API_URL;

export type ProjectTag = {
  uid: string;
  title: string;
};

export const client = async (endpoint: string) => {
  try {
    const url = `${
      API_URL || "https://art-folio-api.herokuapp.com/api/"
    }${endpoint}`;
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

export const fetchProjects = async (): Promise<ProjectsResponse_Raw> =>
  (await client(`projects?${projectQuery}`)) as ProjectsResponse_Raw;

export const extractProjectType = ({
  data,
}: {
  data: ProjectType_Raw["data"];
}): ProjectType => ({ name: data.attributes.name, id: data.attributes.typeId });

export const formatImageFormat = (format: ImageFormat_Raw): ImageFormat => {
  const { height, width, ext, path, size, url } = format;
  return {
    height,
    width,
    aspectRatio: width / height,
    ext,
    path,
    size,
    url,
  };
};

export const formatMedia = ({
  data,
}: {
  data: ImageResponse_Raw;
}): ImageFormats => {
  const formats = data.attributes.formats;
  return {
    ...Object.fromEntries(
      Object.entries(formats).map(([key, value]) => {
        return [key, formatImageFormat(value)];
      })
    ),
    original: formatImageFormat(data.attributes),
  } as ImageFormats;
};

export const formatTags = ({
  data,
}: {
  data: ProjectTag_Raw[];
}): ProjectTag[] =>
  data.map(({ attributes }) => ({
    title: attributes.title,
    uid: attributes.uid,
  }));

export const formatProjectMedias = ({
  data,
}: {
  data: ProjectMedia_Raw[];
}): ProjectMedia[] =>
  data.map(({ attributes }) => ({
    media: formatMedia(attributes.media),
    title: attributes.title as string,
    uid: attributes.uid as uid,
  }));

export const formatProjectTexts = ({
  data,
}: {
  data: ProjectText_Raw[];
}): ProjectText[] =>
  data.map(({ attributes }) => ({
    title: attributes.title,
    content: attributes.content,
    uid: attributes.uid,
  }));

export const formatProjects = (projects: Project_Raw[]): Project[] => {
  return projects
    .map(({ attributes }) => {
      const { title, uid, type, thumbnail, index, tags, media, texts } =
        attributes;
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
    console.log(projects);
    const formattedProjects = formatProjects(projects.data);

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
