export type uid = string;

export type id = number;

export type DateString = string;

export type dateInfo = {
  createdAt: DateString;
  publishedAt: DateString;
  updatedAt: DateString;
};

export type Project = {
  uid: uid;
  index: number;
  title: string;
  type: ProjectType;
  thumbnail: ImageFormats;
  media: ProjectMedia[];
  tags: ProjectTag[];
  texts: ProjectText[];
};

export type ProjectType = {
  id: string;
  name: string;
};

export type ProjectTag = {
  uid: uid;
  title: string;
};

export type ImageDimensions = {
  height: number;
  width: number;
};

export interface ImageFormat extends ImageDimensions {
  ext: string;
  path?: string;
  size: number;
  url: string;
  hash?: string;
  mime?: MimeType;
  aspectRatio: number;
}

export interface ImageFormats {
  [k: string]: ImageFormat;
  large: ImageFormat;
  medium: ImageFormat;
  small: ImageFormat;
  thumbnail: ImageFormat;
  original: ImageFormat;
}

export type ProjectMedia = {
  uid: uid;
  title: string;
  media: ImageFormats;
};

export type ProjectText = {
  uid: uid;
  title: string;
  content: string;
};

// RAW PROJECT DATA
// types defining raw response from strapi backend

export type ProjectsResponse_Raw = {
  meta: unknown;
  data: Project_Raw[];
};

export type MimeType = string;

export type DateTrackingInfo = {
  createdAt: DateString;
  publishedAt: DateString;
  updatedAt: DateString;
};

export type ProjectType_Raw = {
  data: {
    id: id;
    attributes: {
      createdAt: DateString;
      publishedAt: DateString;
      updatedAt: DateString;
      typeId: uid;
      name: string;
    };
  };
  uid: uid;
  updatedAt: DateString;
};

export type ProjectTag_Raw = {
  id: id;
  attributes: {
    createdAt: DateString;
    publishedAt: DateString;
    updatedAt: DateString;
    title: string;
    uid: uid;
  };
};

export type ProjectText_Raw = {
  id: id;
  attributes: {
    createdAt: DateString;
    publishedAt: DateString;
    updatedAt: DateString;
    title: string;
    content: string;
    uid: uid;
  };
};

export interface ImageFormat_Raw extends ImageDimensions {
  ext: string;
  url: string;
  hash: string;
  mime: MimeType;
  name: string;
  path?: string;
  size: number;
}

export type ImageFormats_Raw = {
  large: ImageFormat_Raw;
  medium: ImageFormat_Raw;
  small: ImageFormat_Raw;
  thumbnail: ImageFormat_Raw;
};

export type ImageResponse_Raw = {
  attributes: {
    height: number;
    alternativeText: string;
    caption: string;
    updatedAt: DateString;
    createdAt: DateString;
    ext: string;
    hash: string;
    mime: MimeType;
    name: string;
    previewUrl?: string;
    provider: string;
    provider_metadata: unknown;
    size: number;
    url: string;
    width: number;
    formats: ImageFormats_Raw;
  };
  id: id;
};

export type ProjectMedia_Raw = {
  id: id;
  attributes: {
    createdAt: DateString;
    updatedAt: DateString;
    publishedAt: DateString;
    title: string;
    uid: uid;
    media: {
      data: ImageResponse_Raw;
    };
  };
};

export type Project_Raw = {
  id: id;
  attributes: {
    title: string;
    uid: uid;
    index: number;
    type: ProjectType_Raw;
    tags: {
      data: ProjectTag_Raw[];
    };
    texts: {
      data: ProjectText_Raw[];
    };
    thumbnail: {
      data: ImageResponse_Raw;
    };
    media: {
      data: ProjectMedia_Raw[];
    };
  };
};

// MAYBES

export type MaybeProject = Project | undefined;
