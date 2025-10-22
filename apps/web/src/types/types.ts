export type CategoryOption = {
  id: string;
  slug: string;
  label: string;
};

export type TagOption = {
  id: string;
  slug: string;
  label: string;
};

export type SearchOption = TagOption | CategoryOption;
