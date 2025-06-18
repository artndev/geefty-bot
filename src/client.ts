import dotenv from "dotenv";
dotenv.config();

import { Api, TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions";

// @ts-ignore
import input from "input";

export default class Client {
  public client;

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
      phoneNumber: async () => await input.text("Please enter your number: "),
      password: async () => await input.text("Please enter your password: "),
      phoneCode: async () =>
        await input.text("Please enter the code you received: "),
      onError: (err) => console.log(err),
    });

    return new Client(_client);
  };

  getGifts = async () => {
    const res = await this.client.invoke(new Api.payments.GetStarGifts({}));

    return res;
  };
}
