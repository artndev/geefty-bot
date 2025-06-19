// @ts-nocheck
import dotenv from "dotenv";
dotenv.config();

import Client from "./client.js";

(async () => {
  const client = await Client.build().catch((err) => console.log(err));

  if (!client) return;

  client.sendGifts().then(() => console.log("END"));
})();
