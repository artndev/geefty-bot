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

  private spinner: Ora;

  // constants
  private DIRS;
  private PATHS;

  constructor(
    _client: TelegramClient,
    _DIRS: I_Dirs,
    _PATHS: I_Paths,
    _spinner: Ora
  ) {
    this.client = _client;
    this.DIRS = _DIRS;
    this.PATHS = _PATHS;
    this.spinner = _spinner;
  }

  public static async build(): Promise<Client> {
    // initializing spinner
    const spinner = ora();
    spinner.start("Client is building...\n");

    // pre-made methods to set | this | variables for client constructor
    const DIRS = await Constants.DIRS();
    const PATHS = await Constants.PATHS();

    const _client = new TelegramClient(
      new StoreSession(path.join("src", "data", "auth")), // its important for users not bots though its required
      Number(process.env.APP_API_ID),
      process.env.APP_API_HASH!,
      {
        testServers: false, // test numbers are not longer supported
        connectionRetries: 5,
      }
    );

    // getting rid of logging
    _client.setLogLevel(LogLevel.NONE);

    // setting the friendly environment
    _client.session.setDC(
      Number(process.env.MTPROTO_SERVER_NUMBER),
      process.env.MTPROTO_SERVER_IP!,
      Number(process.env.MTPROTO_SERVER_PORT)
    );

    // saving session data to auth folder
    _client.session.save();

    await _client.start({
      botAuthToken: process.env.BOT_TOKEN!,
    });

    // invoking client class
    const client = new Client(_client, DIRS, PATHS, spinner);

    client.spinner.succeed("Client is built!\n");

    return client; // its builder so we have to return main class
  }

  public async getGifts(): Promise<T_TypeStarGift[]> {
    // converting class instance to json
    const data = await this.client.invoke(new Api.payments.GetStarGifts({}));
    const json = data.toJSON();

    // originalArgs which contain needed props are blocked by ts so
    // instead of infinite struggling with ts errs I have made own types with interfaces
    return json!.gifts as T_TypeStarGift[];
  }

  public async getAvailableGifts(): Promise<T_TypeStarGift[]> {
    const gifts = await this.getGifts();

    // extracting gifts for sale
    return gifts.filter((gift) => !gift.soldOut);
  }

  public async monitorGifts(): Promise<void> {
    this.spinner.start("Monitoring gifts...\n");

    // ? some testing snippets
    // let gifts = JSON.parse(
    //   await fs.readFile(this.PATHS.TEST_PATH, { encoding: "utf-8" })
    // ) as any[];
    // gifts = gifts.map((gift) => {
    //   const { sticker, ...giftPayload } = gift;
    //   const { fileReference, ...stickerPayload } = sticker;

    //   return {
    //     ...giftPayload,
    //     sticker: {
    //       ...stickerPayload,
    //       fileReference: Buffer.from(fileReference, "base64"),
    //     },
    //   };
    // });
    // console.log("Gifts: ", gifts);
    // const giftIds = new Set(gifts.map((gift) => gift.id.toString()));

    // getting ids of db items to see changes
    const gifts = await this.getAvailableGifts();

    // reading db file with data from last call
    const data = await fs.readFile(this.PATHS.DB_PATH.path, {
      encoding: "utf-8",
    });

    const json = JSON.parse(data) as typeof gifts;
    const savedGiftsIds = new Set(json.map((gift) => gift.id.toString()));

    const newGifts = gifts.filter(
      (gift) => !savedGiftsIds.has(gift.id.toString()) // set is more convenient
    );
    if (!newGifts.length) {
      this.spinner.fail("There are no new gifts");
      return;
    }

    this.spinner.succeed(`Found ${newGifts.length} new gifts\n`);

    // updating db file with received changes
    await fs.truncate(this.PATHS.DB_PATH.path, 0);

    // transforming | fileReference | for saving (testing especially)
    const savedGifts = gifts.map((gift) => {
      const { sticker, ...giftPayload } = gift;
      const { fileReference, ...stickerPayload } = sticker;

      return {
        ...giftPayload,
        sticker: {
          ...stickerPayload,
          fileReference: fileReference.toString("base64"),
        },
      };
    });

    // changing db file
    await fs.writeFile(this.PATHS.DB_PATH.path, JSON.stringify(savedGifts), {
      flag: "w",
    });

    // echoing them
    this.sendGifts(newGifts);
  }

  public async sendGifts(gifts: T_TypeStarGift[]): Promise<void> {
    // removing used *.tgs from temp folder
    await Constants.clearDirs();

    this.spinner.stopAndPersist({
      text: `Duplicating to ${
        Constants.IS_TELEGRAM ? "Telegram" : "console"
      }...`,
    });

    // promise is better way to handle timeouts
    return new Promise<void>(async (resolve, reject) => {
      try {
        await gifts.forEach((gift, i) => {
          setTimeout(async () => {
            if (!Constants.IS_TELEGRAM) {
              console.log(`#${gift.id} — ${gift.stars} ⭐`);
              return;
            }

            // downloading sticker from telegram servers
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

            // saving file to temp folder
            await fs.writeFile(filePath, file!, { flag: "w" });

            // calculating basic description of file
            const fileStats = await fs.stat(filePath);
            const fileSize = fileStats.size;

            // ready to be pushed in chat
            const uploadedFile = await this.client.uploadFile({
              file: new CustomFile(fileName, fileSize, filePath),
              workers: 1,
            });

            // sending to chat
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

            // replying to previous message with id and price
            await this.client.sendMessage(Constants.CHAT_ID, {
              message: `#\`${gift.id}\` — ${gift.stars} ⭐`,
              replyTo: message.id,
            });
          }, Constants.SEND_DELAY * i).unref(); // timeout formula for loop
        });

        // when upper timeout is ready, calling finish
        setTimeout(() => {
          this.spinner.succeed("Duplication is completed!\n");

          resolve();
        }, Constants.SEND_DELAY * gifts.length).unref(); // waiting whole time
      } catch (err) {
        reject(err);
      }
    });
  }
}
