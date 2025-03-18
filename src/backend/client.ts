import { EventEmitter } from "events";
import { Client, LocalAuth } from "whatsapp-web.js";
import { CHROME_PATH, SESSION_PATH } from "../consts";

class WhatsAppClient extends EventEmitter {
  client: Client;

  constructor() {
    super();
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: SESSION_PATH }),
      puppeteer: {
        executablePath: CHROME_PATH,
        headless: false,
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
