import * as path from "path";

export const DATA_FOLDER = "data";
export const BASE_DIR = path.join(process.cwd(), DATA_FOLDER);
export const SESSION_PATH = path.join(BASE_DIR, "session");
export const FILES_SAVE_DIR = path.join(BASE_DIR, "received_files");
export const VCF_SAVE_DIR = path.join(BASE_DIR, "vcf_files");

export const SENT_MESSAGES_CONTACTS_FILE = path.join(
  BASE_DIR,
  "sent_messages_contacts.json"
);
export const SENT_MESSAGES_GROUPS_FILE = path.join(
  BASE_DIR,
  "sent_messages_groups.json"
);
export const CM_PROGRESS_LOG_FILE = path.join(
  BASE_DIR,
  "contacts_messages_progress.json"
);
export const GM_PROGRESS_LOG_FILE = path.join(
  BASE_DIR,
  "groups_messages_progress.json"
);
export const CRITICAL_ERRORS_LOG_FILE = path.join(
  BASE_DIR,
  "critical_errors.log"
);
export const CONFIG_FILE = path.join(BASE_DIR, "config.json");
export const GROUPS_FILE = path.join(BASE_DIR, "groups.xlsx");
export const CONTACTS_FILE = path.join(BASE_DIR, "contacts.xlsx");
export const GROUP_CONTACTS_FILE = path.join(BASE_DIR, "group_contacts.xlsx");
export const CONTACTS_MESSAGES_LOG_FOLDER = path.join(
  BASE_DIR,
  "contacts_messages_logs"
);
export const GROUPS_MESSAGES_LOG_FOLDER = path.join(
  BASE_DIR,
  "groups_messages_logs"
);
export const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

export const DAYS_AGO = Date.now() - 10 * 24 * 60 * 60 * 1000;
