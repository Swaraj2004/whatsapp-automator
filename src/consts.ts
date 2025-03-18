import * as path from "path";

export const DATA_FOLDER = "data";
export const BASE_DIR = path.join(process.cwd(), DATA_FOLDER);
export const SESSION_PATH = path.join(BASE_DIR, "session");
export const MEDIA_DIR = path.join(BASE_DIR, "media");

export const SENT_MESSAGES_FILE = path.join(BASE_DIR, "sent_messages.json");
export const MESSAGE_FILE = path.join(BASE_DIR, "message.txt");
export const GROUPS_FILE = path.join(BASE_DIR, "groups.xlsx");
export const CONTACTS_FILE = path.join(BASE_DIR, "contacts.xlsx");
export const GROUP_CONTACTS_FILE = path.join(BASE_DIR, "group_contacts.xlsx");
export const MULTIPLE_GROUP_CONTACTS_FILE = path.join(
  BASE_DIR,
  "multiple_group_contacts.xlsx"
);
export const CHROME_PATH =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
