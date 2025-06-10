export default {
  i18nCommon: {
    typeInput: "Type value",
    history: "History",
    deleteAll: "Delete all",
    uploadFile: "Upload file",
    createbyAuthor: "Created by tdmanh with luv.",
    welcomeTextOne: "The",
    welcomeTextTwo: "Essential",
    welcomeTextThree: "Utility Tool for Dev",
    sidebar: {
      filter: "Filter tool",
      menu: {
        show: "Show menu",
        hide: "Hide menu"
      },
      theme: {
        light: "Switch to dark theme",
        dark: "Switch to light theme"
      },
      language: {
        switch: "Switch language"
      }
    },
    feature: {
      welcome: "Welcome",
      oneTimePassword: "One time password",
      textCompress: "Text Compress",
      compareCode: "Compare code",
      colorPicker: "Color picker",
      JSONParser: "JSON parser",
      JSONToPostgreSQL: "JSON to PostgreSQL",
      JSONMapping: "JSON Mapping",
      JSONToExcel: "JSON to Excel",
      CodeFormatter: "Code formatter",
      ImageFromBase64: "Image from Base64",
      ImageToBase64: "Image to Base64",
      QRCodeFromText: "QRCode from text",
      QRCodeToText: "QRCode to text",
      DownloadVSCodeExtension: "Download VSCode Extension",
      UUIDV4Generator: "UUIDv4 generator",
    },
    example: "example",
    base64ToImage: {
      title: "Base64 to Image tool!",
      donwloadImage: "Download Image",
      convert: "Convert",
      placeHolder: "Paste your Base64 string here",
      result: "Result converted",
    },
    codeFormatter: {
      title: "Code formatter tool!",
      typeOfCode: "Type of code",
      inputCode: "Input your code",
      outputCode: "Output code",
      formatCode: "Format code",
      copyOutput: "Copy output",
    },
    colorPicker: {
      title: "Color picker tool!",
      uploadLabel: "Choose an image or drag it here, PNG, JPG, GIF up to 10MB",
      uploadButton: "Upload",
      colorPalette: "Color Palette",
      selectedColor: "Selected Color",
      copyColor: "Copy color",
      uploadNewImage: "Upload New Image"
    },
    compareCode: {
      title: "Compare two file (diff changes) !",
      firstFile: "First code file to compare",
      secondFile: "Second code file to compare",
      compareStyle: "compare style (true is side by side, false is line by line)",
      compare: "Compare diff changes",
      example: "Example"
    },
    downloadVSCodeExt: {
      title: "Download VSCode Extension from marketplace.visualstudio.com!",
      subtitle: "For legacy download that microsoft is removed.",
      itemName: "Item name",
      version: "Version",
      downloadLink: "Download link",
      generateLink: "Generate download link", 
      copyLink: "Copy link",
      example: "Example"
    },
    imageToBase64: {
      title: "Image To base64 tool!",
      dropZone: "Paste image here (Ctrl+V) or drag & drop",
      placeHolder: "Base64 output will appear here",
      copyButton: "Copy Base64"
    },
    jsonParser: {
      title: "Convert JSON to recursive object!",
      inputPlaceholder: "JSON to convert to Object",
      recursiveParser: "Process recursive JSON parsing",
      showCollapseIcon: "show collapse icon for object",
      showLineNumber: "show line numbers",
      showLength: "show number of keys/elements",
      showScroll: "show scrollbar",
      showFullPath: "show selected node full path",
      showSelectedNode: "show selected node",
      convertButton: "JSON to Object",
      example: "Example",
      copySelected: "Copy selected node",
      copyStringify: "Copy source stringify",
      toggleNode: "Toggle all node",
      selectedNode: "Selected node",
      noSelection: "No node selected"
    },
    jsonToExcel: {
      title: "Convert JSON array objects to excel file!",
      inputLabel: "Enter JSON, level 1 keys will be used as column names",
      inputPlaceholder: "Enter JSON here...",
      boldColumns: "Bold column names",
      fitColumns: "Fit column width",
      freezeRow: "Freeze first row",
      convert: "Convert",
      example: "Example"
    },
    jsonToPostgreSQL: {
      title: "JSON to PostgreSQL tool!",
      schemaName: "Schema name",
      tableName: "Table name",
      primaryKey: "Primary key column",
      inputLabel: "Enter JSON",
      inputPlaceholder: "Enter JSON here...",
      outputLabel: "SQL Result",
      outputPlaceholder: "SQL will appear here...",
      createTable: "Add create table script",
      deleteOld: "Add delete old data script",
      convert: "Convert",
      copy: "Copy",
      example: "Example"
    },
    jsonMapping: {
      title: "Mapping JSON object A to JSON object B with recusive key value mapping!",
      sourcePlaceholder: "Object need mapping value",
      sourceLabel: "Object mapping",
      targetLabel: "Object copy",
      targetPlaceholder: "Object copy value",
      resultPlaceholder: "Result after mapping",
      resultLabel: "Result mapping",
      errorPlaceholder: "Key value mapping error",
      errorLabel: "Error",
      mappingButton: "Mapping now",
      formatButton: "Format result",
      copyResultButton: "Copy result",
      copyErrorButton: "Copy error",
      example: "Example"
    },
    textCompress: {
      title: "Text Compress Algorithms!",
      input: {
        compress: "Text to compress",
        decompress: "Text from compress",
        algorithm: "Compression algorithm"
      },
      buttons: {
        compress: "Compress",
        decompress: "Decompress",
        example: "Example",
        copyInput: "Copy input",
        copyOutput: "Copy output"
      },
      stats: {
        ratio: "Compression ratio {0}%",
        inputLength: "Input text length {0}",
        outputLength: "Output text length {0}"
      }
    },
    uuidGenerator: {
      title: "UUIDv4 generator tool!",
      input: {
        result: "Result"
      },
      buttons: {
        generate: "Generate",
        copy: "Copy"
      }
    },
    textToQRCode: {
      title: "Text To QRCode tool!",
      input: {
        placeholder: "Enter text to generate QR code...",
        maxLength: "Maximum characters per QR code"
      },
      buttons: {
        generate: "Generate QR Code",
        downloadAll: "Download All",
        download: "Download",
        example: "Example"
      },
      part: "Part {0}/{1}"
    },
    qrCodeToText: {
      title: "QRCode To Text tool!",
      note: "Note: Upload order is based on computer sorting order, please choose ascending date sort to concatenate files correctly",
      dropZone: {
        placeholder: "Drop images here or Ctrl+V to paste copied image",
        label: "Select QR code image"
      },
      convert: "Convert",
      copy: "Copy",
      result: "Result will appear after pasting image"
    },
    oneTimePassword: {
      title: "Time-based (TOTP) and HMAC-based (HOTP) One-Time Password!",
      sourceLabel: "Data source",
      importOptions: {
        googleQR: "Google authenticator QR code",
        google: "Google authenticator",
        manual: "Manual input"
      },
      dropZone: {
        label: "Select QR code image",
        placeholder: "Drop image here or upload"
      },
      auth: {
        username: "Enter username",
        password: "Enter password to save/load authentication list",
        open: "Open",
        save: "Save",
        add: "Add"
      },
      inputs: {
        issuer: "Issuer",
        name: "Name",
        secret: "Secret"
      },
      urlPlaceholder: "Google authenticator migration URL example: otpauth-migration://offline?data=CjcKFFkwYrPBscVsQXM",
      decodeData: "Google authenticator decoded data",
      remove: {
        filter: "Enter exact auth name to remove, enter {0} to remove all",
        button: "Remove"
      }
    },
  },
};
