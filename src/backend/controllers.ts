import fs from "fs";
import path from "path";
import WAWebJS, { MessageMedia } from "whatsapp-web.js";
import {
  CONTACTS_FILE,
  GROUP_CONTACTS_FILE,
  GROUPS_ADMINS_FILE,
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
import { Contact, Group, GroupAdmin, VcfContact } from "../types";
import WhatsAppClient from "./client";
import {
  clearCMProgress,
  clearGMProgress,
  delayRandom,
  generateInputHash,
  getConfig,
  getRandomInt,
  loadCMProgress,
  loadContactsFromExcel,
  loadGMProgress,
  loadGroupsFromExcel,
  loadSentMessagesContacts,
  loadSentMessagesGroups,
  saveCMProgress,
  saveContactsToExcel,
  saveGMProgress,
  saveGroupContactsToExcel,
  saveGroupsAdminsToExcel,
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
  const groupAdmins: GroupAdmin[] = [];

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

      const metadata = (chat as any).groupMetadata;
      const groupId = chat.id._serialized;
      const groupName = chat.name;

      const admins = metadata.participants.filter(
        (p) => p.isAdmin || p.isSuperAdmin
      );

      for (const admin of admins) {
        const adminNumber = admin.id._serialized.split("@")[0];
        groupAdmins.push({
          group_id: groupId,
          group_name: groupName,
          admin_number: adminNumber,
        });
      }

      groups.push({
        name: chat.name,
        group_id: chat.id._serialized,
        total_members: (chat as any).groupMetadata.participants.length,
        // invite_link: inviteLink,
        admin_only: (chat as any).groupMetadata.announce ? "Yes" : "No",
      });

      // await delayRandom();
    }
  }

  if (groups.length === 0) {
    console.log("❌ No groups found!");
    return;
  }

  saveGroupsToExcel(groups);
  saveGroupsAdminsToExcel(groupAdmins);
  console.log("✅ Groups saved to", GROUPS_FILE);
  console.log("✅ Group admins saved to", GROUPS_ADMINS_FILE);
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
      if (chat.id._serialized.includes("@broadcast")) {
        logger(`⚠️ Skipping broadcast group: ${chat.name || "Unknown"}`);
        continue;
      }

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

  const inputHash = generateInputHash({
    message,
    sendAsContact,
    attachedFiles,
    selectedTags,
  });

  const previousProgress = loadCMProgress();
  const resumeMode = previousProgress?.hash === inputHash;
  const sentStepsMap: Record<string, string[]> = resumeMode
    ? previousProgress.sentSteps
    : {};

  const sentMessages = [];
  saveSentMessagesContacts(sentMessages);

  const { delay } = await getConfig();
  let isStopedLogged = false;

  for (const [i, contact] of filteredContacts.entries()) {
    const userId = contact.user_id;

    if (cmIsStopped()) {
      if (!isStopedLogged) {
        log("🛑 Manually stopped! Saving progress...");
        saveCMProgress({
          hash: inputHash,
          sentSteps: sentStepsMap,
        });
      }
      break;
    }

    try {
      if (!(sentStepsMap[userId] || []).includes("msg") && message) {
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
            userId,
            contacts.length > 1 ? contacts : contacts[0]
          );
        } else {
          sentMsg = await client.sendMessage(userId, message);
        }

        log(
          `✅ (${i + 1}/${filteredContacts.length}) Sent message to ${
            contact.name ?? ""
          } (${contact.number})`
        );

        WhatsAppClient.trackMessageLog(sentMsg.id._serialized, {
          name: contact.name ?? "",
          chat_id: userId,
          message_id: sentMsg.id._serialized,
          ack: 0, // Initially 0, will be updated via 'message_ack'
          timestamp: new Date().toISOString(),
          is_group: false,
        });

        sentMessages.push({
          chatId: userId,
          msgId: sentMsg.id._serialized,
        });
        saveSentMessagesContacts(sentMessages);

        const newSteps = [...(sentStepsMap[userId] || []), "msg"];
        sentStepsMap[userId] = newSteps;
        saveCMProgress({
          hash: inputHash,
          sentSteps: sentStepsMap,
        });

        await delayRandom(log, delay.min, delay.max);
      }

      for (const [filePath, caption] of attachedFiles.entries()) {
        const mediaStep = `media:${filePath}`;
        if ((sentStepsMap[userId] || []).includes(mediaStep)) continue;

        if (cmIsStopped()) {
          log("🛑 Manually stopped! Saving progress...");
          saveCMProgress({
            hash: inputHash,
            sentSteps: sentStepsMap,
          });
          isStopedLogged = true;
          break;
        }

        if (!fs.existsSync(filePath)) {
          log(`⚠️ File not found: ${filePath}`);
          continue;
        }

        const media = MessageMedia.fromFilePath(filePath);
        const sentMedia = await client.sendMessage(userId, media, {
          caption,
        });

        log(
          `✅ (${i + 1}/${filteredContacts.length}) Sent media (${filePath
            .split("/")
            .pop()}) to ${contact.name ?? ""} (${contact.number})`
        );

        WhatsAppClient.trackMessageLog(sentMedia.id._serialized, {
          name: contact.name ?? "",
          chat_id: userId,
          message_id: sentMedia.id._serialized,
          ack: 0,
          timestamp: new Date().toISOString(),
          is_group: false,
        });

        sentMessages.push({
          chatId: userId,
          msgId: sentMedia.id._serialized,
        });
        saveSentMessagesContacts(sentMessages);

        const updatedSteps = [...(sentStepsMap[userId] || []), mediaStep];
        sentStepsMap[userId] = updatedSteps;
        saveCMProgress({
          hash: inputHash,
          sentSteps: sentStepsMap,
        });

        await delayRandom(log, delay.min, delay.max);
      }
    } catch (error) {
      log(`❌ Critical error sending to ${contact.name}: ${error.message}`);
      cmStopSending();
      logCriticalError(contact.name ?? userId, error);
      saveCMProgress({
        hash: inputHash,
        sentSteps: sentStepsMap,
        lastErrorChat: userId,
      });
      break;
    }

    if ((i + 1) % getRandomInt(10, 20) === 0) {
      log("⏳ Taking a break to avoid detection...");
      await delayRandom(log, 20000, 30000);
    }
  }

  if (!cmIsStopped()) {
    log("✅ Messages sent to all contacts!");
    clearCMProgress();
  }

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

  const inputHash = generateInputHash({
    message,
    sendAsContact,
    attachedFiles,
    selectedTags,
  });

  const previousProgress = loadGMProgress();
  const resumeMode = previousProgress?.hash === inputHash;
  const sentStepsMap: Record<string, string[]> = resumeMode
    ? previousProgress.sentSteps
    : {};

  const sentMessages = [];
  saveSentMessagesGroups(sentMessages);

  const { delay } = await getConfig();
  let isStopedLogged = false;

  for (const [i, group] of filteredGroups.entries()) {
    const groupId = group.group_id;

    if (gmIsStopped()) {
      if (!isStopedLogged) {
        log("🛑 Manually stopped! Saving progress...");
        saveGMProgress({
          hash: inputHash,
          sentSteps: sentStepsMap,
        });
      }
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
      if (!(sentStepsMap[groupId] || []).includes("msg") && message) {
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
            groupId,
            contacts.length > 1 ? contacts : contacts[0]
          );
        } else {
          sentMsg = await client.sendMessage(groupId, message);
        }

        log(
          `✅ (${i + 1}/${filteredGroups.length}) Sent message to ${
            group.name ?? "Unknown Group"
          }`
        );

        WhatsAppClient.trackMessageLog(sentMsg.id._serialized, {
          name: group.name ?? "",
          chat_id: groupId,
          message_id: sentMsg.id._serialized,
          ack: 0, // Initially 0, will be updated via 'message_ack'
          timestamp: new Date().toISOString(),
          is_group: true,
        });

        sentMessages.push({
          chatId: groupId,
          msgId: sentMsg.id._serialized,
        });
        saveSentMessagesGroups(sentMessages);

        const newSteps = [...(sentStepsMap[groupId] || []), "msg"];
        sentStepsMap[groupId] = newSteps;
        saveGMProgress({
          hash: inputHash,
          sentSteps: sentStepsMap,
        });

        await delayRandom(log, delay.min, delay.max);
      }

      for (const [filePath, caption] of attachedFiles.entries()) {
        const mediaStep = `media:${filePath}`;
        if ((sentStepsMap[groupId] || []).includes(mediaStep)) continue;

        if (gmIsStopped()) {
          log("🛑 Manually stopped! Saving progress...");
          saveGMProgress({
            hash: inputHash,
            sentSteps: sentStepsMap,
          });
          isStopedLogged = true;
          break;
        }

        if (!fs.existsSync(filePath)) {
          log(`⚠️ File not found: ${filePath}`);
          continue;
        }

        const media = MessageMedia.fromFilePath(filePath);
        const sentMedia = await client.sendMessage(groupId, media, {
          caption,
        });

        log(
          `✅ (${i + 1}/${filteredGroups.length}) Sent media (${filePath
            .split("/")
            .pop()}) to ${group.name ?? "Unknown Group"}`
        );

        WhatsAppClient.trackMessageLog(sentMedia.id._serialized, {
          name: group.name ?? "",
          chat_id: groupId,
          message_id: sentMedia.id._serialized,
          ack: 0,
          timestamp: new Date().toISOString(),
          is_group: true,
        });

        sentMessages.push({
          chatId: groupId,
          msgId: sentMedia.id._serialized,
        });
        saveSentMessagesGroups(sentMessages);

        const updatedSteps = [...(sentStepsMap[groupId] || []), mediaStep];
        sentStepsMap[groupId] = updatedSteps;
        saveGMProgress({
          hash: inputHash,
          sentSteps: sentStepsMap,
        });

        await delayRandom(log, delay.min, delay.max);
      }
    } catch (error) {
      log(`❌ Critical error sending to ${group.name}: ${error.message}`);
      gmStopSending();
      logCriticalError(group.name ?? groupId, error);
      saveGMProgress({
        hash: inputHash,
        sentSteps: sentStepsMap,
        lastErrorChat: groupId,
      });
      break;
    }

    if ((i + 1) % getRandomInt(10, 20) === 0) {
      log("⏳ Taking a break to avoid detection...");
      await delayRandom(log, 20000, 30000);
    }
  }

  if (!gmIsStopped()) {
    log("✅ Messages sent to all groups!");
    clearGMProgress();
  }

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
function logCriticalError(arg0: string, error: any) {
  throw new Error("Function not implemented.");
}
