import fs from "fs";
import path from "path";
import WAWebJS, { MessageMedia } from "whatsapp-web.js";
import {
  CONTACTS_FILE,
  GROUP_CONTACTS_FILE,
  GROUPS_FILE,
  VCF_SAVE_DIR,
} from "../consts";
import {
  cmClearLog,
  cmIsStopped,
  cmLog,
  cmResetStop,
  cmStopSending,
} from "../globals/contactsMessagingGolbals";
import {
  gmClearLog,
  gmIsStopped,
  gmLog,
  gmResetStop,
  gmStopSending,
} from "../globals/groupsMessagingGlobals";
import { Contact, Group, VcfContact } from "../types";
import WhatsAppClient from "./client";
import {
  delayRandom,
  getConfig,
  getRandomInt,
  loadContactsFromExcel,
  loadGroupsFromExcel,
  loadSentMessagesContacts,
  loadSentMessagesGroups,
  saveContactsToExcel,
  saveGroupContactsToExcel,
  saveGroupsToExcel,
  saveSentMessagesContacts,
  saveSentMessagesGroups,
} from "./utils";

const client = WhatsAppClient.client;

export async function extractContacts(): Promise<void> {
  const chats = await client.getChats();
  const contacts: Contact[] = chats
    .filter((chat) => !chat.isGroup)
    .map((chat) => ({
      user_id: chat.id._serialized,
      name: chat.name || "Unknown",
      number: chat.id.user,
    }));

  saveContactsToExcel(contacts);
  console.log("✅ Contacts saved to", CONTACTS_FILE);
}

export async function extractGroups() {
  const chats = await client.getChats();
  const groups: Group[] = [];

  for (const chat of chats) {
    if (chat.isGroup) {
      // let inviteLink = "N/A";

      // try {
      //   const groupChat = chat as unknown as {
      //     getInviteCode: () => Promise<string>;
      //     groupMetadata: { announce: boolean };
      //   };
      //   inviteLink = groupChat.groupMetadata.announce
      //     ? "N/A"
      //     : `https://chat.whatsapp.com/${await groupChat.getInviteCode()}`;
      // } catch (error) {
      //   console.log(
      //     `⚠️ Failed to get invite link for ${chat.name}: ${error.message}`
      //   );
      // }

      const adminNumbers = (chat as any).groupMetadata.participants
        .filter((p) => p.isAdmin || p.isSuperAdmin)
        .map((p) => p.id._serialized.split("@")[0]);

      groups.push({
        name: chat.name,
        group_id: chat.id._serialized,
        total_members: (chat as any).groupMetadata.participants.length,
        // invite_link: inviteLink,
        admin_only: (chat as any).groupMetadata.announce ? "Yes" : "No",
        admin_numbers: adminNumbers.join(", "),
      });

      // await delayRandom();
    }
  }

  if (groups.length === 0) {
    console.log("❌ No groups found!");
    return;
  }

  saveGroupsToExcel(groups);
  console.log("✅ Groups saved to", GROUPS_FILE);
}

export async function extractGroupContacts(
  groupId: string,
  logger = console.log
) {
  try {
    const chat = await client.getChatById(groupId).catch(() => null);

    if (!chat || !chat.isGroup) {
      logger("❌ Group not found! Please enter a valid group ID.");
      return false;
    }

    // Extract participants
    const participants = chat.groupMetadata.participants.map((participant) => ({
      group_id: groupId,
      group_name: chat.name,
      user_id: participant.id._serialized,
      number: participant.id.user,
    }));

    if (participants.length === 0) {
      logger("❌ No contacts found in this group!");
      return false;
    }

    saveGroupContactsToExcel(participants);
    logger(
      `✅ Contacts from group '${chat.name}' saved to '${GROUP_CONTACTS_FILE}'`
    );
  } catch (error) {
    logger(`❌ Error: ${error.message || "Unknown error"}`);
    return false;
  }
  return true;
}

export async function extractMultipleGroupContacts(
  groups: { group_id: string; name: string }[],
  logger = console.log
) {
  try {
    let allContacts = [];

    let extractCount = 0;
    for (const [i, group] of groups.entries()) {
      if (!group.group_id) continue;

      const chat = await client.getChatById(group.group_id).catch(() => null);
      if (!chat.isGroup) continue;

      const participants = chat.participants.map((p) => ({
        group_id: group.group_id,
        group_name: group.name,
        user_id: p.id._serialized,
        number: p.id.user,
      }));

      logger(
        `📥 (${i + 1}/${groups.length}) Extracted contacts from ${
          group.name
        } (${group.group_id}).`
      );

      await delayRandom(logger, 10000, 20000);

      allContacts.push(...participants);

      extractCount++;
      if (extractCount % getRandomInt(10, 20) === 0) {
        logger("⏳ Taking a longer break to avoid detection...");
        await delayRandom(logger, 20000, 30000);
      }
    }

    if (allContacts.length === 0) {
      logger("❌ No contacts found in the groups.");
      return false;
    }

    saveGroupContactsToExcel(allContacts);
    logger(`✅ Contacts from groups saved to '${GROUP_CONTACTS_FILE}'`);
  } catch (error) {
    logger(`❌ Error: ${error.message || "Unknown error"}`);
    return false;
  }
  return true;
}

