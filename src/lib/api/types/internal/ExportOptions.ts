export enum SourceOption {
  BOOKMARKS,
  LIKED_TWEETS,
  MEDIA_TWEETS,
}

export enum FormatOption {
  IMAGE,
  GIF,
  VIDEO,
}

export enum FilenameOption {
  INCLUDE_HANDLE,
  INCLUDE_DATE,
  INCLUDE_SIZE,
}

export type ExportRequest = {
  from: SourceOption[];
  what: FormatOption[];
  how: FilenameOption[];
  paginationStep: number;
  includeQuotes: boolean;
};
