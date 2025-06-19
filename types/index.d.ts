import type { Api } from "telegram/tl";

type T_StarGift = Api.StarGift & {
  stars: string;
  sticker: Api.Document;
};

type T_StarGiftUnique = Api.StarGiftUnique & {
  stars: string;
  sticker: Api.Document;
};

declare global {
  export type T_TypeStarGift = MyStarGift | MyStarGiftUnique;

  export type T_Dictionary<T> = { [key: string]: T };

  export interface I_DIRS extends T_Dictionary<string> {
    TEMP_DIR: string;
  }

  export interface I_PATHS extends T_Dictionary<string> {
    DB_PATH: string;
    DEFAULT_PATH: string;
    TEST_PATH: string;
  }
}