export async function deleteChatById(chatId: string, logger = console.log) {
  try {
    const chat = await client.getChatById(chatId).catch(() => null);

    if (!chat) {
      logger("❌ Chat not found! Please enter a valid Chat ID.");
      return;
    }

    await chat.delete();
    logger(`✅ Deleted chat for: ${chat.name || "Unknown"} (${chatId})`);
  } catch (error) {
    logger(`❌ Error: ${error.message || "Unknown error"}`);
  }
}

export async function deleteAllChats(logger = console.log) {
  try {
    const chats = await client.getChats();

    for (const [i, chat] of chats.entries()) {
      await chat.delete();
      logger(
        `✅ Deleted chat for: ${chat.name || "Unknown"} (${
          chat.id._serialized
        })`
      );
      await delayRandom(logger, 3000, 7000);

      if ((i + 1) % getRandomInt(10, 20) === 0) {
        logger("⏳ Taking a break to avoid detection...");
        await delayRandom(logger, 8000, 20000);
      }
    }

    logger("✅ Deleted all chats!");
  } catch (error) {
    logger(`❌ Error: ${error.message || "Unknown error"}`);
  }
}

export async function sendMessagesToContacts({
  message,
  sendAsContact,
  attachedFiles,
  selectedTags,
  eventType,
  fileName,
}: {
  message: string;
  sendAsContact: boolean;
  attachedFiles: Map<string, string>;
  selectedTags: string[];
  eventType: "uiDriven" | "serverDriven";
  fileName?: string;
}) {
  const log = cmLog();

  if (!cmIsStopped()) {
    log("🛑 Already sending messages!");
    return;
  }

  if (eventType === "uiDriven") {
    if (!fs.existsSync(fileName)) {
      log(`❌ Contacts file not selected!`);
      return;
    }
  } else {
    if (!fs.existsSync(CONTACTS_FILE)) {
      log(`❌ '${CONTACTS_FILE}' not found!`);
      return;
    }
  }

  cmClearLog();
  cmResetStop();
  log("⏳ Started sending messages...");

  const { contacts } = loadContactsFromExcel(
    eventType === "uiDriven" ? fileName : CONTACTS_FILE,
    log
  );
  const sendToAll = selectedTags.includes("All");

  const filteredContacts = sendToAll
    ? contacts
    : contacts.filter((contact) => {
        if (!contact.tags) return false;
        const contactTags = contact.tags
          .toString()
          .split(",")
          .map((tag) => tag.trim());
        return selectedTags.some((tag) => contactTags.includes(tag));
      });

  const sentMessages = [];
  saveSentMessagesContacts(sentMessages);

  const { delay } = await getConfig();

  for (const [i, contact] of filteredContacts.entries()) {
    if (cmIsStopped()) {
      log("🛑 Stopped sending messages!");
      break;
    }

    try {
      if (message) {
        let sentMsg: WAWebJS.Message;
        if (sendAsContact) {
          const contacts = await Promise.all(
            message
              .split(",")
              .map(
                async (num) => await client.getContactById(num.trim() + "@c.us")
              )
          );
          sentMsg = await client.sendMessage(
            contact.user_id,
            contacts.length > 1 ? contacts : contacts[0]
          );
        } else {
          sentMsg = await client.sendMessage(contact.user_id, message);
        }
        log(
          `✅ (${i + 1}/${filteredContacts.length}) Sent message to ${
            contact.name ?? ""
          } (${contact.number})`
        );
        WhatsAppClient.trackMessageLog(sentMsg.id._serialized, {
          name: contact.name ?? "",
          chat_id: contact.user_id,
          message_id: sentMsg.id._serialized,
          ack: 0, // Initially 0, will be updated via 'message_ack'
          timestamp: new Date().toISOString(),
          is_group: false,
        });
        sentMessages.push({
          chatId: contact.user_id,
          msgId: sentMsg.id._serialized,
        });
        saveSentMessagesContacts(sentMessages);
        await delayRandom(log, delay.min, delay.max);
      }

      for (const [filePath, caption] of attachedFiles.entries()) {
        if (cmIsStopped()) {
          log("🛑 Stopped sending messages!");
          break;
        }

        if (!fs.existsSync(filePath)) {
          log(`⚠️ File not found: ${filePath}`);
          continue;
        }

        const media = MessageMedia.fromFilePath(filePath);
        const sentMedia = await client.sendMessage(contact.user_id, media, {
          caption,
        });
        log(
          `✅ (${i + 1}/${filteredContacts.length}) Sent media (${filePath
            .split("/")
            .pop()}) to ${contact.name ?? ""} (${contact.number})`
        );
        WhatsAppClient.trackMessageLog(sentMedia.id._serialized, {
          name: contact.name ?? "",
          chat_id: contact.user_id,
          message_id: sentMedia.id._serialized,
          ack: 0,
          timestamp: new Date().toISOString(),
          is_group: false,
        });
        sentMessages.push({
          chatId: contact.user_id,
          msgId: sentMedia.id._serialized,
        });
        saveSentMessagesContacts(sentMessages);
        await delayRandom(log, delay.min, delay.max);
      }
    } catch (error) {
      log(`❌ Error sending to ${contact.name}: ${error.message}`);
    }

    if ((i + 1) % getRandomInt(10, 20) === 0) {
      log("⏳ Taking a break to avoid detection...");
      await delayRandom(log, 20000, 30000);
    }
  }

  if (!cmIsStopped()) log("✅ Messages sent to all contacts!");
  cmStopSending();
}

