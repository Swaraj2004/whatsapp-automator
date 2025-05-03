import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import WebSocket from "ws";
import { FILES_SAVE_DIR } from "../consts";
import { cmIsStopped } from "../globals/contactsMessagingGolbals";
import { gmIsStopped } from "../globals/groupsMessagingGlobals";
import { sendMessagesToContacts, sendMessagesToGroups } from "./controllers";
import { loadContactsFromExcel, loadGroupsFromExcel } from "./utils";

if (fs.existsSync(FILES_SAVE_DIR)) {
  fs.readdirSync(FILES_SAVE_DIR).forEach((file) => {
    const filePath = path.join(FILES_SAVE_DIR, file);
    if (fs.lstatSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
    } else {
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  });
} else {
  fs.mkdirSync(FILES_SAVE_DIR);
}

dotenv.config({ path: path.resolve(__dirname, ".env") });

const PHONE_NAME = process.env.PHONE_NAME;
const WS_URL = process.env.WS_URL || "ws://localhost:3000/ws";

let ws: WebSocket;

export function initWebSocket() {
  function connect() {
    ws = new WebSocket(WS_URL);

    ws.on("open", () => {
      console.log("✅ WS connected");
      const { tags: contactTags } = loadContactsFromExcel();
      const { tags: groupTags } = loadGroupsFromExcel();

      console.log(PHONE_NAME, WS_URL);
      ws.send(
        JSON.stringify({
          type: "register",
          name: PHONE_NAME,
          contactTags,
          groupTags,
        })
      );

      setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "posting-status",
              contactPosting: !cmIsStopped(),
              groupPosting: !gmIsStopped(),
            })
          );
        }
      }, 8000);
    });

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "file-transfer") {
          const { message, files, selectedTags, postingType, selectedDevices } =
            msg;

          if (!selectedDevices.includes(PHONE_NAME)) {
            console.log("⏩ Skipping message: not in selectedDevices");
            return;
          }

          const attachedFiles = new Map<string, string>();

          for (const file of files) {
            const { name, caption, base64 } = file;

            const uniqueFilename = `${Date.now()}-${name}`;
            const savePath = path.join(FILES_SAVE_DIR, uniqueFilename);
            const buffer = Buffer.from(base64, "base64");

            fs.writeFileSync(savePath, new Uint8Array(buffer));
            attachedFiles.set(savePath, caption);

            console.log(`💾 Saved file: ${savePath}`);
          }

          console.log("📁 Files saved, starting message sending...");

          if (postingType === "contacts") {
            await sendMessagesToContacts({
              message,
              attachedFiles,
              selectedTags,
              eventType: "serverDriven",
            });
          } else if (postingType === "groups") {
            await sendMessagesToGroups({
              message,
              attachedFiles,
              selectedTags,
              eventType: "serverDriven",
            });
          }
        }
      } catch (err) {
        console.error("❌ Failed to process incoming WS message:", err);
      }
    });

    ws.on("close", () => {
      console.log("🔌 WS disconnected, retrying in 5s...");
      setTimeout(connect, 5000);
    });

    ws.on("error", (err) => {
      console.error("❌ WS error:", err);
    });
  }

  connect();
}
