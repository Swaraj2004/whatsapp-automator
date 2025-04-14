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
import {
  sendMessagesToContacts,
  undoContactsMessages,
} from "../../backend/controllers";
import { loadContactsFromExcel } from "../../backend/utils";
import {
  cmSetLogger,
  cmStopSending,
} from "../../globals/contactsMessagingGolbals";
import { createListItem } from "../components/listItem";
import { createMultiSelectTags } from "../components/multiSelector";

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

  const rightContainer = new QWidget();
  rightContainer.setObjectName("rightContainer");
  const rightLayout = new FlexLayout();
  rightContainer.setLayout(rightLayout);

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
    await undoContactsMessages();
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

  function logMessage(msg: string) {
    logsContainer.append(msg + "\n");
  }

  function clearLogs() {
    logsContainer.clear();
  }

  cmSetLogger(logMessage, clearLogs);

  // Logs Section
  const logsContainer = new QTextEdit();
  logsContainer.setPlaceholderText("Logs from function");
  logsContainer.setObjectName("logsContainer");
  logsContainer.setReadOnly(true);

  const logsTopContainer = new QWidget();
  logsTopContainer.setObjectName("logsTopContainer");
  const logsTopLayout = new FlexLayout();
  logsTopContainer.setLayout(logsTopLayout);

  const logsLabel = new QLabel();
  logsLabel.setObjectName("logsLabel");
  logsLabel.setText("Logs");

  const logsActionsContainer = new QWidget();
  logsActionsContainer.setObjectName("logsActionsContainer");
  const logsActionsLayout = new FlexLayout();
  logsActionsContainer.setLayout(logsActionsLayout);

  const clearLogsButton = new QPushButton();
  clearLogsButton.setText("Clear Logs");
  clearLogsButton.setObjectName("clearLogsButton");
  clearFilesButton.setCursor(CursorShape.PointingHandCursor);
  clearLogsButton.addEventListener("clicked", () => {
    clearLogs();
  });

  logsTopLayout.addWidget(logsLabel);
  logsTopLayout.addWidget(logsActionsContainer);
  logsActionsLayout.addWidget(clearLogsButton);

  stopSendingButton.addEventListener("clicked", () => {
    cmStopSending();
  });

  sendMessagesButton.addEventListener("clicked", async () => {
    await sendMessagesToContacts({
      message: messageInput.toPlainText(),
      attachedFiles: attachedFiles,
      selectedTags: tagsSelector.getSelectedTags(),
      eventType: "uiDriven",
      fileName: contactsFilePath,
    });
  });

  // Adding Widgets to Layout
  layout.addWidget(headerLabel);
  layout.addWidget(topContainer);
  layout.addWidget(bottomContainer);
  bottomLayout.addWidget(leftContainer);
  bottomLayout.addWidget(rightContainer);
  leftLayout.addWidget(messageLabel);
  leftLayout.addWidget(messageInput);
  leftLayout.addWidget(filesContainer);
  leftLayout.addWidget(filesList);
  rightLayout.addWidget(logsTopContainer);
  rightLayout.addWidget(logsContainer);

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
    #messageLabel, #filesLabel, #logsLabel {
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
    #sendMessagesButton {
      background-color: #49ad4e;
    }
    #sendMessagesButton:hover {
      background-color: #40a145;
    }
    #stopSendingButton {
      background-color: #e53935;
    }
    #stopSendingButton:hover {
      background-color: #d32f2f;
    }
    #undoMessagesButton {
      background-color: #f57c00;
    }
    #undoMessagesButton:hover {
      background-color: #ef6c00;
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
    #clearFilesButton, #clearLogsButton {
      background-color: #e53935;
      margin-right: 0;
      min-width: 80px;
    }
    #clearFilesButton:hover, #clearLogsButton:hover {
      background-color: #d32f2f;
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
    #rightContainer {
      flex: 1;
      margin-right: 5px;
      height: 555px;
    }
    #logsTopContainer {
      flex-direction: row;
      justify-content: space-between;
    }
    #logsContainer {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 5px;
      min-height: 493px;
    }
  `);

  return messageContactsTab;
}
