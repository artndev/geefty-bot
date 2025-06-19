import dotenv from "dotenv";
dotenv.config();

import Client from "./client.js";
import Constants from "./constants.js";

(async () => {
  const client = await Client.build().catch((err) => console.log(err));

  if (!client) return;

  await client.monitorUpdates().catch((err) => console.log(err));

  setInterval(() => {
    client.monitorUpdates().catch((err) => console.log(err));
  }, Constants.AUDIT_DELAY).unref();
})();

process.on("SIGINT", () => {
  process.exit();
});
