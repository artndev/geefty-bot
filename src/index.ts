import dotenv from "dotenv";
dotenv.config();

import Client from "./client.js";

(async () => {
  const client = await Client.build().catch((err) => console.log(err));

  if (!client) return;

  const gifts = await client!.getGifts();
  console.log(gifts);
})();