export async function undoContactsMessages() {
  const log = cmLog();

  if (!cmIsStopped()) {
    log("🛑 Already sending messages!");
    return;
  }

  let sentMessages = loadSentMessagesContacts();
  if (sentMessages.length === 0) {
    log("❌ No messages to delete!");
    return;
  }

  const { delay } = await getConfig();

  for (const { chatId, msgId } of sentMessages) {
    if (cmIsStopped()) break;

    try {
      const chat = await client.getChatById(chatId);
      await delayRandom(log, 2000, 5000);
      const messages = await chat.fetchMessages({ limit: 50 });

      const messageToDelete = messages.find(
        (msg) => msg.id._serialized === msgId
      );

      if (messageToDelete) {
        await messageToDelete.delete(true);
        log(`🗑️ Deleted message in ${chatId}`);
      } else {
        log(`⚠️ Message ${msgId} not found in ${chatId}, might be too old.`);
      }

      await delayRandom(log, delay.min, delay.max);
    } catch (error) {
      log(`❌ Failed to delete message in ${chatId}: ${error.message}`);
    }
  }

  log("✅ Deleted all messages!");
  saveSentMessagesContacts([]);
}

export async function sendMessagesToGroups({
  message,
  sendAsContact,
  attachedFiles,
  selectedTags,
  eventType,
  fileName,
}: {
  message: string;
  sendAsContact: boolean;
  attachedFiles: Map<string, string>;
  selectedTags: string[];
  eventType: "uiDriven" | "serverDriven";
  fileName?: string;
}) {
  const log = gmLog();

  if (!gmIsStopped()) {
    log("🛑 Already sending messages!");
    return;
  }

  if (eventType === "uiDriven") {
    if (!fs.existsSync(fileName)) {
      log(`❌ Groups file not selected!`);
      return;
    }
  } else {
    if (!fs.existsSync(GROUPS_FILE)) {
      log(`❌ '${GROUPS_FILE}' not found!`);
      return;
    }
  }

  gmClearLog();
  gmResetStop();
  log("⏳ Started sending messages...");

  const { groups } = loadGroupsFromExcel(
    eventType === "uiDriven" ? fileName : GROUPS_FILE,
    log
  );
  const sendToAll = selectedTags.includes("All");

  const filteredGroups = sendToAll
    ? groups
    : groups.filter((group) => {
        if (!group.tags) return false;
        const groupTags = group.tags
          .toString()
          .split(",")
          .map((tag) => tag.trim());
        return selectedTags.some((tag) => groupTags.includes(tag));
      });

  const sentMessages = [];
  saveSentMessagesGroups(sentMessages);

  const { delay } = await getConfig();

  let sentCount = 0;
  for (const [i, group] of filteredGroups.entries()) {
    if (gmIsStopped()) {
      log("🛑 Stopped sending messages!");
      break;
    }

    if (group.admin_only === "Yes") {
      log(`⚠️ Skipping non-admin group: ${group.name}`);
      continue;
    }

    if (group.group_id.includes("@broadcast")) {
      log(`⚠️ Skipping broadcast group: ${group.name}`);
      continue;
    }

    try {
      if (message) {
        let sentMsg: WAWebJS.Message;
        if (sendAsContact) {
          const contacts = await Promise.all(
            message
              .split(",")
              .map(
                async (num) => await client.getContactById(num.trim() + "@c.us")
              )
          );
          sentMsg = await client.sendMessage(
            group.group_id,
            contacts.length > 1 ? contacts : contacts[0]
          );
        } else {
          sentMsg = await client.sendMessage(group.group_id, message);
        }
        log(
          `✅ (${i + 1}/${filteredGroups.length}) Sent message to ${
            group.name ?? "Unknown Group"
          }`
        );
        WhatsAppClient.trackMessageLog(sentMsg.id._serialized, {
          name: group.name ?? "",
          chat_id: group.group_id,
          message_id: sentMsg.id._serialized,
          ack: 0, // Initially 0, will be updated via 'message_ack'
          timestamp: new Date().toISOString(),
          is_group: true,
        });
        sentMessages.push({
          chatId: group.group_id,
          msgId: sentMsg.id._serialized,
        });
        saveSentMessagesGroups(sentMessages);
        await delayRandom(log, delay.min, delay.max);
      }

      for (const [filePath, caption] of attachedFiles.entries()) {
        if (gmIsStopped()) {
          log("🛑 Stopped sending messages!");
          break;
        }

        if (!fs.existsSync(filePath)) {
          log(`⚠️ File not found: ${filePath}`);
          continue;
        }

        const media = MessageMedia.fromFilePath(filePath);
        const sentMedia = await client.sendMessage(group.group_id, media, {
          caption,
        });
        log(
          `✅ (${i + 1}/${filteredGroups.length}) Sent media (${filePath
            .split("/")
            .pop()}) to ${group.name ?? "Unknown Group"}`
        );
        WhatsAppClient.trackMessageLog(sentMedia.id._serialized, {
          name: group.name ?? "",
          chat_id: group.group_id,
          message_id: sentMedia.id._serialized,
          ack: 0,
          timestamp: new Date().toISOString(),
          is_group: true,
        });
        sentMessages.push({
          chatId: group.group_id,
          msgId: sentMedia.id._serialized,
        });
        saveSentMessagesGroups(sentMessages);
        await delayRandom(log, delay.min, delay.max);
      }
    } catch (error) {
      log(`❌ Error sending to ${group.name}: ${error.message}`);
    }

    sentCount++;
    if (sentCount % getRandomInt(10, 20) === 0) {
      log("⏳ Taking a break to avoid detection...");
      await delayRandom(log, 20000, 30000);
    }
  }

  if (!gmIsStopped()) log("✅ Messages sent to all groups!");
  gmStopSending();
}

