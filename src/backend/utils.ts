import * as fs from "fs";
import * as XLSX from "xlsx";
import {
  CONFIG_FILE,
  CONTACTS_FILE,
  GROUP_CONTACTS_FILE,
  GROUPS_FILE,
  SENT_MESSAGES_CONTACTS_FILE,
  SENT_MESSAGES_GROUPS_FILE,
} from "../consts";

type Contact = {
  group_id?: string;
  group_name?: string;
  user_id: string;
  name?: string;
  number: string;
  tags?: string;
};

type Group = {
  name: string;
  group_id: string;
  total_members: number;
  invite_link?: string;
  admin_only?: string;
  tags?: string;
};

type Config = {
  delay: {
    min: number;
    max: number;
  };
};

export function getConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return {
        delay: {
          min: 6000,
          max: 15000,
        },
      };
    }
    const data = fs.readFileSync(CONFIG_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading config:", error);
    return {
      delay: {
        min: 6000,
        max: 15000,
      },
    };
  }
}

export function setConfig(newConfig: Config) {
  try {
    const currentConfig = getConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify(updatedConfig, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Error writing config:", error);
  }
}

export function delayRandom(logger = console.log, min = 6000, max = 15000) {
  const range = max - min;
  const delay = min + Math.pow(Math.random(), 2) * range;
  logger(`⏳ Waiting ${(delay / 1000).toFixed(2)} seconds...`);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function saveContactsToExcel(contacts: Contact[]): void {
  const ws = XLSX.utils.json_to_sheet(contacts);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contacts");
  XLSX.writeFile(wb, CONTACTS_FILE);
}

export function loadContactsFromExcel(
  filePath?: string,
  logger = console.log
): { contacts: Contact[]; tags: string[] } {
  const targetFile = filePath || CONTACTS_FILE;

  if (!targetFile || !fs.existsSync(targetFile)) {
    logger("❌ No contacts file found!");
    return { contacts: [], tags: ["All"] };
  }

  try {
    const workbook = XLSX.readFile(targetFile);
    const sheet = workbook.Sheets["Contacts"];
    if (!sheet) {
      logger("❌ 'Contacts' sheet not found in the file!");
      return { contacts: [], tags: ["All"] };
    }

    const contacts = XLSX.utils.sheet_to_json<Contact>(sheet);

    // Extract all unique tags from the contacts
    const uniqueTags = new Set<string>();
    uniqueTags.add("All"); // Always include "All" option

    for (const contact of contacts) {
      if (contact.tags) {
        const tagsList = contact.tags
          .toString()
          .split(",")
          .map((tag) => tag.trim());
        tagsList.forEach((tag) => {
          if (tag) uniqueTags.add(tag);
        });
      }
    }

    const sortedTags = ["All", ...Array.from(uniqueTags).sort()];

    return {
      contacts,
      tags: sortedTags,
    };
  } catch (error) {
    logger(`❌ Error reading contacts file: ${error.message}`);
    return { contacts: [], tags: ["All"] };
  }
}

export function saveGroupsToExcel(groups: Group[]): void {
  const ws = XLSX.utils.json_to_sheet(groups);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Groups");
  XLSX.writeFile(wb, GROUPS_FILE);
}

export function loadGroupsFromExcel(
  filePath?: string,
  logger = console.log
): { groups: Group[]; tags: string[] } {
  const targetFile = filePath || GROUPS_FILE;

  if (!targetFile || !fs.existsSync(targetFile)) {
    logger("❌ No groups file found!");
    return { groups: [], tags: ["All"] };
  }

  try {
    const workbook = XLSX.readFile(filePath || GROUPS_FILE);
    const sheet = workbook.Sheets["Groups"];
    if (!sheet) {
      logger("❌ 'Groups' sheet not found in the file!");
      return { groups: [], tags: ["All"] };
    }
    const groups = XLSX.utils.sheet_to_json<Group>(sheet);

    // Extract all unique tags from the contacts
    const uniqueTags = new Set<string>();
    uniqueTags.add("All"); // Always include "All" option

    for (const group of groups) {
      if (group.tags) {
        const tagsList = group.tags
          .toString()
          .split(",")
          .map((tag) => tag.trim());
        tagsList.forEach((tag) => {
          if (tag) uniqueTags.add(tag);
        });
      }
    }

    const sortedTags = ["All", ...Array.from(uniqueTags).sort()];

    return {
      groups,
      tags: sortedTags,
    };
  } catch (error) {
    logger(`❌ Error reading groups file: ${error.message}`);
    return { groups: [], tags: ["All"] };
  }
}

export function saveGroupContactsToExcel(contacts: Contact[]): void {
  const ws = XLSX.utils.json_to_sheet(contacts);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contacts");
  XLSX.writeFile(wb, GROUP_CONTACTS_FILE);
}

export function loadGroupContactsFromExcel(
  filePath?: string,
  logger = console.log
): Contact[] {
  const targetFile = filePath || GROUP_CONTACTS_FILE;

  if (!targetFile || !fs.existsSync(targetFile)) {
    logger("❌ No group contacts file found!");
    return [];
  }

  try {
    const workbook = XLSX.readFile(targetFile);
    const sheet = workbook.Sheets["Contacts"];
    if (!sheet) {
      logger("❌ 'Contacts' sheet not found in the file!");
      return [];
    }
    return XLSX.utils.sheet_to_json<Contact>(sheet);
  } catch (error) {
    logger(`❌ Error reading group contacts file: ${error.message}`);
    return [];
  }
}

export function loadSentMessagesContacts() {
  if (fs.existsSync(SENT_MESSAGES_CONTACTS_FILE)) {
    return JSON.parse(fs.readFileSync(SENT_MESSAGES_CONTACTS_FILE, "utf-8"));
  }
  return [];
}

export function saveSentMessagesContacts(messages) {
  fs.writeFileSync(
    SENT_MESSAGES_CONTACTS_FILE,
    JSON.stringify(messages, null, 2)
  );
}

export function loadSentMessagesGroups() {
  if (fs.existsSync(SENT_MESSAGES_GROUPS_FILE)) {
    return JSON.parse(fs.readFileSync(SENT_MESSAGES_GROUPS_FILE, "utf-8"));
  }
  return [];
}

export function saveSentMessagesGroups(messages) {
  fs.writeFileSync(
    SENT_MESSAGES_GROUPS_FILE,
    JSON.stringify(messages, null, 2)
  );
}
