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
import { clearAllChats, clearChatById } from "../../backend/controllers";

export function createClearChatsTab(): QWidget {
  const clearChatsTab = new QWidget();
  clearChatsTab.setObjectName("clearChatsTab");
  const mainLayout = new FlexLayout();
  clearChatsTab.setLayout(mainLayout);

  const headerLabel = new QLabel();
  headerLabel.setObjectName("headerLabel");
  headerLabel.setText("Clear Chats");

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

  const clearByIdButton = new QPushButton();
  clearByIdButton.setText("Clear Chats By ID");
  clearByIdButton.setObjectName("clearByIdButton");
  clearByIdButton.setCursor(CursorShape.PointingHandCursor);
  clearByIdButton.addEventListener("clicked", async () => {
    logsContainer.clear();
    const chatId = chatIdInput.text().trim();
    if (!chatId) {
      logMessage("❌ Please enter a valid Chat ID!");
      return;
    }

    await clearChatById(chatId, logMessage);
  });

  const clearAllChatsButton = new QPushButton();
  clearAllChatsButton.setText("Clear All Chats");
  clearAllChatsButton.setObjectName("clearAllChatsButton");
  clearAllChatsButton.setCursor(CursorShape.PointingHandCursor);
  clearAllChatsButton.addEventListener("clicked", async () => {
    logsContainer.clear();
    await clearAllChats(logMessage);
  });

  buttonLayout.addWidget(chatIdInput);
  buttonLayout.addWidget(clearByIdButton);
  buttonLayout.addWidget(clearAllChatsButton);

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

  clearChatsTab.setStyleSheet(`
    #clearChatsTab {
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

  return clearChatsTab;
}
