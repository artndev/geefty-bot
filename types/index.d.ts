import type { Api } from "telegram/tl";

type T_StarGift = Api.StarGift & {
  stars: string;
  sticker: Api.Document;
  soldOut?: boolean;
};

type T_StarGiftUnique = Api.StarGiftUnique & {
  stars: string;
  sticker: Api.Document;
  soldOut?: boolean;
};

type T_Path = {
  path: string;
  writable: boolean;
  content?: string;
};

declare global {
  type T_TypeStarGift = T_StarGift | T_StarGiftUnique;

  type T_Dictionary<T> = { [key: string]: T };

  interface I_Dirs extends T_Dictionary<string> {
    TEMP_DIR: string;
    AUTH_DIR: string;
  }

  interface I_Paths extends T_Dictionary<T_Path> {
    DB_PATH: T_Path;
    DEFAULT_PATH: T_Path;
    TEST_PATH: T_Path;
  }
}

export {};
