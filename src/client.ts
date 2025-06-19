import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";
import path from "path";
import { TelegramClient } from "telegram";
import { CustomFile } from "telegram/client/uploads";
import { StoreSession } from "telegram/sessions";
import { Api } from "telegram/tl";

export default class Client {
  public client: TelegramClient;

  private DIRS = {
    TEMP_DIR: path.join(import.meta.dirname, "/temp"),
  };

  private err: string | null | unknown;

  constructor(_client: TelegramClient) {
    this.client = _client;
  }

  static build = async () => {
    const _client = new TelegramClient(
      new StoreSession("auth"),
      Number(process.env.APP_API_ID),
      process.env.APP_API_HASH!,
      {
        connectionRetries: 5,
      }
    );

    _client.session.setDC(
      Number(process.env.MTPROTO_SERVER_NUMBER),
      process.env.MTPROTO_SERVER_IP!,
      Number(process.env.MTPROTO_SERVER_PORT)
    );
    _client.session.save();

    await _client.start({
      botAuthToken: process.env.BOT_TOKEN!,
    });

    const client = new Client(_client);
    await client.createDirs();
    await client.clearDirs();

    return client;
  };

  private createDirs = async () => {
    try {
      for (const [_, dir] of Object.entries(this.DIRS))
        await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      this.err = err;

      console.log(err);
    }
  };

  private clearDirs = async () => {
    try {
      for (const [_, dir] of Object.entries(this.DIRS)) {
        const files = await fs.readdir(dir);

        await files.map((file) => fs.unlink(path.join(dir, file)));
      }
    } catch (err) {
      this.err = err;

      console.log(err);
    }
  };

  getGifts = async () => {
    try {
      const res = await this.client.invoke(new Api.payments.GetStarGifts({}));

      return res.toJSON()!.gifts;
    } catch (err) {
      this.err = err;

      console.log(err);

      return null;
    }
  };

  getAvailableGifts = async () => {
    try {
      const gifts = await this.getGifts();
      if (!gifts) throw new Error("Gifts are empty");

      return gifts.filter(
        (gift) => !(gift.originalArgs as { soldOut?: boolean }).soldOut
      );
    } catch (err) {
      this.err = err;

      console.log(err);

      return null;
    }
  };

  sendGifts = async () => {
    await this.clearDirs();

    const gifts = await this.getAvailableGifts();

    return new Promise(async (resolve, reject) => {
      try {
        if (!gifts || this.err) {
          reject(this.err);
          this.err = null;
          return;
        }

        await gifts.forEach((gift, i) => {
          setTimeout(async () => {
            const originalArgs = gift.originalArgs as {
              sticker: Api.Document;
              stars: Api.long;
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
            const filePath = path.join(this.DIRS.TEMP_DIR, fileName);

            await fs.writeFile(filePath, file!);

            const fileStats = await fs.stat(filePath);
            const fileSize = fileStats.size;
            const uploadedFile = await this.client.uploadFile({
              file: new CustomFile(fileName, fileSize, filePath),
              workers: 1,
            });

            const message = await this.client.sendFile(process.env.CHAT_ID!, {
              file: uploadedFile,
              attributes: [
                new Api.DocumentAttributeSticker({
                  stickerset: new Api.InputStickerSetEmpty(),
                  mask: false,
                  alt: "gift",
                }),
              ],
            });

            await this.client.sendMessage(process.env.CHAT_ID!, {
              message: `${originalArgs.stars.toString()} ⭐`,
              replyTo: message.id,
            });
          }, 3000 * i);
        });

        setTimeout(resolve, 3000 * gifts.length);
      } catch (err) {
        reject(err);
      }
    });
  };
}
