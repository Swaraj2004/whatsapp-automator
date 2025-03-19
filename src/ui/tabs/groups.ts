import {
  FlexLayout,
  QPushButton,
  QTableWidget,
  QTableWidgetItem,
  QWidget,
  QLabel,
  QFont,
  CursorShape,
  QFileDialog,
} from "@nodegui/nodegui";
import { extractGroups } from "../../backend/controllers";
import { loadGroupsFromExcel } from "../../backend/utils";

export function createGroupsTab(): QWidget {
  const groupsTab = new QWidget();
  groupsTab.setObjectName("groupsTab");
  const mainLayout = new FlexLayout();
  groupsTab.setLayout(mainLayout);

  const headerLabel = new QLabel();
  headerLabel.setObjectName("headerLabel");
  headerLabel.setText("Groups Management");

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

  const loadGroupsButton = new QPushButton();
  loadGroupsButton.setText("Load Groups");
  loadGroupsButton.setObjectName("loadGroupsButton");
  loadGroupsButton.setCursor(CursorShape.PointingHandCursor);
  let groupsFilePath = "";

  loadGroupsButton.addEventListener("clicked", () => {
    const fileDialog = new QFileDialog();
    fileDialog.setNameFilter("Excel Files (*.xlsx)");
    fileDialog.exec();

    const selectedFiles = fileDialog.selectedFiles();
    if (selectedFiles.length > 0) {
      const filePath = selectedFiles[0];
      groupsFilePath = filePath;
      loadGroups(groupsFilePath);
    }
  });

  const extractButton = new QPushButton();
  extractButton.setText("Extract Groups");
  extractButton.setObjectName("extractButton");
  extractButton.setCursor(CursorShape.PointingHandCursor);
  extractButton.addEventListener("clicked", async () => {
    statusLabel.setText("Extracting groups...");
    await extractGroups();
    loadGroups();
  });

  const refreshButton = new QPushButton();
  refreshButton.setText("Refresh");
  refreshButton.setObjectName("refreshButton");
  refreshButton.setCursor(CursorShape.PointingHandCursor);
  refreshButton.addEventListener("clicked", () => {
    if (groupsFilePath) loadGroups(groupsFilePath);
    else loadGroups();
  });

  buttonLayout.addWidget(loadGroupsButton);
  buttonLayout.addWidget(extractButton);
  buttonLayout.addWidget(refreshButton);
  buttonLayout.addWidget(statusLabel);

  const groupsTable = new QTableWidget(0, 4);
  groupsTable.setObjectName("groupsTable");
  groupsTable.setHorizontalHeaderLabels([
    "Group Name",
    "Group ID",
    "Invite Link",
    "Admin Only",
  ]);
  groupsTable.setColumnWidth(0, 200);
  groupsTable.setColumnWidth(1, 200);
  groupsTable.setColumnWidth(2, 250);
  groupsTable.setColumnWidth(3, 100);
  groupsTable.setMinimumSize(800, 550);

  mainLayout.addWidget(headerLabel);
  mainLayout.addWidget(buttonContainer);
  mainLayout.addWidget(groupsTable);

  groupsTab.setStyleSheet(`
    #groupsTab {
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
      background-color: #1A66BD;
    }
    #groupsTable {
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

  async function loadGroups(fileName?: string) {
    try {
      statusLabel.setText("Loading groups...");
      let groups = [];
      if (fileName) {
        groups = loadGroupsFromExcel(fileName);
      } else {
        groups = loadGroupsFromExcel();
      }

      groupsTable.setRowCount(0);

      if (groups && groups.length > 0) {
        groupsTable.setRowCount(groups.length);
        groups.forEach((group, index) => {
          const nameItem = new QTableWidgetItem(group.name || "N/A");
          const idItem = new QTableWidgetItem(group.group_id || "N/A");
          const linkItem = new QTableWidgetItem(group.invite_link || "N/A");
          const adminItem = new QTableWidgetItem(
            group.admin_only ? "Yes" : "No"
          );

          groupsTable.setItem(index, 0, nameItem);
          groupsTable.setItem(index, 1, idItem);
          groupsTable.setItem(index, 2, linkItem);
          groupsTable.setItem(index, 3, adminItem);
        });
        statusLabel.setText(`Loaded ${groups.length} groups.`);
      } else {
        statusLabel.setText("No groups found");
      }
      groupsTable.show();
      groupsTab.update();
    } catch (error) {
      console.error("Error loading groups:", error);
      statusLabel.setText(`Error: ${error.message || "Unknown error"}`);
    }
  }

  loadGroups();
  return groupsTab;
}
