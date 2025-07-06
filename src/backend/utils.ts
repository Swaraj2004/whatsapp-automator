import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import {
  CM_PROGRESS_LOG_FILE,
  CONFIG_FILE,
  CONTACTS_FILE,
  CONTACTS_MESSAGES_LOG_FOLDER,
  CRITICAL_ERRORS_LOG_FILE,
  DAYS_AGO,
  GM_PROGRESS_LOG_FILE,
  GROUP_CONTACTS_FILE,
  GROUPS_ADMINS_FILE,
  GROUPS_FILE,
  GROUPS_MESSAGES_LOG_FOLDER,
  SENT_MESSAGES_CONTACTS_FILE,
  SENT_MESSAGES_GROUPS_FILE,
} from "../consts";
import {
  Config,
  Contact,
  Group,
  GroupAdmin,
  MessageLog,
  VcfContact,
} from "../types";

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

export function saveGroupsAdminsToExcel(admins: GroupAdmin[]): void {
  const ws = XLSX.utils.json_to_sheet(admins);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Admins");
  XLSX.writeFile(wb, GROUPS_ADMINS_FILE);
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

export function saveContactsMessagesLogs(entry: MessageLog) {
  const currentDate = new Date();
  const dateString = currentDate.toISOString().split("T")[0];
  const logFileName = path.join(
    CONTACTS_MESSAGES_LOG_FOLDER,
    `contacts_logs_${dateString}.xlsx`
  );

  let workbook: XLSX.WorkBook;
  let data: MessageLog[] = [];

  if (fs.existsSync(logFileName)) {
    workbook = XLSX.readFile(logFileName);
    const worksheet = workbook.Sheets["AckLog"];
    if (worksheet) {
      data = XLSX.utils.sheet_to_json<MessageLog>(worksheet);
    }
  } else {
    workbook = XLSX.utils.book_new();
  }

  const existingIndex = data.findIndex(
    (d) => d.message_id === entry.message_id
  );
  if (existingIndex !== -1) {
    data[existingIndex] = entry;
  } else {
    data.push(entry);
  }

  const newSheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets["AckLog"] = newSheet;

  if (!workbook.SheetNames.includes("AckLog")) {
    workbook.SheetNames.push("AckLog");
  }

  XLSX.writeFile(workbook, logFileName);
}

export function generateInputHash({
  message,
  sendAsContact,
  attachedFiles,
  selectedTags,
}: {
  message: string;
  sendAsContact: boolean;
  attachedFiles: Map<string, string>;
  selectedTags: string[];
}) {
  const hash = crypto.createHash("sha256");
  const sortedTags = [...selectedTags].sort();
  const files = Object.fromEntries(attachedFiles);
  hash.update(JSON.stringify({ message, sendAsContact, files, sortedTags }));
  return hash.digest("hex");
}

export function saveCMProgress(data: {
  hash: string;
  sentSteps: Record<string, string[]>;
  lastErrorChat?: string;
}) {
  fs.writeFileSync(CM_PROGRESS_LOG_FILE, JSON.stringify(data, null, 2));
}

export function loadCMProgress(): {
  hash: string;
  sentSteps: Record<string, string[]>;
  lastErrorChat?: string;
} | null {
  if (!fs.existsSync(CM_PROGRESS_LOG_FILE)) return null;
  return JSON.parse(fs.readFileSync(CM_PROGRESS_LOG_FILE, "utf-8"));
}

export function clearCMProgress() {
  if (fs.existsSync(CM_PROGRESS_LOG_FILE)) fs.unlinkSync(CM_PROGRESS_LOG_FILE);
}

export function logCMCriticalError(contactName: string, error: Error) {
  const line = `[${new Date().toISOString()}] Error on contact ${contactName}: ${
    error.message
  }\n`;
  fs.appendFileSync(CRITICAL_ERRORS_LOG_FILE, line);
}

export function cleanupOldContactsLogs() {
  if (!fs.existsSync(CONTACTS_MESSAGES_LOG_FOLDER)) {
    fs.mkdirSync(CONTACTS_MESSAGES_LOG_FOLDER, { recursive: true });
    return;
  }

  const files = fs.readdirSync(CONTACTS_MESSAGES_LOG_FOLDER);

  files.forEach((file) => {
    const filePath = path.join(CONTACTS_MESSAGES_LOG_FOLDER, file);
    const stats = fs.statSync(filePath);

    const fileAge = stats.mtimeMs;

    if (fileAge < DAYS_AGO) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old contacts messages log file: ${file}`);
    }
  });
}

export function saveGroupsMessagesLogs(entry: MessageLog) {
  const currentDate = new Date();
  const dateString = currentDate.toISOString().split("T")[0];
  const logFileName = path.join(
    GROUPS_MESSAGES_LOG_FOLDER,
    `groups_logs_${dateString}.xlsx`
  );

  let workbook: XLSX.WorkBook;
  let data: MessageLog[] = [];

  if (fs.existsSync(logFileName)) {
    workbook = XLSX.readFile(logFileName);
    const worksheet = workbook.Sheets["AckLog"];
    if (worksheet) {
      data = XLSX.utils.sheet_to_json<MessageLog>(worksheet);
    }
  } else {
    workbook = XLSX.utils.book_new();
  }

  const existingIndex = data.findIndex(
    (d) => d.message_id === entry.message_id
  );
  if (existingIndex !== -1) {
    data[existingIndex] = entry;
  } else {
    data.push(entry);
  }

  const newSheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets["AckLog"] = newSheet;

  if (!workbook.SheetNames.includes("AckLog")) {
    workbook.SheetNames.push("AckLog");
  }

  XLSX.writeFile(workbook, logFileName);
}

export function saveGMProgress(data: {
  hash: string;
  sentSteps: Record<string, string[]>;
  lastErrorChat?: string;
}) {
  fs.writeFileSync(GM_PROGRESS_LOG_FILE, JSON.stringify(data, null, 2));
}

export function loadGMProgress(): {
  hash: string;
  sentSteps: Record<string, string[]>;
  lastErrorChat?: string;
} | null {
  if (!fs.existsSync(GM_PROGRESS_LOG_FILE)) return null;
  return JSON.parse(fs.readFileSync(GM_PROGRESS_LOG_FILE, "utf-8"));
}

export function clearGMProgress() {
  if (fs.existsSync(GM_PROGRESS_LOG_FILE)) fs.unlinkSync(GM_PROGRESS_LOG_FILE);
}

export function logGMCriticalError(groupName: string, error: Error) {
  const line = `[${new Date().toISOString()}] Error on group ${groupName}: ${
    error.message
  }\n`;
  fs.appendFileSync(CRITICAL_ERRORS_LOG_FILE, line);
}

export function cleanupOldGroupsLogs() {
  if (!fs.existsSync(GROUPS_MESSAGES_LOG_FOLDER)) {
    fs.mkdirSync(GROUPS_MESSAGES_LOG_FOLDER, { recursive: true });
    return;
  }

  const files = fs.readdirSync(GROUPS_MESSAGES_LOG_FOLDER);

  files.forEach((file) => {
    const filePath = path.join(GROUPS_MESSAGES_LOG_FOLDER, file);
    const stats = fs.statSync(filePath);

    const fileAge = stats.mtimeMs;

    if (fileAge < DAYS_AGO) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old groups messages log file: ${file}`);
    }
  });
}

export function loadVcfContactsFromExcel(
  filePath: string,
  logger = console.log
): { contacts: VcfContact[] } {
  if (!filePath || !fs.existsSync(filePath)) {
    logger("❌ No contacts file found!");
    return { contacts: [] };
  }

  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      logger("❌ Sheet not found in the file!");
      return { contacts: [] };
    }

    const contacts = XLSX.utils.sheet_to_json<VcfContact>(sheet);
    const vcfContacts = contacts.map((contact) => {
      const { name, number, filename } = contact;
      return {
        name: name || "N/A",
        number: (typeof number === "number" ? `${number}` : number) || "N/A",
        filename: filename || "N/A",
      };
    });

    return {
      contacts: vcfContacts,
    };
  } catch (error) {
    logger(`❌ Error reading contacts file: ${error.message}`);
    return { contacts: [] };
  }
}
