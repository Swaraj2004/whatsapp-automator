import {
  CursorShape,
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
import { MessageMedia } from "whatsapp-web.js";
import WhatsAppClient from "../../backend/client";
import {
  delayRandom,
  getConfig,
  getRandomInt,
  loadContactsFromExcel,
  loadSentMessagesContacts,
  saveSentMessagesContacts,
} from "../../backend/utils";
import { createListItem } from "../components/listItem";
import { createMultiSelectTags } from "../components/multiSelector";

const client = WhatsAppClient.client;

export function createMessageContactsTab(): QWidget {
  const messageContactsTab = new QWidget();
  messageContactsTab.setObjectName("messageContactsTab");
  const layout = new FlexLayout();
  messageContactsTab.setLayout(layout);

  const headerLabel = new QLabel();
  headerLabel.setObjectName("headerLabel");
  headerLabel.setText("Message Contacts");

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

  const contactsFileButton = new QPushButton();
  contactsFileButton.setText("Select Contacts File");
  contactsFileButton.setObjectName("contactsFileButton");
  contactsFileButton.setCursor(CursorShape.PointingHandCursor);
  let contactsFilePath = "";

  contactsFileButton.addEventListener("clicked", () => {
    const fileDialog = new QFileDialog();
    fileDialog.setNameFilter("Excel Files (*.xlsx)");
    fileDialog.exec();

    const selectedFiles = fileDialog.selectedFiles();
    if (selectedFiles.length > 0) {
      const filePath = selectedFiles[0];
      contactsFilePath = filePath;
      const { tags } = loadContactsFromExcel(filePath, logMessage);
      tagsSelector.updateTags(tags);
      logMessage(`✅ Contacts file selected: ${filePath}`);
    }
  });

  const sendMessagesButton = new QPushButton();
  sendMessagesButton.setText("Start Sending Messages");
  sendMessagesButton.setObjectName("sendMessagesButton");
  sendMessagesButton.setCursor(CursorShape.PointingHandCursor);

  const stopSendingButton = new QPushButton();
  stopSendingButton.setText("Stop Sending");
  stopSendingButton.setObjectName("stopSendingButton");
  stopSendingButton.setCursor(CursorShape.PointingHandCursor);

  const undoMessagesButton = new QPushButton();
  undoMessagesButton.setText("Undo Last Messages");
  undoMessagesButton.setObjectName("undoMessagesButton");
  undoMessagesButton.setCursor(CursorShape.PointingHandCursor);

  undoMessagesButton.addEventListener("clicked", async () => {
    let sentMessages = loadSentMessagesContacts();

    if (sentMessages.length === 0) {
      logMessage("❌ No messages to delete!");
      return;
    }

    const { delay } = await getConfig();

    for (const { chatId, msgId } of sentMessages) {
      try {
        const chat = await client.getChatById(chatId);
        await delayRandom(logMessage, 2000, 5000);
        const messages = await chat.fetchMessages({ limit: 50 });

        const messageToDelete = messages.find(
          (msg) => msg.id._serialized === msgId
        );

        if (messageToDelete) {
          await messageToDelete.delete(true);
          logMessage(`🗑️ Deleted message in ${chatId}`);
        } else {
          logMessage(
            `⚠️ Message ${msgId} not found in ${chatId}, might be too old.`
          );
        }
        await delayRandom(logMessage, delay.min, delay.max);
      } catch (error) {
        logMessage(
          `❌ Failed to delete message in ${chatId}: ${error.message}`
        );
      }
    }
    logMessage("✅ Deleted all messages!");

    sentMessages = [];
    saveSentMessagesContacts(sentMessages);
  });

  const tagsSelector = createMultiSelectTags(messageContactsTab);

  topLayout.addWidget(contactsFileButton);
  topLayout.addWidget(sendMessagesButton);
  topLayout.addWidget(stopSendingButton);
  topLayout.addWidget(undoMessagesButton);
  topLayout.addWidget(tagsSelector.widget);

  const messageLabel = new QLabel();
  messageLabel.setObjectName("messageLabel");
  messageLabel.setText("Message Text");

  // Message Input
  const messageInput = new QTextEdit();
  messageInput.setPlaceholderText("Type message");
  messageInput.setObjectName("messageInput");

  // File Input Section
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
  addFileButton.setCursor(CursorShape.PointingHandCursor);

  const clearFilesButton = new QPushButton();
  clearFilesButton.setText("Clear Files");
  clearFilesButton.setObjectName("clearFilesButton");
  clearFilesButton.setCursor(CursorShape.PointingHandCursor);

  const filesList = new QListWidget();
  filesList.setObjectName("filesList");
  let attachedFiles = new Map();

  addFileButton.addEventListener("clicked", () => {
    const fileDialog = new QFileDialog();
    fileDialog.setNameFilter("All Files (*.*)");
    fileDialog.exec();

    const selectedFiles = fileDialog.selectedFiles();

    if (selectedFiles.length > 0) {
      for (const filePath of selectedFiles) {
        const fileItemWidget = createListItem(
          messageContactsTab,
          filePath,
          attachedFiles
        );

        // Add to list
        const listItem = new QListWidgetItem();
        filesList.addItem(listItem);
        filesList.setItemWidget(listItem, fileItemWidget);
      }
    }
  });

  clearFilesButton.addEventListener("clicked", () => {
    filesList.clear();
    attachedFiles.clear();
  });

  fileLayout.addWidget(filesLabel);
  fileLayout.addWidget(filesActionsContainer);
  filesActionsLayout.addWidget(addFileButton);
  filesActionsLayout.addWidget(clearFilesButton);

  // Logs Section
  const logsContainer = new QTextEdit();
  logsContainer.setPlaceholderText("Logs from function");
  logsContainer.setObjectName("logsContainer");
  logsContainer.setReadOnly(true);

  let stopSending = true;
  stopSendingButton.addEventListener("clicked", () => {
    if (!stopSending) logMessage("⛔️ Stopped sending messages!");
    stopSending = true;
  });

  function logMessage(msg: string) {
    logsContainer.append(msg + "\n");
  }

  async function sendMessagesFromExcel(fileName: string) {
    if (!fs.existsSync(fileName)) {
      logMessage(`❌ '${fileName}' not found!`);
      return;
    }

    const { contacts } = loadContactsFromExcel(fileName, logMessage);

    // Get selected tags
    const selectedTags = tagsSelector.getSelectedTags();
    const sendToAll = selectedTags.includes("All");

    // Filter contacts by selected tags
    const filteredContacts = sendToAll
      ? contacts
      : contacts.filter((contact) => {
          if (!contact.tags) return false;

          const contactTags = contact.tags
            .toString()
            .split(",")
            .map((tag) => tag.trim());
          return selectedTags.some((tag) => contactTags.includes(tag));
        });

    const message = messageInput.toPlainText();

    const sentMessages = [];
    saveSentMessagesContacts(sentMessages);

    const { delay } = await getConfig();

    let sentCount = 0;
    for (const [i, contact] of filteredContacts.entries()) {
      if (stopSending) {
        break;
      }

      try {
        // Send text message
        if (message) {
          const sentMsg = await client.sendMessage(contact.user_id, message);
          logMessage(
            `✅ (${i + 1}/${filteredContacts.length}) Message sent to ${
              contact.name ? contact.name + " " : ""
            }(${contact.number})`
          );

          sentMessages.push({
            chatId: contact.user_id,
            msgId: sentMsg.id._serialized,
          });
          saveSentMessagesContacts(sentMessages);
          await delayRandom(logMessage, delay.min, delay.max);
        }

        // Send media files with captions
        for (const [filePath, caption] of attachedFiles.entries()) {
          if (stopSending) {
            break;
          }
          if (!fs.existsSync(filePath)) {
            logMessage(`⚠️ File not found: ${filePath}`);
            continue;
          }

          const media = MessageMedia.fromFilePath(filePath);
          const sentMedia = await client.sendMessage(contact.user_id, media, {
            caption,
          });
          logMessage(
            `✅ (${i + 1}/${filteredContacts.length}) Media sent to ${
              contact.name ? contact.name + " " : ""
            }(${contact.number})`
          );

          sentMessages.push({
            chatId: contact.user_id,
            msgId: sentMedia.id._serialized,
          });
          saveSentMessagesContacts(sentMessages);
          await delayRandom(logMessage, delay.min, delay.max);
        }
      } catch (error) {
        logMessage(`❌ Error sending message: ${error.message}`);
      }

      sentCount++;
      if (sentCount % getRandomInt(10, 20) === 0) {
        logMessage("⏳ Taking a longer break to avoid detection...");
        await delayRandom(logMessage, 20000, 30000);
      }
    }
  }

  sendMessagesButton.addEventListener("clicked", async () => {
    logsContainer.clear();
    if (!contactsFilePath) {
      logMessage("❌ Error: No contacts file selected.");
      return;
    }
    stopSending = false;
    await sendMessagesFromExcel(contactsFilePath);
    if (!stopSending) logMessage("✅ Messages sent to all contacts!");
    stopSending = true;
  });

  // Adding Widgets to Layout
  layout.addWidget(headerLabel);
  layout.addWidget(topContainer);
  layout.addWidget(bottomContainer);
  bottomLayout.addWidget(leftContainer);
  bottomLayout.addWidget(logsContainer);
  leftLayout.addWidget(messageLabel);
  leftLayout.addWidget(messageInput);
  leftLayout.addWidget(filesContainer);
  leftLayout.addWidget(filesList);

  // Apply Styles
  messageContactsTab.setStyleSheet(`
    #messageContactsTab {
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
      background-color: #2074d4;
    }
    #topContainer {
      flex-direction: row;
      margin-bottom: 10px;
    }
    #bottomContainer {
      flex-direction: row;
      height: 555px;
    }
    #leftContainer {
      flex: 1;
      margin-right: 10px;
    }
    #messageInput {
      min-height: 266px;
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
    QListWidget::item {
      border-bottom: 1px solid #ddd;
      min-height: 25px;
      padding: 5px;
      margin: 5px;
    }
    #logsContainer {
      flex: 1;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 5px;
    }
  `);

  return messageContactsTab;
}
