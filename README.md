<p align="center">
<img src="./assets/spark.png" width="200" />
</p>

<h3 align="center">
Sparkly Bots
</h3>

<p align="center">
Make your own spark!
</p>

## Installation

Before we head to the manual, first of all, you need to download the latest release from [the releases tab](https://github.com/artndev/geefty-bot/releases) and unzip that archive in a folder on your disk.

Secondly, consider that you have already installed [Node.js](https://nodejs.org/) on your machine to work with the package manager _npm_. If all is fine, we are ready to start!

1. Inspect _.env_ to change the environmental variables. Do not forget to paste all data inside quotation marks!

```env
# These variables can be obtained at https://my.telegram.org

MTPROTO_SERVER_IP="..."
MTPROTO_SERVER_PORT="..."

# The number of server that you have selected
MTPROTO_SERVER_NUMBER="..."

APP_API_ID="..."
APP_API_HASH="..."


# You can create telegram bot via @BotFather (https://t.me/BotFather)
BOT_TOKEN="..."


# Logging channel. If you want to disable logging to telegram, just write -100
CHAT_ID="..."


# Debounces set in ms (write amount of ms without 'ms' word)

# Debounce between checks for gifts in console
AUDIT_DELAY="..."

# Debounce between each message sent to logging channel
SEND_DELAY="..."
```

Optionally, you can deploy the bot to _VPS_ or _Railway_ (as I did) if you want it to work independently and skip all the steps ahead.

2. Install all dependencies with _npm_

```shell
$ cd your-bot-root
$ npm i
```

3. Start the Sparkly bot

```shell
$ npm run start
```

## Tech Stack

<img src="./assets/npm.svg" width=50 />&nbsp;&nbsp;&nbsp;
<img src="./assets/vite.svg" width=50 />

<img src="./assets/typescript.svg" width=50 />&nbsp;&nbsp;&nbsp;
<img src="./assets/javascript.svg" width=50 />

<img src="./assets/telegram.svg" width=50 />

<br/>

<p align="center"> Made with 💛 by @artndev</p>
