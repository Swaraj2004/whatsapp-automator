import {
  CursorShape,
  FlexLayout,
  QFont,
  QLabel,
  QLineEdit,
  QPushButton,
  QTextEdit,
  QWidget,
} from "@nodegui/nodegui";
import { deleteAllChats, deleteChatById } from "../../backend/controllers";

export function createDeleteChatsTab(): QWidget {
  const deleteChatsTab = new QWidget();
  deleteChatsTab.setObjectName("deleteChatsTab");
  const mainLayout = new FlexLayout();
  deleteChatsTab.setLayout(mainLayout);

  const headerLabel = new QLabel();
  headerLabel.setObjectName("headerLabel");
  headerLabel.setText("Delete Chats");

  const headerFont = new QFont();
  headerFont.setPixelSize(18);
  headerFont.setBold(true);
  headerLabel.setFont(headerFont);

  const buttonContainer = new QWidget();
  buttonContainer.setObjectName("buttonContainer");
  const buttonLayout = new FlexLayout();
  buttonContainer.setLayout(buttonLayout);

  const chatIdInput = new QLineEdit();
  chatIdInput.setObjectName("chatIdInput");
  chatIdInput.setPlaceholderText("Enter Contact/Group ID...");

  const deleteByIdButton = new QPushButton();
  deleteByIdButton.setText("Delete Chats By ID");
  deleteByIdButton.setObjectName("deleteByIdButton");
  deleteByIdButton.setCursor(CursorShape.PointingHandCursor);
  deleteByIdButton.addEventListener("clicked", async () => {
    logsContainer.clear();
    const chatId = chatIdInput.text().trim();
    if (!chatId) {
      logMessage("❌ Please enter a valid Chat ID!");
      return;
    }

    await deleteChatById(chatId, logMessage);
  });

  const deleteAllChatsButton = new QPushButton();
  deleteAllChatsButton.setText("Delete All Chats");
  deleteAllChatsButton.setObjectName("deleteAllChatsButton");
  deleteAllChatsButton.setCursor(CursorShape.PointingHandCursor);
  deleteAllChatsButton.addEventListener("clicked", async () => {
    logsContainer.clear();
    await deleteAllChats(logMessage);
  });

  buttonLayout.addWidget(chatIdInput);
  buttonLayout.addWidget(deleteByIdButton);
  buttonLayout.addWidget(deleteAllChatsButton);

  const logsContainer = new QTextEdit();
  logsContainer.setPlaceholderText("Logs from function");
  logsContainer.setObjectName("logsContainer");
  logsContainer.setReadOnly(true);

  function logMessage(msg: string) {
    logsContainer.append(msg + "\n");
  }

  mainLayout.addWidget(headerLabel);
  mainLayout.addWidget(buttonContainer);
  mainLayout.addWidget(logsContainer);

  deleteChatsTab.setStyleSheet(`
    #deleteChatsTab {
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
    #chatIdInput {
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
    #logsContainer {
      height: 550px;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 5px;
    }
  `);

  return deleteChatsTab;
}
