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
import { generateVcfFiles } from "../../backend/controllers";
import { loadVcfContactsFromExcel } from "../../backend/utils";
import { VcfContact } from "../../types";

export function createVCFGeneratorTab(): QWidget {
  const vcfGeneratorTab = new QWidget();
  vcfGeneratorTab.setObjectName("vcfGeneratorTab");
  const mainLayout = new FlexLayout();
  vcfGeneratorTab.setLayout(mainLayout);

  const headerLabel = new QLabel();
  headerLabel.setObjectName("headerLabel");
  headerLabel.setText("VCF Generator");

  const headerFont = new QFont();
  headerFont.setPixelSize(18);
  headerFont.setBold(true);
  headerLabel.setFont(headerFont);

  const buttonContainer = new QWidget();
  buttonContainer.setObjectName("buttonContainer");
  const buttonLayout = new FlexLayout();
  buttonContainer.setLayout(buttonLayout);

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
      loadVcfContacts(contactsFilePath);
    }
  });

  const generateButton = new QPushButton();
  generateButton.setText("Generate VCF");
  generateButton.setObjectName("generateButton");
  generateButton.setCursor(CursorShape.PointingHandCursor);
  generateButton.addEventListener("clicked", async () => {
    statusLabel.setText("Generating VCF...");
    const { contacts } = loadVcfContactsFromExcel(contactsFilePath);
    if (contacts && contacts.length > 0) {
      await generateVcfFiles(contacts);
      statusLabel.setText(`VCF generated.`);
    } else {
      statusLabel.setText("No contacts to generate VCF.");
    }
  });

  const refreshButton = new QPushButton();
  refreshButton.setText("Refresh");
  refreshButton.setObjectName("refreshButton");
  refreshButton.setCursor(CursorShape.PointingHandCursor);
  refreshButton.addEventListener("clicked", () => {
    if (contactsFilePath) loadVcfContacts(contactsFilePath);
  });

  buttonLayout.addWidget(loadContactsButton);
  buttonLayout.addWidget(generateButton);
  buttonLayout.addWidget(refreshButton);
  buttonLayout.addWidget(statusLabel);

  const contactsTable = new QTableWidget(0, 3);
  contactsTable.setObjectName("contactsTable");
  contactsTable.setColumnCount(3);
  contactsTable.setHorizontalHeaderLabels(["Name", "Number", "File Name"]);
  contactsTable.setColumnWidth(0, 250);
  contactsTable.setColumnWidth(1, 250);
  contactsTable.setColumnWidth(2, 250);

  contactsTable.setMinimumSize(800, 550);

  mainLayout.addWidget(headerLabel);
  mainLayout.addWidget(buttonContainer);
  mainLayout.addWidget(contactsTable);

  vcfGeneratorTab.setStyleSheet(`
    #vcfGeneratorTab {
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
      background-color: #2074d4;
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

  async function loadVcfContacts(filePath: string) {
    try {
      statusLabel.setText("Loading contacts...");
      let contacts: VcfContact[] = [];
      if (filePath) {
        const res = loadVcfContactsFromExcel(filePath);
        console.log("Loaded contacts:", res);
        contacts = res.contacts;
      }

      contactsTable.setRowCount(0);

      if (contacts && contacts.length > 0) {
        contactsTable.setRowCount(contacts.length);
        contacts.forEach((contact, index) => {
          const nameItem = new QTableWidgetItem(contact.name || "N/A");
          const numberItem = new QTableWidgetItem(contact.number || "N/A");
          const filenameItem = new QTableWidgetItem(contact.filename || "N/A");

          contactsTable.setItem(index, 0, nameItem);
          contactsTable.setItem(index, 1, numberItem);
          contactsTable.setItem(index, 2, filenameItem);
        });
        statusLabel.setText(`Loaded ${contacts.length} contacts.`);
      } else {
        statusLabel.setText("No contacts found.");
      }

      contactsTable.show();
      vcfGeneratorTab.update();
    } catch (error) {
      console.error("Error loading contacts:", error);
      statusLabel.setText(`Error: ${error.message || "Unknown error"}`);
    }
  }

  return vcfGeneratorTab;
}
