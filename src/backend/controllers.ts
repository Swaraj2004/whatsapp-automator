import { CONTACTS_FILE, GROUP_CONTACTS_FILE, GROUPS_FILE } from "../consts";
import WhatsAppClient from "./client";
import {
  delayRandom,
  saveContactsToExcel,
  saveGroupContactsToExcel,
  saveGroupsToExcel,
} from "./utils";

type Contact = {
  group_id?: string;
  user_id: string;
  name?: string;
  number: string;
};

const client = WhatsAppClient.client;

export async function extractContacts(): Promise<void> {
  console.log("Extracting contacts from WhatsApp...");
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
  console.log("Extracting groups from WhatsApp...");
  const chats = await client.getChats();
  const groups = [];

  for (const chat of chats) {
    if (chat.isGroup) {
      let inviteLink = "N/A";

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

      groups.push({
        name: chat.name,
        group_id: chat.id._serialized,
        invite_link: inviteLink,
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
  console.log("✅ Groups saved to", GROUPS_FILE);
}

export async function extractGroupContacts(
  groupId: string
): Promise<string | void> {
  console.log("Extracting contacts from group", groupId);
  try {
    const chat = await client.getChatById(groupId).catch(() => null);

    if (!chat || !chat.isGroup) {
      return "Group not found! Please enter a valid group ID.";
    }

    // Extract participants
    const participants = chat.groupMetadata.participants.map((participant) => ({
      group_id: groupId,
      user_id: participant.id._serialized,
      number: participant.id.user,
    }));

    if (participants.length === 0) {
      return "No contacts found in this group!";
    }

    saveGroupContactsToExcel(participants);
    console.log(
      `✅ Contacts from group '${chat.name}' saved to '${GROUP_CONTACTS_FILE}'`
    );
  } catch (error) {
    console.error("Error extracting group contacts:", error);
    return `Error: ${error.message || "Unknown error"}`;
  }
}

export async function extractMultipleGroupContacts(
  groups: { group_id: string; name: string }[]
) {
  let allContacts = [];

  for (const group of groups) {
    if (!group.group_id) continue;

    const chat = await client.getChatById(group.group_id).catch(() => null);
    if (!chat.isGroup) continue;

    console.log(
      `📥 Fetching contacts from ${group.name} (${group.group_id})...`
    );

    const participants = chat.participants.map((p) => ({
      group_id: group.group_id,
      user_id: p.id._serialized,
      number: p.id.user,
    }));

    await delayRandom(console.log, 10000, 20000);

    allContacts.push(...participants);
  }

  if (allContacts.length === 0) {
    return "❌ No contacts found in the groups.";
  }

  saveGroupContactsToExcel(allContacts);
  return `✅ Contacts saved to ${GROUP_CONTACTS_FILE}`;
}
