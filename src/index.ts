import dotenv from "dotenv";
dotenv.config();

import Client from "./client.js";
import Constants from "./constants.js";

(async () => {
  const client = await Client.build().catch((err) => console.log(err));

  if (!client) return;

  await client.monitorGifts().catch((err) => console.log(err));

  setInterval(() => {
    client.monitorGifts().catch((err) => console.log(err));
  }, Constants.AUDIT_DELAY).unref(); // ! unref prevents app from infinite loop
})();

// maintaining unref solution
process.on("SIGINT", () => {
  process.exit();
});
