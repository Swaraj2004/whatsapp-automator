import { EventEmitter } from "events";
import fs from "fs";
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
        headless: false,
        args: process.env.PROXY_SERVER_ARG
          ? [process.env.PROXY_SERVER_ARG]
          : [],
      },
    });
    this.initialize();
  }

  private initialize(): void {
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

    this.client.initialize();
  }
}

export default new WhatsAppClient();
