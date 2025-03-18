import {
  FlexLayout,
  QFileDialog,
  QLabel,
  QListWidget,
  QListWidgetItem,
  QPushButton,
  QTextEdit,
  QWidget,
} from "@nodegui/nodegui";
import fs from "fs";
import path from "path";
import { MessageMedia } from "whatsapp-web.js";
import WhatsAppClient from "../../backend/client";
import {
  delayRandom,
  getRandomInt,
  loadGroupsFromExcel,
} from "../../backend/utils";

const client = WhatsAppClient.client;

export function createMessageGroupsTab(): QWidget {
  const messageGroupsTab = new QWidget();
  messageGroupsTab.setObjectName("messageGroupsTab");
  const layout = new FlexLayout();
  messageGroupsTab.setLayout(layout);

  const headerLabel = new QLabel();
  headerLabel.setObjectName("headerLabel");
  headerLabel.setText("Message Groups");

  const topContainer = new QWidget();
  topContainer.setObjectName("topContainer");
  const topLayout = new FlexLayout();
  topContainer.setLayout(topLayout);

  const bottomContainer = new QWidget();
  bottomContainer.setObjectName("bottomContainer");
  const bottomLayout = new FlexLayout();
  bottomContainer.setLayout(bottomLayout);

  const leftContainer = new QWidget();
  leftContainer.setObjectName("leftContainer");
  const leftLayout = new FlexLayout();
  leftContainer.setLayout(leftLayout);

  const groupsFileButton = new QPushButton();
  groupsFileButton.setText("Select Groups File");
  groupsFileButton.setObjectName("GroupsFileButton");
  let groupsFilePath = "";

  groupsFileButton.addEventListener("clicked", () => {
    const fileDialog = new QFileDialog();
    fileDialog.setNameFilter("Excel Files (*.xlsx)");
    fileDialog.exec();

    const selectedFiles = fileDialog.selectedFiles();
    if (selectedFiles.length > 0) {
      const filePath = selectedFiles[0];
      groupsFilePath = filePath;
      logMessage(`✅ Groups file selected: ${filePath}`);
    }
  });

  const sendMessagesButton = new QPushButton();
  sendMessagesButton.setText("Start Sending Messages");
  sendMessagesButton.setObjectName("sendMessagesButton");

  const stopSendingButton = new QPushButton();
  stopSendingButton.setText("Stop Sending");
  stopSendingButton.setObjectName("stopSendingButton");

  topLayout.addWidget(groupsFileButton);
  topLayout.addWidget(sendMessagesButton);
  topLayout.addWidget(stopSendingButton);

  const messageLabel = new QLabel();
  messageLabel.setObjectName("messageLabel");
  messageLabel.setText("Message Text");

  const messageInput = new QTextEdit();
  messageInput.setPlaceholderText("Type message");
  messageInput.setObjectName("messageInput");

  const filesContainer = new QWidget();
  filesContainer.setObjectName("filesContainer");
  const fileLayout = new FlexLayout();
  filesContainer.setLayout(fileLayout);

  const filesLabel = new QLabel();
  filesLabel.setObjectName("filesLabel");
  filesLabel.setText("Files to send");

  const filesActionsContainer = new QWidget();
  filesActionsContainer.setObjectName("filesActionsContainer");
  const filesActionsLayout = new FlexLayout();
  filesActionsContainer.setLayout(filesActionsLayout);

  const addFileButton = new QPushButton();
  addFileButton.setText("Add File");
  addFileButton.setObjectName("addFileButton");

  const clearFilesButton = new QPushButton();
  clearFilesButton.setText("Clear Files");
  clearFilesButton.setObjectName("clearFilesButton");

  const filesList = new QListWidget();
  filesList.setObjectName("filesList");
  let attachedFiles: string[] = [];

  addFileButton.addEventListener("clicked", () => {
    const fileDialog = new QFileDialog();
    fileDialog.setNameFilter("All Files (*.*)");
    fileDialog.exec();

    const selectedFiles = fileDialog.selectedFiles();

    if (selectedFiles.length > 0) {
      for (const filePath of selectedFiles) {
        const fileName = path.basename(filePath);
        const item = new QListWidgetItem();
        item.setText(fileName);
        filesList.addItem(item);
        attachedFiles.push(filePath);
      }
    }
  });

  clearFilesButton.addEventListener("clicked", () => {
    filesList.clear();
    attachedFiles = [];
  });

  fileLayout.addWidget(filesLabel);
  fileLayout.addWidget(filesActionsContainer);
  filesActionsLayout.addWidget(addFileButton);
  filesActionsLayout.addWidget(clearFilesButton);

  const logsContainer = new QTextEdit();
  logsContainer.setPlaceholderText("Logs from function");
  logsContainer.setObjectName("logsContainer");
  logsContainer.setReadOnly(true);

  let stopSending = false;
  stopSendingButton.addEventListener("clicked", () => {
    stopSending = true;
    logMessage("⛔️ Stopped sending messages!");
  });

  function logMessage(msg: string) {
    logsContainer.append(msg + "\n");
  }

  async function sendMessagesFromExcel(fileName: string) {
    if (!fs.existsSync(fileName)) {
      logMessage(`❌ '${fileName}' not found!`);
      return;
    }

    const entries = loadGroupsFromExcel(fileName, logMessage);

    const message = messageInput.toPlainText();

    let sentCount = 0;
    for (const group of entries) {
      if (stopSending) {
        break;
      }

      if (group.hasOwnProperty("admin_only") && group.admin_only === "Yes") {
        console.log(`⚠️ Skipping non-admin group: ${group.name}`);
        continue;
      }

      try {
        // Send text message
        if (message) {
          await client.sendMessage(group.group_id, message);
          logMessage(
            `✅ Message sent to ${group.name ? group.name : "Unknown Group"}`
          );
          await delayRandom(logMessage);
        }

        // Send media files if any
        for (const filePath of attachedFiles) {
          if (stopSending) {
            break;
          }
          if (!fs.existsSync(filePath)) {
            logMessage(`⚠️ File not found: ${filePath}`);
            continue;
          }

          const media = MessageMedia.fromFilePath(filePath);
          await client.sendMessage(group.group_id, media);
          logMessage(
            `✅ Media sent to ${group.name ? group.name : "Unknown Group"}`
          );
          await delayRandom(logMessage);
        }
      } catch (error) {
        logMessage(`❌ Error sending message: ${error.message}`);
      }

      sentCount++;
      if (sentCount % getRandomInt(10, 20) === 0) {
        logMessage("⏳ Taking a longer break to avoid detection...");
        await delayRandom(logMessage, 15000, 30000);
      }
    }
  }

  sendMessagesButton.addEventListener("clicked", async () => {
    logsContainer.clear();
    if (!groupsFilePath) {
      logMessage("❌ Error: No groups file selected.");
      return;
    }
    await sendMessagesFromExcel(groupsFilePath);
    if (!stopSending) logMessage("✅ Messages sent to all groups!");
    stopSending = false;
  });

  layout.addWidget(headerLabel);
  layout.addWidget(topContainer);
  layout.addWidget(bottomContainer);
  bottomLayout.addWidget(leftContainer);
  bottomLayout.addWidget(logsContainer);
  leftLayout.addWidget(messageLabel);
  leftLayout.addWidget(messageInput);
  leftLayout.addWidget(filesContainer);
  leftLayout.addWidget(filesList);

  messageGroupsTab.setStyleSheet(`
    #messageGroupsTab {
      background-color: white;
      padding: 15px;
    }
    #headerLabel {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    #messageLabel, #filesLabel {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    #messagesTab {
      background-color: white;
      padding: 15px;
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
    #topContainer {
      flex-direction: row;
      margin-bottom: 10px;
    }
    #bottomContainer {
      flex-direction: row;
    }
    #leftContainer {
      flex: 1;
      margin-right: 10px;
    }
    #messageInput {
      min-height: 220px;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 5px;
    }
    #filesContainer {
      padding-top: 10px;
      flex-direction: row;
      justify-content: space-between;
    }
    #filesActionsContainer {
      flex-direction: row;
    }
    #addFileButton {
      min-width: 80px;
    }
    #clearFilesButton {
      margin-right: 0;
      min-width: 80px;
    }
    #filesLabel {
      padding-top: 10px;
    }
    #filesList {
      border: 1px solid #ccc;
      border-radius: 4px;
      min-height: 190px;
    }
    #logsContainer {
      flex: 1;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 5px;
    }
  `);

  return messageGroupsTab;
}
