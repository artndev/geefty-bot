import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";
import ora, { Ora } from "ora";
import path from "path";
import { TelegramClient } from "telegram";
import { CustomFile } from "telegram/client/uploads";
import { LogLevel } from "telegram/extensions/Logger.js";
import { StoreSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import Constants from "./constants.js";

export default class Client {
  public client: TelegramClient;

  private DIRS;
  private PATHS;

  private spinner = ora();

  constructor(
    _client: TelegramClient,
    _DIRS: I_DIRS,
    _PATHS: I_PATHS,
    _spinner: Ora
  ) {
    this.client = _client;
    this.DIRS = _DIRS;
    this.PATHS = _PATHS;
    this.spinner = _spinner;
  }

  static build = async () => {
    const spinner = ora();
    spinner.start("Client is building...\n");

    const _client = new TelegramClient(
      new StoreSession("auth"),
      Number(process.env.APP_API_ID),
      process.env.APP_API_HASH!,
      {
        connectionRetries: 5,
      }
    );

    _client.setLogLevel(LogLevel.NONE);
    _client.session.setDC(
      Number(process.env.MTPROTO_SERVER_NUMBER),
      process.env.MTPROTO_SERVER_IP!,
      Number(process.env.MTPROTO_SERVER_PORT)
    );
    _client.session.save();

    await _client.start({
      botAuthToken: process.env.BOT_TOKEN!,
    });

    const DIRS = await Constants.DIRS();
    const PATHS = await Constants.PATHS();
    const client = new Client(_client, DIRS, PATHS, spinner);

    spinner.succeed("Client is built!\n");

    return client;
  };

  getGifts = async () => {
    const gifts = await this.client.invoke(new Api.payments.GetStarGifts({}));

    return gifts.toJSON()!.gifts as T_TypeStarGift[];
  };

  getAvailableGifts = async () => {
    const gifts = await this.getGifts();

    return gifts.filter(
      (gift) => !(gift.originalArgs as { soldOut?: boolean }).soldOut
    );
  };

  monitorUpdates = async () => {
    this.spinner.start("Monitoring gifts...");

    const data = await fs.readFile(this.PATHS.DB_PATH, {
      encoding: "utf-8",
    });

    // const gifts = JSON.parse(
    //   (await fs.readFile(this.PATHS.TEST_PATH)).toString()
    // ) as MyTypeStarGift[];
    // const giftIds = new Set(gifts.map((gift) => gift.id.toString()));
    const gifts = await this.getAvailableGifts();
    const savedGifts = JSON.parse(data) as typeof gifts;
    const savedGiftIds = new Set(savedGifts.map((gift) => gift.id.toString()));

    const newGifts = gifts.filter(
      (gift) => !savedGiftIds.has(gift.id.toString())
    );
    if (!newGifts.length) {
      this.spinner.fail("There are no new gifts");
      return;
    }

    this.spinner.succeed(`Found ${newGifts.length} new gifts`);

    await fs.truncate(this.PATHS.DB_PATH, 0);
    await fs.writeFile(this.PATHS.DB_PATH, JSON.stringify(gifts));

    this.sendGifts(newGifts);
  };

  sendGifts = async (gifts: T_TypeStarGift[]) => {
    await Constants.clearDirs();

    this.spinner.stopAndPersist({
      text: `Duplicating to ${
        Constants.IS_TELEGRAM ? "Telegram" : "console"
      }...`,
    });

    return new Promise<void>(async (resolve, reject) => {
      try {
        await gifts.forEach((gift, i) => {
          setTimeout(async () => {
            if (!Constants.IS_TELEGRAM) {
              console.log(`#${gift.id} — ${gift.stars} ⭐`);
              return;
            }

            const file = await this.client.downloadFile(
              new Api.InputDocumentFileLocation({
                id: gift.sticker.id,
                accessHash: gift.sticker.accessHash,
                fileReference: gift.sticker.fileReference,
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

            const message = await this.client.sendFile(Constants.CHAT_ID, {
              file: uploadedFile,
              attributes: [
                new Api.DocumentAttributeSticker({
                  stickerset: new Api.InputStickerSetEmpty(),
                  mask: false,
                  alt: "gift",
                }),
              ],
            });

            await this.client.sendMessage(Constants.CHAT_ID, {
              message: `#\`${gift.id}\` — ${gift.stars} ⭐`,
              replyTo: message.id,
            });
          }, Constants.SEND_DELAY * i).unref();
        });

        setTimeout(() => {
          this.spinner.succeed("Duplication is completed!");

          resolve();
        }, Constants.SEND_DELAY * gifts.length).unref();
      } catch (err) {
        reject(err);
      }
    });
  };
}
