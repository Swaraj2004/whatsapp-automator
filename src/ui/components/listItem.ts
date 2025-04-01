import {
  CursorShape,
  FlexLayout,
  QDialog,
  QLabel,
  QPushButton,
  QTextEdit,
  QWidget,
} from "@nodegui/nodegui";
import path from "path";

export function createListItem(parentWidget, filePath, attachedFiles) {
  const fileName = path.basename(filePath);
  attachedFiles.set(filePath, "");

  // Create container widget
  const fileItemWidget = new QWidget();
  fileItemWidget.setObjectName("fileItemWidget");
  const fileItemLayout = new FlexLayout();
  fileItemWidget.setLayout(fileItemLayout);

  // Create file name label
  const fileNameLabel = new QLabel();
  fileNameLabel.setText(fileName);
  fileNameLabel.setObjectName("fileNameLabel");

  const fileActionsContainer = new QWidget();
  fileActionsContainer.setObjectName("fileActionsContainer");
  const fileActionsLayout = new FlexLayout();
  fileActionsContainer.setLayout(fileActionsLayout);

  // Create caption button
  const captionButton = new QPushButton();
  captionButton.setText("Add Caption");
  captionButton.setObjectName("captionButton");
  captionButton.setCursor(CursorShape.PointingHandCursor);
  captionButton.addEventListener("clicked", () => {
    // Create a custom dialog
    const captionDialog = new QDialog(parentWidget);
    captionDialog.setWindowTitle("File Caption");
    captionDialog.setObjectName("captionDialog");
    captionDialog.setMinimumSize(462, 400);

    // Create a vertical layout for the dialog
    const dialogLayout = new FlexLayout();
    dialogLayout.setObjectName("dialogLayout");
    captionDialog.setLayout(dialogLayout);

    // Add a label
    const dialogLabel = new QLabel();
    dialogLabel.setText("Enter caption for: " + fileName);
    dialogLabel.setObjectName("dialogLabel");

    // Create a multi-line text edit
    const textEdit = new QTextEdit();
    textEdit.setText(attachedFiles.get(filePath) || "");
    textEdit.setMinimumSize(380, 200); // Make it reasonably large
    textEdit.setObjectName("captionTextEdit");

    // Buttons container
    const buttonsContainer = new QWidget();
    buttonsContainer.setObjectName("dialogButtonsContainer");
    const buttonsLayout = new FlexLayout();
    buttonsContainer.setLayout(buttonsLayout);

    const okButton = new QPushButton();
    okButton.setText("OK");
    okButton.setObjectName("dialogOkButton");
    okButton.setCursor(CursorShape.PointingHandCursor);

    const cancelButton = new QPushButton();
    cancelButton.setText("Cancel");
    cancelButton.setObjectName("dialogCancelButton");
    cancelButton.setCursor(CursorShape.PointingHandCursor);

    // Add buttons to the button layout
    buttonsLayout.addWidget(okButton);
    buttonsLayout.addWidget(cancelButton);

    // Add all widgets to the dialog layout
    dialogLayout.addWidget(dialogLabel);
    dialogLayout.addWidget(textEdit);
    dialogLayout.addWidget(buttonsContainer);

    // Set up button event handlers
    okButton.addEventListener("clicked", () => {
      const caption = textEdit.toPlainText();
      attachedFiles.set(filePath, caption);
      if (caption) {
        captionButton.setText("Edit Caption");
      }
      captionDialog.close();
    });

    cancelButton.addEventListener("clicked", () => {
      captionDialog.close();
    });

    captionDialog.setStyleSheet(`
      #captionDialog {
        background-color: white;
      }
      #dialogLayout {
        flex-direction: column;
      }
      #dialogLabel {
        font-size: 14px;
        font-weight: bold;
        color: #333;
        margin: 5px 10px;
      }
      #captionTextEdit {
        margin: 5px 10px 0;
        min-height: 320px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      #dialogButtonsContainer {
        flex-direction: row;
        justify-content: flex-end;
        margin: 5px 10px;
      }
    `);

    // Show the dialog
    captionDialog.exec();
  });

  // Configure the layout
  fileActionsLayout.addWidget(captionButton);
  fileItemLayout.addWidget(fileNameLabel);
  fileItemLayout.addWidget(fileActionsContainer);

  fileItemWidget.setStyleSheet(`
    #fileItemWidget {
      flex-direction: row;
    }
    #fileNameLabel {
      font-size: 14px;
    }
    #fileActionsContainer {
      flex-direction: row;
      margin-left: auto;
    }
    #captionButton {
      padding: 4px 12px;
      font-size: 12px;
      height: 25px;
      min-width: 55px;
    }
  `);

  return fileItemWidget;
}
