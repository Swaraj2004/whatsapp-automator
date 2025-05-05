import dotenv from "dotenv";
import { EventEmitter } from "events";
import fs from "fs";
import qrcode from "qrcode-terminal";
import { ContactMessageLog } from "src/types";
import { Client, LocalAuth } from "whatsapp-web.js";
import { CHROME_PATHS, SESSION_PATH } from "../consts";
import { saveContactsMessagesLogs } from "./utils";

dotenv.config();

const CHROME_PATH = CHROME_PATHS.find((path) => fs.existsSync(path)) || "";

if (!CHROME_PATH) {
  console.error("❌ Chrome executable not found!");
}

const pendingLogs: Record<string, ContactMessageLog> = {};

const args = [
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
];

class WhatsAppClient extends EventEmitter {
  client: Client;

  constructor() {
    super();
    this.client = this.createClient();
    this.initialize();
  }

  private createClient(): Client {
    return new Client({
      authStrategy: new LocalAuth({ dataPath: SESSION_PATH }),
      puppeteer: {
        executablePath: CHROME_PATH,
        headless:
          process.env.HEADLESS_MODE && process.env.HEADLESS_MODE === "true"
            ? true
            : false,
        args: process.env.PROXY_SERVER_ARG
          ? [process.env.PROXY_SERVER_ARG, ...args]
          : args,
      },
    });
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

    this.client.on("auth_failure", (msg: string) => {
      console.error("❌ Authentication failed:", msg);
    });

    this.client.on("disconnected", (reason) => {
      console.warn("⚠️ Client was disconnected:", reason);
    });

    this.client.on("message_ack", ({ id, ack }) => {
      const idStr = id._serialized;

      const log = pendingLogs[idStr];
      if (!log) return;

      if (ack > log.ack) {
        log.ack = ack;
        saveContactsMessagesLogs(log);
        if (ack >= 2) {
          delete pendingLogs[idStr];
        }
      }
    });

    try {
      this.client.initialize();
    } catch (error) {
      console.error("❌ Error initializing client:", error);
    }
  }

  trackMessageLog(messageId: string, log: ContactMessageLog): void {
    pendingLogs[messageId] = log;
  }
}

export default new WhatsAppClient();
