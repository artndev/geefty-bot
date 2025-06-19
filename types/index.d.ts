import type { Api } from "telegram/tl";

type T_StarGift = Api.StarGift & {
  stars: string;
  sticker: Api.Document;
  soldOut?: boolean;
};
Api.Document;
type T_StarGiftUnique = Api.StarGiftUnique & {
  stars: string;
  sticker: Api.Document;
  soldOut?: boolean;
};

declare global {
  type T_TypeStarGift = T_StarGift | T_StarGiftUnique;

  type T_Dictionary<T> = { [key: string]: T };

  interface I_DIRS extends T_Dictionary<string> {
    TEMP_DIR: string;
  }

  interface I_PATHS extends T_Dictionary<string> {
    DB_PATH: string;
    DEFAULT_PATH: string;
    TEST_PATH: string;
  }
}

export {};
