import {
  CursorShape,
  FlexLayout,
  QCheckBox,
  QDialog,
  QLabel,
  QPushButton,
  QScrollArea,
  QWidget,
} from "@nodegui/nodegui";

export function createMultiSelectTags(parentWidget) {
  // Container for the custom multi-select component
  const tagsContainer = new QWidget();
  tagsContainer.setObjectName("tagsContainer");
  const tagsLayout = new FlexLayout();
  tagsContainer.setLayout(tagsLayout);

  // Label for the component
  const tagsLabel = new QLabel();
  tagsLabel.setObjectName("tagsLabel");
  tagsLabel.setText("Filter by Tags:");

  // Button that opens the multi-select dialog
  const tagsButton = new QPushButton();
  tagsButton.setObjectName("tagsButton");
  tagsButton.setText("All Tags");
  tagsButton.setCursor(CursorShape.PointingHandCursor);

  // Store selected tags
  const selectedTags = new Set(["All"]);
  let availableTags = ["All"];

  // Dialog for selecting multiple tags
  const createTagsDialog = () => {
    const dialog = new QDialog(parentWidget);
    dialog.setWindowTitle("Select Tags");
    dialog.setObjectName("tagsDialog");
    dialog.setMinimumSize(300, 360);

    const dialogLayout = new FlexLayout();
    dialog.setLayout(dialogLayout);

    // Scroll area for tags
    const scrollArea = new QScrollArea();
    scrollArea.setObjectName("tagsScrollArea");
    scrollArea.setWidgetResizable(true);

    const scrollWidget = new QWidget();
    scrollWidget.setObjectName("tagsScrollWidget");
    const scrollLayout = new FlexLayout();
    scrollWidget.setLayout(scrollLayout);

    const checkboxes = [];

    // Create "All" checkbox
    const allCheckbox = new QCheckBox();
    allCheckbox.setText("All");
    allCheckbox.setObjectName("tagAllCheckbox");
    allCheckbox.setChecked(selectedTags.has("All"));

    // When "All" is checked, uncheck others
    allCheckbox.addEventListener("toggled", (checked) => {
      if (checked) {
        checkboxes.forEach((cb) => {
          if (cb.text() !== "All") {
            cb.setChecked(false);
          }
        });

        selectedTags.clear();
        selectedTags.add("All");
      }
    });

    scrollLayout.addWidget(allCheckbox);
    checkboxes.push(allCheckbox);

    // Create other tag checkboxes
    availableTags.forEach((tag) => {
      if (tag === "All") return; // Skip "All" as we already added it

      const checkbox = new QCheckBox();
      checkbox.setText(tag);
      checkbox.setObjectName(`tagCheckbox_${tag}`);
      checkbox.setChecked(selectedTags.has(tag));

      // When any tag is checked, uncheck "All"
      checkbox.addEventListener("toggled", (checked) => {
        if (checked) {
          allCheckbox.setChecked(false);
          selectedTags.add(tag);
          selectedTags.delete("All");
        } else {
          selectedTags.delete(tag);

          // If no tags selected, default to "All"
          if (selectedTags.size === 0) {
            allCheckbox.setChecked(true);
            selectedTags.add("All");
          }
        }
      });

      scrollLayout.addWidget(checkbox);
      checkboxes.push(checkbox);
    });

    // Buttons container
    const buttonsContainer = new QWidget();
    buttonsContainer.setObjectName("dialogButtonsContainer");
    const buttonsLayout = new FlexLayout();
    buttonsContainer.setLayout(buttonsLayout);

    const okButton = new QPushButton();
    okButton.setText("OK");
    okButton.setObjectName("dialogOkButton");
    okButton.setCursor(CursorShape.PointingHandCursor);

    okButton.addEventListener("clicked", () => {
      // Update the selection button text
      if (selectedTags.has("All")) {
        tagsButton.setText("All Tags");
      } else if (selectedTags.size === 1) {
        tagsButton.setText([...selectedTags][0]);
      } else {
        tagsButton.setText(`${selectedTags.size} Tags Selected`);
      }

      dialog.close();
    });

    const cancelButton = new QPushButton();
    cancelButton.setText("Cancel");
    cancelButton.setObjectName("dialogCancelButton");
    cancelButton.setCursor(CursorShape.PointingHandCursor);

    cancelButton.addEventListener("clicked", () => {
      dialog.close();
    });

    buttonsLayout.addWidget(okButton);
    buttonsLayout.addWidget(cancelButton);

    scrollArea.setWidget(scrollWidget);
    dialogLayout.addWidget(scrollArea);
    dialogLayout.addWidget(buttonsContainer);

    dialog.setStyleSheet(`
      #tagsDialog {
        background-color: white;
      }
      #tagsScrollArea {
        min-width: 280px;
        min-height: 300px;
        border: 1px solid #ccc;
        border-radius: 4px;
        margin: 10px;
      }
      #tagsScrollWidget {
        flex-direction: column;
        padding: 10px;
      }
      QCheckBox {
        padding: 5px;
        width: 280px;
      }
      #dialogButtonsContainer {
        flex-direction: row;
        justify-content: flex-end;
        padding: 10px;
      }
      QPushButton {
        padding: 8px 15px;
        background-color: #1E88E5;
        color: white;
        border-radius: 4px;
        min-width: 80px;
        font-weight: bold;
        margin-left: 10px;
      }
      QPushButton:hover {
        background-color: #1A66BD;
      }
    `);

    return dialog;
  };

  // Open dialog when button is clicked
  tagsButton.addEventListener("clicked", () => {
    const dialog = createTagsDialog();
    dialog.exec();
  });

  tagsLayout.addWidget(tagsLabel);
  tagsLayout.addWidget(tagsButton);

  // Style the component
  tagsContainer.setStyleSheet(`
    #tagsContainer {
      flex-direction: row;
      margin-left: 10px;
    }
    #tagsLabel {
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-right: 5px;
    }
    #tagsButton {
      padding: 8px 15px;
      background-color: #1E88E5;
      color: white;
      border-radius: 4px;
      min-width: 150px;
      font-weight: bold;
    }
    #tagsButton:hover {
      background-color: #1A66BD;
    }
  `);

  // Function to update available tags
  const updateTags = (tags) => {
    availableTags = tags;

    // Ensure "All" is included
    if (!availableTags.includes("All")) {
      availableTags.unshift("All");
    }

    // Reset selection to "All"
    selectedTags.clear();
    selectedTags.add("All");
    tagsButton.setText("All Tags");
  };

  // Function to get selected tags
  const getSelectedTags = () => {
    return Array.from(selectedTags);
  };

  return {
    widget: tagsContainer,
    updateTags,
    getSelectedTags,
  };
}
