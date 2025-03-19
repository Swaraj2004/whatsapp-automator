import {
  CursorShape,
  FlexLayout,
  QFileDialog,
  QFont,
  QLabel,
  QPushButton,
  QTableWidget,
  QTableWidgetItem,
  QWidget,
} from "@nodegui/nodegui";
import { extractContacts } from "../../backend/controllers";
import { loadContactsFromExcel } from "../../backend/utils";

export function createContactsTab(): QWidget {
  // Main container for the contacts tab
  const contactsTab = new QWidget();
  contactsTab.setObjectName("contactsTab");
  const mainLayout = new FlexLayout();
  contactsTab.setLayout(mainLayout);

  // Header
  const headerLabel = new QLabel();
  headerLabel.setObjectName("headerLabel");
  headerLabel.setText("Contacts Management");

  // Create a font for the header
  const headerFont = new QFont();
  headerFont.setPixelSize(18);
  headerFont.setBold(true);
  headerLabel.setFont(headerFont);

  // Create a HORIZONTAL layout for buttons
  const buttonContainer = new QWidget();
  buttonContainer.setObjectName("buttonContainer");
  const buttonLayout = new FlexLayout();
  buttonContainer.setLayout(buttonLayout);

  // Status label
  const statusLabel = new QLabel();
  statusLabel.setObjectName("statusLabel");

  const loadContactsButton = new QPushButton();
  loadContactsButton.setText("Load Contacts");
  loadContactsButton.setObjectName("loadContactsButton");
  loadContactsButton.setCursor(CursorShape.PointingHandCursor);
  let contactsFilePath = "";

  loadContactsButton.addEventListener("clicked", () => {
    const fileDialog = new QFileDialog();
    fileDialog.setNameFilter("Excel Files (*.xlsx)");
    fileDialog.exec();

    const selectedFiles = fileDialog.selectedFiles();
    if (selectedFiles.length > 0) {
      const filePath = selectedFiles[0];
      contactsFilePath = filePath;
      loadContacts(contactsFilePath);
    }
  });

  // Extract button
  const extractButton = new QPushButton();
  extractButton.setText("Extract Contacts");
  extractButton.setObjectName("extractButton");
  extractButton.setCursor(CursorShape.PointingHandCursor);
  extractButton.addEventListener("clicked", async () => {
    statusLabel.setText("Extracting contacts...");
    await extractContacts();
    loadContacts();
  });

  // Refresh button
  const refreshButton = new QPushButton();
  refreshButton.setText("Refresh");
  refreshButton.setObjectName("refreshButton");
  refreshButton.setCursor(CursorShape.PointingHandCursor);
  refreshButton.addEventListener("clicked", () => {
    if (contactsFilePath) loadContacts(contactsFilePath);
    else loadContacts();
  });

  // Add buttons to the horizontal layout
  buttonLayout.addWidget(loadContactsButton);
  buttonLayout.addWidget(extractButton);
  buttonLayout.addWidget(refreshButton);
  buttonLayout.addWidget(statusLabel);

  // Create the contacts table
  const contactsTable = new QTableWidget(0, 3);
  contactsTable.setObjectName("contactsTable");
  contactsTable.setColumnCount(3);
  contactsTable.setHorizontalHeaderLabels(["User ID", "Name", "Number"]);
  contactsTable.setColumnWidth(0, 150);
  contactsTable.setColumnWidth(1, 250);
  contactsTable.setColumnWidth(2, 250);

  // Maintain minimum size to ensure visibility
  contactsTable.setMinimumSize(800, 550);

  // Add widgets to main layout in correct order
  mainLayout.addWidget(headerLabel);
  mainLayout.addWidget(buttonContainer);
  mainLayout.addWidget(contactsTable);

  // Use a cleaner approach to styling with BLUE buttons
  contactsTab.setStyleSheet(`
    #contactsTab {
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
    QPushButton {
      padding: 8px 15px;
      background-color: #1E88E5;
      color: white;
      border-radius: 4px;
      min-width: 150px;
      font-weight: bold;
      margin-right: 10px;
    }
    QPushButton:hover {
      background-color:#1A66BD;
    }
    #contactsTable {
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

  // Function to load contacts
  async function loadContacts(filePath?: string) {
    try {
      statusLabel.setText("Loading contacts...");
      let contacts = [];
      if (filePath) {
        contacts = loadContactsFromExcel(filePath);
      } else {
        contacts = loadContactsFromExcel();
      }

      // Clear and update table
      contactsTable.setRowCount(0);

      if (contacts && contacts.length > 0) {
        contactsTable.setRowCount(contacts.length);
        contacts.forEach((contact, index) => {
          const userIdItem = new QTableWidgetItem(contact.user_id || "N/A");
          const nameItem = new QTableWidgetItem(contact.name || "N/A");
          const numberItem = new QTableWidgetItem(contact.number || "N/A");

          contactsTable.setItem(index, 0, userIdItem);
          contactsTable.setItem(index, 1, nameItem);
          contactsTable.setItem(index, 2, numberItem);
        });
        statusLabel.setText(`Loaded ${contacts.length} contacts.`);
      } else {
        statusLabel.setText("No contacts found");
      }

      // Ensure visibility
      contactsTable.show();
      contactsTab.update();
    } catch (error) {
      console.error("Error loading contacts:", error);
      statusLabel.setText(`Error: ${error.message || "Unknown error"}`);
    }
  }

  loadContacts();
  return contactsTab;
}
