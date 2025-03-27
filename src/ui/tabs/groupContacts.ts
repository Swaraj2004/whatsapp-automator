import {
  CursorShape,
  FlexLayout,
  QFileDialog,
  QFont,
  QLabel,
  QLineEdit,
  QPushButton,
  QTableWidget,
  QTableWidgetItem,
  QTextEdit,
  QWidget,
} from "@nodegui/nodegui";
import {
  extractGroupContacts,
  extractMultipleGroupContacts,
} from "../../backend/controllers";
import {
  loadGroupContactsFromExcel,
  loadGroupsFromExcel,
} from "../../backend/utils";

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

  // Input field for Group ID
  const groupIdInput = new QLineEdit();
  groupIdInput.setObjectName("groupIdInput");
  groupIdInput.setPlaceholderText("Enter Group ID...");

  // Extract button
  const extractByIdButton = new QPushButton();
  extractByIdButton.setText("Extract Contacts By ID");
  extractByIdButton.setObjectName("extractByIdButton");
  extractByIdButton.setCursor(CursorShape.PointingHandCursor);
  extractByIdButton.addEventListener("clicked", async () => {
    logsContainer.clear();
    const groupId = groupIdInput.text().trim();
    if (!groupId) {
      logMessage("❌ Please enter a valid Group ID!");
      return;
    }

    logMessage("✅ Started extracting contacts by ID...");
    await extractGroupContacts(groupId, logMessage);
    loadGroupContacts();
  });

  const extractByExcelButton = new QPushButton();
  extractByExcelButton.setText("Extract Contacts By Excel");
  extractByExcelButton.setObjectName("extractByExcelButton");
  extractByExcelButton.setCursor(CursorShape.PointingHandCursor);

  let groupsFilePath = "";
  extractByExcelButton.addEventListener("clicked", async () => {
    logsContainer.clear();
    const fileDialog = new QFileDialog();
    fileDialog.setNameFilter("Excel Files (*.xlsx)");
    fileDialog.exec();

    const selectedFiles = fileDialog.selectedFiles();
    if (selectedFiles.length > 0) {
      const filePath = selectedFiles[0];
      groupsFilePath = filePath;
      const response = loadGroupsFromExcel(groupsFilePath);
      if (response.groups.length === 0) {
        logMessage("❌ No groups found!");
        return;
      }

      logMessage("✅ Started extracting contacts by Excel...");
      await extractMultipleGroupContacts(response.groups, logMessage);
      loadGroupContacts();
    }
  });

  buttonLayout.addWidget(groupIdInput);
  buttonLayout.addWidget(extractByIdButton);
  buttonLayout.addWidget(extractByExcelButton);

  const bottomContainer = new QWidget();
  bottomContainer.setObjectName("bottomContainer");
  const bottomLayout = new FlexLayout();
  bottomContainer.setLayout(bottomLayout);

  // Table to display group contacts
  const groupContactsTable = new QTableWidget(0, 4);
  groupContactsTable.setObjectName("groupContactsTable");
  groupContactsTable.setHorizontalHeaderLabels([
    "Group ID",
    "Group Name",
    "User ID",
    "Number",
  ]);
  groupContactsTable.setColumnWidth(0, 240);
  groupContactsTable.setColumnWidth(1, 240);
  groupContactsTable.setColumnWidth(2, 160);
  groupContactsTable.setColumnWidth(3, 150);
  groupContactsTable.setMinimumSize(750, 550);

  const logsContainer = new QTextEdit();
  logsContainer.setPlaceholderText("Logs from function");
  logsContainer.setObjectName("logsContainer");
  logsContainer.setReadOnly(true);

  function logMessage(msg: string) {
    logsContainer.append(msg + "\n");
  }

  bottomLayout.addWidget(groupContactsTable);
  bottomLayout.addWidget(logsContainer);

  // Add widgets to layout
  mainLayout.addWidget(headerLabel);
  mainLayout.addWidget(buttonContainer);
  mainLayout.addWidget(bottomContainer);

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
      margin-right: 10px;
    }
    QPushButton {
      padding: 8px 15px;
      background-color: #1E88E5;
      color: white;
      border-radius: 4px;
      font-weight: bold;
      margin-right: 10px;
      min-width: 160px;
    }
    QPushButton:hover {
      background-color: #2074d4;
    }
    #bottomContainer {
      flex-direction: row;
      height: 550px;
    }
    #logsContainer {
      width: 400px;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 5px;
      margin-left: 10px;
    }
    #groupContactsTable {
      flex: 1;
      border: 1px solid #ccc;
      border-radius: 4px;
      gridline-color: #eee;
    }
    #statusLabel {
      color: #333;
      font-size: 14px;
      font-weight: bold;
      min-width: 300px;
    }
  `);

  // Load contacts from Excel
  async function loadGroupContacts() {
    try {
      const contacts = loadGroupContactsFromExcel();

      groupContactsTable.setRowCount(0);

      if (contacts && contacts.length > 0) {
        groupContactsTable.setRowCount(contacts.length);
        contacts.forEach((contact, index) => {
          groupContactsTable.setItem(
            index,
            0,
            new QTableWidgetItem(contact.group_id || "N/A")
          );
          groupContactsTable.setItem(
            index,
            1,
            new QTableWidgetItem(contact.group_name || "N/A")
          );
          groupContactsTable.setItem(
            index,
            2,
            new QTableWidgetItem(contact.user_id || "N/A")
          );
          groupContactsTable.setItem(
            index,
            3,
            new QTableWidgetItem(contact.number || "N/A")
          );
        });
        logMessage(`✅ Loaded ${contacts.length} contacts.`);
      } else {
        logMessage("❌ No contacts found");
      }

      groupContactsTable.show();
      groupContactsTab.update();
    } catch (error) {
      logMessage(`❌ Error: ${error.message || "Unknown error"}`);
    }
  }

  return groupContactsTab;
}
