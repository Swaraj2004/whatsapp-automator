import {
  FlexLayout,
  QIcon,
  QMainWindow,
  QTabWidget,
  QWidget,
} from "@nodegui/nodegui";
import dotenv from "dotenv";
import path from "path";
import WhatsAppClient from "./backend/client";
import { cleanupOldContactsLogs, cleanupOldGroupsLogs } from "./backend/utils";
import { initWebSocket } from "./backend/wsClient";
import { createContactsTab } from "./ui/tabs/contacts";
import { createGroupContactsTab } from "./ui/tabs/groupContacts";
import { createGroupsTab } from "./ui/tabs/groups";
import { createMessageContactsTab } from "./ui/tabs/messageContacts";
import { createMessageGroupsTab } from "./ui/tabs/messageGroups";
import { createSettingsTab } from "./ui/tabs/settings";
import { createVCFGeneratorTab } from "./ui/tabs/vcfGenerator";

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, ".env.pass") });

async function verifyPassword() {
  const API_URL = process.env.API_URL;
  const PASSWORDS = process.env.PASSWORDS?.split(",") || [];

  if (!API_URL || PASSWORDS.length === 0) {
    console.error("❌ Missing API_URL or PASSWORDS in .env.pass");
    process.exit(1);
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwords: PASSWORDS }),
    });

    const data = await response.json();

    if (!data.match) {
      console.error("❌ Password verification failed. Exiting application.");
      process.exit(1);
    } else {
      console.log("✅ Password verified successfully.");
    }
  } catch (error) {
    console.error("❌ Error verifying password:", error);
    process.exit(1);
  }
}

function waitForWhatsAppClient() {
  return new Promise<void>((resolve, reject) => {
    WhatsAppClient.on("ready", () => {
      console.log("✅ WhatsApp Client is ready!");
      resolve();
    });

    // If for some reason "ready" event is not fired within a reasonable time, reject
    setTimeout(() => {
      reject(
        new Error("❌ WhatsApp Client did not become ready within timeout")
      );
    }, 200000);
  });
}

async function startApp() {
  // Wait for password verification
  await verifyPassword();

  // Wait for WhatsApp Client to be ready
  await waitForWhatsAppClient();

  // Initialize QApplication
  const mainWindow = new QMainWindow();
  mainWindow.setWindowTitle(
    `CRoad WAA ${process.env.PHONE_NAME ? `(${process.env.PHONE_NAME})` : ""}`
  );

  // Set application icon
  const iconPath = path.join(__dirname, "../assets/icon.ico");
  const appIcon = new QIcon(iconPath);
  mainWindow.setWindowIcon(appIcon);

  // Set minimum window size
  mainWindow.setMinimumSize(1280, 720);

  // Set up main widget and layout
  const centralWidget = new QWidget();
  const layout = new FlexLayout();
  centralWidget.setLayout(layout);
  centralWidget.setObjectName("centralWidget");

  // Apply some styling to the central widget
  centralWidget.setStyleSheet(`
    #centralWidget {
      background-color: #f5f5f5;
      padding: 10px;
    }
  `);

  // Create tab widget
  const tabWidget = new QTabWidget();
  tabWidget.setObjectName("tabWidget");
  tabWidget.addTab(createContactsTab(), new QIcon(), "Contacts");
  tabWidget.addTab(createGroupsTab(), new QIcon(), "Groups");
  tabWidget.addTab(createGroupContactsTab(), new QIcon(), "Group Contacts");
  tabWidget.addTab(createMessageContactsTab(), new QIcon(), "Message Contacts");
  tabWidget.addTab(createMessageGroupsTab(), new QIcon(), "Message Groups");
  tabWidget.addTab(createVCFGeneratorTab(), new QIcon(), "VCF Generator");
  tabWidget.addTab(createSettingsTab(), new QIcon(), "Settings");

  // Make the tab widget fill the available space
  tabWidget.setStyleSheet(`
    #tabWidget {
      flex: 1;
    }
  `);

  layout.addWidget(tabWidget);
  mainWindow.setCentralWidget(centralWidget);
  mainWindow.resize(1280, 720);
  mainWindow.show();

  initWebSocket(); // Initialize WebSocket connection
  // Cleanup old logs
  cleanupOldContactsLogs();
  cleanupOldGroupsLogs();
}

startApp().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
