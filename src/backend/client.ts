import { EventEmitter } from "events";
import fs from "fs";
import qrcode from "qrcode-terminal";
import { Client, LocalAuth } from "whatsapp-web.js";
import { CHROME_PATHS, SESSION_PATH } from "../consts";

const CHROME_PATH = CHROME_PATHS.find((path) => fs.existsSync(path)) || "";

if (!CHROME_PATH) {
  console.error("❌ Chrome executable not found!");
}

class WhatsAppClient extends EventEmitter {
  client: Client;

  constructor() {
    super();
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: SESSION_PATH }),
      puppeteer: {
        executablePath: CHROME_PATH,
        headless:
          process.env.HEADLESS_MODE && process.env.HEADLESS_MODE === "true"
            ? true
            : false,
        args: process.env.PROXY_SERVER_ARG
          ? [
              process.env.PROXY_SERVER_ARG,
              "--disable-gpu",
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-extensions",
              "--disable-background-networking",
              "--disable-sync",
              "--disable-default-apps",
              "--disable-translate",
              "--disable-popup-blocking",
              "--disable-infobars",
              "--disable-background-timer-throttling",
              "--disable-renderer-backgrounding",
              "--disable-backgrounding-occluded-windows",
              "--js-flags=--max-old-space-size=512",
              "--window-size=1000,700",
            ]
          : [
              "--disable-gpu",
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-extensions",
              "--disable-background-networking",
              "--disable-sync",
              "--disable-default-apps",
              "--disable-translate",
              "--disable-popup-blocking",
              "--disable-infobars",
              "--disable-background-timer-throttling",
              "--disable-renderer-backgrounding",
              "--disable-backgrounding-occluded-windows",
              "--js-flags=--max-old-space-size=512",
              "--window-size=1000,700",
            ],
      },
    });
    this.initialize();
  }

  private initialize(): void {
    this.client.on("qr", (qr: string) => {
      console.log("📱 Scan the QR code below to authenticate:");
      qrcode.generate(qr, { small: true });
    });

    this.client.on("ready", () => {
      console.log("✅ Client is ready!");
      this.emit("ready");
    });

    this.client.on("authenticated", () => {
      console.log("🔑 Authenticated successfully!");
    });

    this.client.on("auth_failure", (msg: string) => {
      console.error("❌ Authentication failed:", msg);
    });

    try {
      this.client.initialize();
    } catch (error) {
      console.error("❌ Error initializing client:", error);
    }
  }
}

export default new WhatsAppClient();
