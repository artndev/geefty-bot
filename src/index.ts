// @ts-nocheck
import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";

import Client from "./client.js";

(async () => {
  const client = await Client.build().catch((err) => console.log(err));

  if (!client) return;

  // let gifts = (await client!.getGifts()).toJSON()!.gifts;
  // gifts.filter((val) => {
  //   return val.originalArgs.soldOut;
  // });

  // console.log(gifts);

  const res = (await client!.getGifts()).toJSON()!.gifts;
  res.forEach((val) => {
    console.log(val.id);
  });
  console.log(res.length);
})();
