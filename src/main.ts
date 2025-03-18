import {
  FlexLayout,
  QIcon,
  QMainWindow,
  QTabWidget,
  QWidget,
} from "@nodegui/nodegui";
import WhatsAppClient from "./backend/client";
import { createContactsTab } from "./ui/tabs/contacts";
import { createGroupContactsTab } from "./ui/tabs/groupContacts";
import { createGroupsTab } from "./ui/tabs/groups";
import { createMessageContactsTab } from "./ui/tabs/messageContacts";
import { createMessageGroupsTab } from "./ui/tabs/messageGroups";

// Initialize QApplication
const mainWindow = new QMainWindow();
mainWindow.setWindowTitle("WhatsApp Bulk Messenger");

// Set minimum window size
mainWindow.setMinimumSize(800, 600);

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

// Make the tab widget fill the available space
tabWidget.setStyleSheet(`
  #tabWidget {
    flex: 1;
  }
`);

layout.addWidget(tabWidget);
mainWindow.setCentralWidget(centralWidget);
mainWindow.resize(1280, 720); // Start with a comfortable default size
mainWindow.show();

// Wait for WhatsApp Client to be ready before launching UI
WhatsAppClient.on("ready", () => {
  console.log("✅ WhatsApp Client is ready! Launching GUI...");
});