export async function undoGroupsMessages() {
  const log = gmLog();

  if (!gmIsStopped()) {
    log("🛑 Already sending messages!");
    return;
  }

  const sentMessages = loadSentMessagesGroups();
  if (sentMessages.length === 0) {
    log("❌ No messages to delete!");
    return;
  }

  const { delay } = await getConfig();

  for (const { chatId, msgId } of sentMessages) {
    try {
      const chat = await client.getChatById(chatId);
      await delayRandom(log, 2000, 5000);
      const messages = await chat.fetchMessages({ limit: 50 });

      const messageToDelete = messages.find(
        (msg) => msg.id._serialized === msgId
      );

      if (messageToDelete) {
        await messageToDelete.delete(true);
        log(`🗑️ Deleted message in ${chatId}`);
      } else {
        log(`⚠️ Message ${msgId} not found in ${chatId}, might be too old.`);
      }

      await delayRandom(log, delay.min, delay.max);
    } catch (error) {
      log(`❌ Failed to delete message in ${chatId}: ${error.message}`);
    }
  }

  log("✅ Deleted all messages!");
  saveSentMessagesGroups([]);
}

export async function generateVcfFiles(contacts: VcfContact[]) {
  if (!fs.existsSync(VCF_SAVE_DIR)) {
    fs.mkdirSync(VCF_SAVE_DIR, { recursive: true });
  }

  const fileGroups: Record<string, VcfContact[]> = {};

  for (const contact of contacts) {
    const key = contact.filename.endsWith(".vcf")
      ? contact.filename
      : `${contact.filename}.vcf`;
    if (!fileGroups[key]) {
      fileGroups[key] = [];
    }
    fileGroups[key].push(contact);
  }

  for (const [filename, group] of Object.entries(fileGroups)) {
    const vCardEntries = group.map((contact) => {
      const safeName = contact.name.trim();
      const safeNumber = contact.number.trim();
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${safeName}`,
        `TEL;TYPE=CELL:${safeNumber}`,
        "END:VCARD",
      ].join("\n");
    });

    const filePath = path.join(VCF_SAVE_DIR, filename);
    fs.writeFileSync(filePath, vCardEntries.join("\n\n"), "utf-8");
  }
}
