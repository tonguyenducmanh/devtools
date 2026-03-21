export default {
  i18nHelp: {
    welcome: {
      purpose: {
        title: "Why this app exists?",
        content:
          "Dev Tools is a suite of utilities designed to assist developers during the software development process. Instead of installing multiple separate applications for each feature or writing complex scripts that take time, you can use the built-in tools right here.",
      },
      quickStart: {
        title: "Quick Start",
        selectTool: "Select a tool from the sidebar menu on the left to get started.",
        searchTool: "Press Ctrl + P (or Cmd + P on Mac) to open the search box, type the tool name you need and press Enter to open it quickly.",
        note: "Tip: Use ↑↓ to navigate between search results.",
      },
      multiTab: {
        title: "Working with Multiple Tabs",
        description:
          "The application supports opening multiple tools simultaneously as tabs. This allows you to avoid opening multiple browser windows to use different features at the same time.",
        rightClick: "Right-click on a tab name to open the context menu with the following options:",
        duplicateTab: "Duplicate tab - Create a copy of the current tab",
        closeTab: "Close tab - Close the selected tab",
        closeAllTabs: "Close all - Close all open tabs",
        dragReorder: "Drag and drop tabs to reorder them.",
      },
      agent: {
        title: "The tools in this app are divided into 2 types:",
        webOnly: "Web-based - No additional installation required, works directly in the browser.",
        needAgent: "Requires Agent - Need to download and run the Agent app (desktop application) as backend, helping to bypass browser limitations such as CORS, SSL, fake headers,...",
        downloadAgent: "To download the Agent, click on the Help menu in the top header and select \"Download Agent\".",
      },
    },
    feature: {
      OpticalCharacterRecognition: "Vietnamese OCR tool, may have errors.",
      AppDataMiner: "View all the data stored in the application's database",
      cosinSimilarity:
        "Calculates the similarity between two n-dimensional vectors",
      oneTimePassword: "Generates 6-character OTP codes every 30 seconds",
      APITesting:
        "Calls API bypass CORS, SSL (Normal Mode) or creates custom scripts to call APIs in bulk (Pro Mode)",
      APIMocking:
        "Creates mock APIs to fake data in environments where it's not possible to call APIs outside the internet",
      QRCodeFromText:
        "Generate multiple QR codes from a piece of text, mark the QR codes by creation date and QR code generation sequence, encode the content to increase accuracy.",
      QRCodeToText:
        "Read multiple QR codes and automatically combine them into a piece of text (prioritizing codes from the most recent creation date), decode the compressed data from the QR code generation tool.",
      textManipulation:
        "Process a batch of similar text snippets using a pre-defined template",
    },
    oneTimePassword: {
      purpose: {
        title: "What is OTP Tool?",
        content: "A tool to generate 6-character OTP (One-Time Password) codes that automatically refresh every 30 seconds. Supports importing accounts from Google Authenticator via QR code, URL, or manual entry.",
      },
      importData: {
        title: "Import Data",
        scanQR: "Scan QR Code - Upload an image file containing the QR code from Google Authenticator to automatically import accounts.",
        pasteURL: "Paste URL - Paste the otpauth-migration:// link from Google Authenticator to import accounts.",
        manual: "Manual Entry - Fill in issuer, name, and secret to add a new account.",
      },
      security: {
        title: "Security",
        description: "OTP data is encrypted and stored locally on your device. You need to enter a password (user-created) to encrypt browser cache data and open saved accounts.",
      },
      quickUse: {
        title: "Quick Use",
        copyOTP: "Click on any OTP code to copy it to clipboard.",
        autoRefresh: "OTP codes automatically refresh every 30 seconds.",
        note: "The progress bar above shows the remaining time before the OTP code changes.",
      },
    },
  },
};
