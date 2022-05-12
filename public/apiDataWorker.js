

// API

const client = async (endpoint) => {
  try {
    const url = `https://art-folio-api.herokuapp.com/api/${endpoint}`;
    const res = await fetch(url, { method: "GET" });
    return await res.json();
  } catch (e) {
    console.error(e);
    return e;
  }
};

const projectQuery = "projects?populate[0]=type&populate[1]=tags&populate[2]=thumbnail&populate[3]=media&populate[4]=texts&populate[5]=media.media"

const fetchProjects = async () =>
  (await client(projectQuery));

const extractProjectType = ({
  data,
}) => ({ name: data.attributes.name, id: data.attributes.typeId });

const formatImageFormat = (format) => {
  const { height, width, ext, path, size, url } = format;
  // // preload img
  // const i = new Image();
  // i.src = url;
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

const formatMedia = ({
  data,
}) => {
  const formats = data.attributes.formats;
  return {
    ...Object.fromEntries(
      Object.entries(formats).map(([key, value]) => {
        return [key, formatImageFormat(value)];
      })
    ),
    original: formatImageFormat(data.attributes),
  }
};

const formatTags = ({
  data,
}) =>
  data.map(({ attributes }) => ({
    title: attributes.title,
    uid: attributes.uid,
  }));

const formatProjectMedias = ({
  data,
}) =>
  data.map(({ attributes }) => ({
    media: formatMedia(attributes.media),
    title: attributes.title,
    uid: attributes.uid,
  }));

const formatProjectTexts = ({
  data,
}) =>
  data.map(({ attributes }) => ({
    title: attributes.title,
    content: attributes.content,
    uid: attributes.uid,
  }));

const formatProjects = (projects) => {
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

const loadApi = async () => {
  try {
    const projects = await fetchProjects();
    const formattedProjects = formatProjects(projects.data);

    return { projects: formattedProjects };
  } catch (e) {
    console.error(e);
  }
};

onmessage = async (e) => {
  try {
    const responseData = await loadApi();
    postMessage(responseData)
  }
  catch(e) {
    console.error(e);
    return { projects: [], error: e }
  }
}