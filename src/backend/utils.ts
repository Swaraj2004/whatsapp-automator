import * as fs from "fs";
import * as XLSX from "xlsx";
import { CONTACTS_FILE, GROUP_CONTACTS_FILE, GROUPS_FILE } from "../consts";

type Contact = {
  group_id?: string;
  user_id: string;
  name?: string;
  number: string;
  tags?: string;
};

type Group = {
  name: string;
  group_id: string;
  invite_link: string;
  admin_only: string;
};

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

    return {
      contacts,
      tags: Array.from(uniqueTags),
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
): Group[] {
  const targetFile = filePath || GROUPS_FILE;

  if (!targetFile || !fs.existsSync(targetFile)) {
    logger("❌ No groups file found!");
    return [];
  }

  try {
    const workbook = XLSX.readFile(filePath || GROUPS_FILE);
    const sheet = workbook.Sheets["Groups"];
    if (!sheet) {
      logger("❌ 'Groups' sheet not found in the file!");
      return [];
    }
    return XLSX.utils.sheet_to_json<Group>(sheet);
  } catch (error) {
    logger(`❌ Error reading groups file: ${error.message}`);
    return [];
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
