import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";
import path from "path";
import { TelegramClient } from "telegram";
import { CustomFile } from "telegram/client/uploads";
import { StoreSession } from "telegram/sessions";
import { Api } from "telegram/tl";

export default class Client {
  public client;
  private DIRS = {
    IMAGES_DIR: path.join(import.meta.dirname, "/tmp"),
  };

  constructor(_client: TelegramClient) {
    this.client = _client;
  }

  static build = async () => {
    const _client = new TelegramClient(
      new StoreSession("user"),
      Number(process.env.APP_API_ID),
      process.env.APP_API_HASH!,
      {
        testServers: false,
        connectionRetries: 5,
      }
    );

    _client.session.setDC(
      2,
      process.env.MTPROTO_SERVER_IP!,
      Number(process.env.MTPROTO_SERVER_PORT)
    );
    _client.session.save();

    await _client.start({
      botAuthToken: process.env.BOT_TOKEN!,
    });

    return new Client(_client);
  };

  clearDirs = async () => {
    for (const [_, dir] of Object.entries(this.DIRS)) {
      const files = await fs.readdir(dir);

      await files.map((file) => fs.unlink(path.join(dir, file)));
    }
  };

  getGifts = async () => {
    await this.clearDirs();

    const res = await this.client.invoke(new Api.payments.GetStarGifts({}));

    res.toJSON()!.gifts.forEach(async (gift) => {
      const originalArgs = gift.originalArgs as typeof gift.originalArgs & {
        sticker: Api.Document;
      };
      const sticker = originalArgs.sticker;
      const file = await this.client.downloadFile(
        new Api.InputDocumentFileLocation({
          id: sticker.id,
          accessHash: sticker.accessHash,
          fileReference: sticker.fileReference,
          thumbSize: "",
        })
      );

      const fileName = `${gift.id}.tgs`;
      const filePath = path.join(this.DIRS.IMAGES_DIR, fileName);
      await fs.writeFile(filePath, file!);

      const fileStats = await fs.stat(filePath);
      const fileSize = fileStats.size;
      const uploadedFile = await this.client.uploadFile({
        file: new CustomFile(fileName, fileSize, filePath),
        workers: 1,
      });

      await this.client.sendFile(1153031909, {
        file: uploadedFile,
        attributes: [
          new Api.DocumentAttributeSticker({
            stickerset: new Api.InputStickerSetEmpty(),
            mask: false,
            alt: "Gift Sticker",
          }),
        ],
      });
    });

    return res;
  };

  getGiftOptions = async () => {
    const res = await this.client.invoke(
      new Api.payments.GetStarsGiftOptions({})
    );

    return res;
  };
}
