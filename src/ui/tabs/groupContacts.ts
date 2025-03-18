import {
  FlexLayout,
  QPushButton,
  QTableWidget,
  QTableWidgetItem,
  QWidget,
  QLabel,
  QLineEdit,
  QFont,
  CursorShape,
} from "@nodegui/nodegui";
import { loadGroupContactsFromExcel } from "../../backend/utils";
import { extractGroupContacts } from "../../backend/controllers";

export function createGroupContactsTab(): QWidget {
  // Main container
  const groupContactsTab = new QWidget();
  groupContactsTab.setObjectName("groupContactsTab");
  const mainLayout = new FlexLayout();
  groupContactsTab.setLayout(mainLayout);

  // Header
  const headerLabel = new QLabel();
  headerLabel.setObjectName("headerLabel");
  headerLabel.setText("Group Contacts Management");

  const headerFont = new QFont();
  headerFont.setPixelSize(18);
  headerFont.setBold(true);
  headerLabel.setFont(headerFont);

  const buttonContainer = new QWidget();
  buttonContainer.setObjectName("buttonContainer");
  const buttonLayout = new FlexLayout();
  buttonContainer.setLayout(buttonLayout);

  // Status label
  const statusLabel = new QLabel();
  statusLabel.setObjectName("statusLabel");

  // Input field for Group ID
  const groupIdInput = new QLineEdit();
  groupIdInput.setObjectName("groupIdInput");
  groupIdInput.setPlaceholderText("Enter Group ID...");

  // Extract button
  const extractButton = new QPushButton();
  extractButton.setText("Extract Contacts");
  extractButton.setObjectName("extractButton");
  extractButton.setCursor(CursorShape.PointingHandCursor);
  extractButton.addEventListener("clicked", async () => {
    const groupId = groupIdInput.text().trim();
    if (!groupId) {
      statusLabel.setText("Please enter a valid Group ID!");
      return;
    }

    statusLabel.setText("Extracting contacts...");
    const res = await extractGroupContacts(groupId);
    if (typeof res === "string") {
      statusLabel.setText(res);
    }
    loadGroupContacts();
  });

  buttonLayout.addWidget(groupIdInput);
  buttonLayout.addWidget(extractButton);
  buttonLayout.addWidget(statusLabel);

  // Table to display group contacts
  const groupContactsTable = new QTableWidget(0, 2);
  groupContactsTable.setObjectName("groupContactsTable");
  groupContactsTable.setHorizontalHeaderLabels(["User ID", "Number"]);
  groupContactsTable.setColumnWidth(0, 250);
  groupContactsTable.setColumnWidth(1, 250);
  groupContactsTable.setMinimumSize(800, 550);

  // Add widgets to layout
  mainLayout.addWidget(headerLabel);
  mainLayout.addWidget(buttonContainer);
  mainLayout.addWidget(groupContactsTable);

  // Style
  groupContactsTab.setStyleSheet(`
    #groupContactsTab {
      background-color: white;
      padding: 15px;
    }
    #headerLabel {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    #buttonContainer {
      flex-direction: row;
      margin-bottom: 10px;
    }
    #groupIdInput {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 300px;
    }
    QPushButton {
      padding: 8px 15px;
      background-color: #1E88E5;
      color: white;
      border-radius: 4px;
      font-weight: bold;
      margin-left: 10px;
    }
    QPushButton:hover {
      background-color: #1A66BD;
    }
    #groupContactsTable {
      border: 1px solid #ccc;
      border-radius: 4px;
      gridline-color: #eee;
    }
    #statusLabel {
      color: #333;
      font-size: 14px;
      font-weight: bold;
    }
  `);

  // Load contacts from Excel
  async function loadGroupContacts() {
    try {
      statusLabel.setText("Loading contacts...");
      const contacts = await loadGroupContactsFromExcel();

      groupContactsTable.setRowCount(0);

      if (contacts && contacts.length > 0) {
        groupContactsTable.setRowCount(contacts.length);
        contacts.forEach((contact, index) => {
          groupContactsTable.setItem(
            index,
            0,
            new QTableWidgetItem(contact.user_id || "")
          );
          groupContactsTable.setItem(
            index,
            1,
            new QTableWidgetItem(contact.number || "")
          );
        });
        statusLabel.setText(`Loaded ${contacts.length} contacts.`);
      } else {
        statusLabel.setText("No contacts found");
      }

      groupContactsTable.show();
      groupContactsTab.update();
    } catch (error) {
      console.error("Error loading group contacts:", error);
      statusLabel.setText(`Error: ${error.message || "Unknown error"}`);
    }
  }

  return groupContactsTab;
}
