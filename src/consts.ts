import * as path from "path";

export const DATA_FOLDER = "data";
export const BASE_DIR = path.join(process.cwd(), DATA_FOLDER);
export const SESSION_PATH = path.join(BASE_DIR, "session");
export const FILES_SAVE_DIR = path.join(BASE_DIR, "received_files");

export const SENT_MESSAGES_CONTACTS_FILE = path.join(
  BASE_DIR,
  "sent_messages_contacts.json"
);
export const SENT_MESSAGES_GROUPS_FILE = path.join(
  BASE_DIR,
  "sent_messages_groups.json"
);
export const CONFIG_FILE = path.join(BASE_DIR, "config.json");
export const GROUPS_FILE = path.join(BASE_DIR, "groups.xlsx");
export const CONTACTS_FILE = path.join(BASE_DIR, "contacts.xlsx");
export const GROUP_CONTACTS_FILE = path.join(BASE_DIR, "group_contacts.xlsx");
export const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];
