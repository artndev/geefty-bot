import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";
import path from "path";

export default class Constants {
  static CHAT_ID: number | string = !Number.isNaN(process.env.CHAT_ID)
    ? Number(process.env.CHAT_ID)
    : "me";
  static IS_TELEGRAM: boolean = this.CHAT_ID !== -100 ? true : false;

  private static DELAY_LIMIT: number = 5000000;
  static AUDIT_DELAY: number =
    !Number.isNaN(process.env.AUDIT_DELAY) &&
    Number(process.env.AUDIT_DELAY) <= this.DELAY_LIMIT
      ? Math.abs(Number(process.env.AUDIT_DELAY))
      : 5000;
  static SEND_DELAY: number =
    !Number.isNaN(process.env.SEND_DELAY) &&
    Number(process.env.SEND_DELAY) <= this.DELAY_LIMIT
      ? Math.abs(Number(process.env.SEND_DELAY))
      : 2500;

  static _DIRS: I_DIRS = {
    TEMP_DIR: path.join(import.meta.dirname, "/temp"),
  };
  static _PATHS: I_PATHS = {
    DB_PATH: path.join(import.meta.dirname, "db.txt"),
    DEFAULT_PATH: path.join(import.meta.dirname, "json", "default_2.txt"),
    TEST_PATH: path.join(import.meta.dirname, "json", "test_2.txt"),
  };

  static DIRS = async () => {
    await this.createDirs();
    await this.clearDirs();

    return this._DIRS;
  };

  static PATHS = async () => {
    await this.createOrClearPaths();

    return this._PATHS;
  };

  static clearDirs = async () => {
    for (const [_, dir] of Object.entries(Constants._DIRS)) {
      const files = await fs.readdir(dir);

      await files.map((file) => fs.unlink(path.join(dir, file)));
    }
  };

  private static createDirs = async () => {
    for (const [_, dir] of Object.entries(Constants._DIRS))
      await fs.mkdir(dir, { recursive: true });
  };

  private static createOrClearPaths = async () => {
    for (const [_, path] of Object.entries(Constants._PATHS))
      await fs.writeFile(path, "[]", { flag: "w" });
  };
}
