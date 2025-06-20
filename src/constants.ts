import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";
import path from "path";
const __dirname = process.cwd();

// | constants | validations | utils |
export default class Constants {
  static CHAT_ID: number | string = !Number.isNaN(process.env.CHAT_ID)
    ? Number(process.env.CHAT_ID)
    : "me";
  static IS_TELEGRAM: boolean = this.CHAT_ID !== -100 ? true : false; // when CHAT_ID is -100, logging to console

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

  static _DIRS: I_Dirs = {
    TEMP_DIR: path.join(__dirname, "data", "temp"),
    AUTH_DIR: path.join(__dirname, "data", "auth"),
  };
  static _PATHS: I_Paths = {
    DB_PATH: {
      path: path.join(__dirname, "data", "db.txt"),
      writable: true,
      content: "[]",
    },
    DEFAULT_PATH: {
      path: path.join(__dirname, "data", "test", "default.txt"),
      writable: false,
    },
    TEST_PATH: {
      path: path.join(__dirname, "data", "test", "test.txt"),
      writable: false,
    },
  };

  // before dirs are got, making some preps
  static DIRS = async () => {
    await this.createDirs();
    await this.clearDirs();

    return this._DIRS;
  };

  static PATHS = async () => {
    await this.createPaths();

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

  private static createPaths = async () => {
    for (const [_, file] of Object.entries(Constants._PATHS)) {
      if (!file.writable) continue;

      await fs.writeFile(file.path, file.content ?? "", {
        flag: "w",
      });
    }
  };
}
