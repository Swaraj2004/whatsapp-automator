import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import WebSocket from "ws";
import { FILES_SAVE_DIR } from "../consts";
import { cmIsStopped } from "../globals/contactsMessagingGolbals";
import { gmIsStopped } from "../globals/groupsMessagingGlobals";
import { sendMessagesToContacts, sendMessagesToGroups } from "./controllers";
import {
  delayRandom,
  loadContactsFromExcel,
  loadGroupsFromExcel,
} from "./utils";

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
const WS_URL = process.env.WS_URL || "ws://localhost:3000/";

let ws: WebSocket;

function wsToHttpOrigin(wsUrl: string): string {
  const urlObj = new URL(wsUrl);
  if (urlObj.protocol === "wss:") {
    urlObj.protocol = "https:";
  } else if (urlObj.protocol === "ws:") {
    urlObj.protocol = "http:";
  }
  urlObj.pathname = "/";
  urlObj.search = "";
  urlObj.hash = "";
  return urlObj.toString();
}

export function initWebSocket() {
  function connect() {
    ws = new WebSocket(WS_URL);

    ws.on("open", () => {
      console.log("✅ WS connected");
      const { tags: contactTags } = loadContactsFromExcel();
      const { tags: groupTags } = loadGroupsFromExcel();

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
          const {
            message,
            sendAsContact,
            files,
            selectedTags,
            postingType,
            selectedDevices,
          } = msg;

          if (!selectedDevices.includes(PHONE_NAME)) {
            console.log("⏩ Skipping message: not in selectedDevices");
            return;
          }

          const attachedFiles = new Map<string, string>();

          for (const file of files) {
            const { name, caption, path: relativePath } = file;

            const baseUrl = wsToHttpOrigin(WS_URL);
            const fileUrl = new URL(relativePath, baseUrl).toString();

            await delayRandom(console.log, 1000, 6000);
            const response = await fetch(fileUrl);
            if (!response.ok) {
              console.error(
                `Failed to fetch file ${fileUrl}: ${response.statusText}`
              );
              continue;
            }

            const arrayBuffer = await response.arrayBuffer();
            const uint8array = new Uint8Array(arrayBuffer);
            const savePath = path.join(FILES_SAVE_DIR, name);
            fs.writeFileSync(savePath, uint8array);
            attachedFiles.set(savePath, caption);
          }

          if (postingType === "contact") {
            await sendMessagesToContacts({
              message,
              sendAsContact,
              attachedFiles,
              selectedTags,
              eventType: "serverDriven",
            });
          } else if (postingType === "group") {
            await sendMessagesToGroups({
              message,
              sendAsContact,
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
      console.log("🔌 WS disconnected, retrying in 10s...");
      setTimeout(connect, 10000);
    });

    ws.on("error", (err) => {
      console.error("❌ WS error:", err);
    });
  }

  connect();
}
