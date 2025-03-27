import {
  CursorShape,
  FlexLayout,
  QFont,
  QLabel,
  QLineEdit,
  QPushButton,
  QWidget,
} from "@nodegui/nodegui";
import { getConfig, setConfig } from "src/backend/utils";

export function createSettingsTab(): QWidget {
  const settingsTab = new QWidget();
  settingsTab.setObjectName("settingsTab");
  const mainLayout = new FlexLayout();
  settingsTab.setLayout(mainLayout);

  const headerLabel = new QLabel();
  headerLabel.setObjectName("headerLabel");
  headerLabel.setText("Settings");

  const headerFont = new QFont();
  headerFont.setPixelSize(18);
  headerFont.setBold(true);
  headerLabel.setFont(headerFont);

  const { delay } = getConfig();

  const minDelayContainer = new QWidget();
  minDelayContainer.setObjectName("minDelayContainer");
  const minDelayLayout = new FlexLayout();
  minDelayContainer.setLayout(minDelayLayout);

  const minDelayLabel = new QLabel();
  minDelayLabel.setText("Min Delay (seconds)");

  const minDelayInput = new QLineEdit();
  minDelayInput.setObjectName("minDelayInput");
  minDelayInput.setPlaceholderText("Enter minimum delay in seconds...");
  minDelayInput.setText((delay.min / 1000).toString());

  const maxDelayContainer = new QWidget();
  maxDelayContainer.setObjectName("maxDelayContainer");
  const maxDelayLayout = new FlexLayout();
  maxDelayContainer.setLayout(maxDelayLayout);

  const maxDelayLabel = new QLabel();
  maxDelayLabel.setText("Max Delay (seconds)");

  const maxDelayInput = new QLineEdit();
  maxDelayInput.setObjectName("maxDelayInput");
  maxDelayInput.setPlaceholderText("Enter maximum delay in seconds...");
  maxDelayInput.setText((delay.max / 1000).toString());

  const messageLabel = new QLabel();
  messageLabel.setObjectName("messageLabel");

  const saveButton = new QPushButton();
  saveButton.setText("Save");
  saveButton.setObjectName("saveButton");
  saveButton.setCursor(CursorShape.PointingHandCursor);
  saveButton.addEventListener("clicked", async () => {
    const minDelay = minDelayInput.text().trim();
    const maxDelay = maxDelayInput.text().trim();

    if (!minDelay || !maxDelay) {
      return;
    }

    const newConfig = {
      delay: {
        min: parseInt(minDelay) * 1000,
        max: parseInt(maxDelay) * 1000,
      },
    };

    setConfig(newConfig);
    messageLabel.setText("Settings saved successfully!");
    setTimeout(() => {
      messageLabel.setText("");
    }, 3000);
  });

  minDelayLayout.addWidget(minDelayLabel);
  minDelayLayout.addWidget(minDelayInput);

  maxDelayLayout.addWidget(maxDelayLabel);
  maxDelayLayout.addWidget(maxDelayInput);

  mainLayout.addWidget(headerLabel);
  mainLayout.addWidget(minDelayContainer);
  mainLayout.addWidget(maxDelayContainer);
  mainLayout.addWidget(saveButton);
  mainLayout.addWidget(messageLabel);

  settingsTab.setStyleSheet(`
    #settingsTab {
      background-color: white;
      padding: 15px;
    }
    #headerLabel {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 15px;
    }
    #minDelayContainer, #maxDelayContainer {
      flex-direction: column;
      margin-bottom: 10px;
    }
    QLabel {
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-bottom: 2px;
    }
    #minDelayInput, #maxDelayInput {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 300px;
    }
    #saveButton {
      padding: 8px 15px;
      background-color: #1E88E5;
      color: white;
      border-radius: 4px;
      width: 100px;
      font-weight: bold;
    }
    #saveButton:hover {
      background-color: #2074d4;
    }
    #messageLabel {
      color: mediumseagreen;
      font-size: 13px;
      font-weight: bold;
      margin-top: 4px;
    }
  `);

  return settingsTab;
}
