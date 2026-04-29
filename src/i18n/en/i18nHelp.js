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
        "Batch process similar text blocks using a predefined template",
      BilingualWeb:
        "Bilingual website translation tool. Requires Agent to function.",
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
    compareCode: {
      purpose: {
        title: "What is Code Compare?",
        content: "A tool to compare code and view diffs between two code snippets with syntax highlighting for multiple programming languages.",
      },
      supportedFormats: {
        title: "Supported Formats",
        list: "PostgreSQL, MySQL, SQL, JSON, CSS, JavaScript, TypeScript, C#, C++, Rust, Shell, XML, YAML, PowerShell, Markdown and many more.",
      },
      features: {
        title: "Features",
        highlight: "Syntax highlighting based on selected language.",
        wrapText: "Support wrap text to view long code without horizontal scrolling.",
      },
    },
    colorPicker: {
      purpose: {
        title: "What is Color Picker?",
        content: "A tool that allows you to upload an image, click anywhere on the image to extract color codes (HEX, RGB, HSL) at that point.",
      },
      howToUse: {
        title: "How to Use",
        upload: "Upload the image you want to extract colors from.",
        click: "Click anywhere on the image to get the color code.",
        copy: "Press the Copy button to copy the HEX color code to clipboard.",
      },
      features: {
        title: "Features",
        magnifier: "Magnifying glass zooms the area around the mouse cursor for more accurate color selection.",
        palette: "Automatically extract main color palette from the image.",
      },
    },
    imageToBase64: {
      purpose: {
        title: "What is Image to Base64?",
        content: "A tool to convert image files to Base64 strings, commonly used to embed images directly in HTML/CSS or transmit via API.",
      },
      howToUse: {
        title: "How to Use",
        select: "Select the image file to convert.",
        preview: "Preview the selected image in the left panel.",
        copy: "Press the Copy button to copy the Base64 string.",
      },
      note: {
        title: "Note",
        content: "Base64 strings can be very long, especially for large images.",
      },
    },
    base64ToImage: {
      purpose: {
        title: "What is Base64 to Image?",
        content: "A tool to convert Base64 strings back to image files, supporting image download.",
      },
      howToUse: {
        title: "How to Use",
        paste: "Paste the Base64 string into the left panel.",
        convert: "Press Convert button to view the image.",
        download: "Press Download button to save the image to your device.",
      },
      note: {
        title: "Note",
        content: "The Base64 string must have the prefix data:image/...;base64,",
      },
    },
    codeFormatter: {
      purpose: {
        title: "What is Code Formatter?",
        content: "A tool to automatically format SQL code, supporting PostgreSQL and MySQL with various formatting options.",
      },
      howToUse: {
        title: "How to Use",
        select: "Select SQL type (PostgreSQL or MySQL).",
        paste: "Paste SQL code to format in the left panel.",
        format: "Press Format button to format the code.",
      },
      supported: {
        title: "Supported Languages",
        content: "PostgreSQL, MySQL.",
      },
    },
    textCompress: {
      purpose: {
        title: "What is Text Compress?",
        content: "A tool to compress and decompress text using popular compression algorithms like Gzip, Deflate.",
      },
      howToUse: {
        title: "How to Use",
        compress: "Paste text to compress, select algorithm and press Compress.",
        decompress: "Paste compressed text and press Decompress to decompress.",
      },
      algorithms: {
        title: "Compression Algorithms",
        gzip: "Gzip - Compress data in Gzip standard, widely compatible.",
        deflate: "Deflate - Compress data in Deflate standard.",
        deflateRaw: "Deflate Raw - Compress data without header/footer.",
      },
    },
    textManipulation: {
      purpose: {
        title: "What is Text Manipulation?",
        content: "A tool to batch process text using predefined templates, allowing transformation with given expressions.",
      },
      howToUse: {
        title: "How to Use",
        input: "Enter list of text to process (one item per line), set column and row separators.",
        expression: "Enter processing expression, use $0, $1, $2... to refer to corresponding columns.",
        execute: "Press Manipulate to process and view results.",
      },
      expressions: {
        title: "Supported Expressions",
        variable: "$n - Get value of column n.",
        upper: "$n.upper - Uppercase column n value.",
        lower: "$n.lower - Lowercase column n value.",
        snake: "$n.snake - Convert column n value to snake_case.",
        trim: "$n.trim - Trim whitespace from column n value.",
      },
    },
    textGenerator: {
      purpose: {
        title: "What is Text Generator?",
        content: "A tool to quickly generate sample text (Lorem Ipsum) for use in development and testing.",
      },
      howToUse: {
        title: "How to Use",
        selectType: "Select type of text to generate (Word or Paragraph).",
        enterCount: "Enter number of words/paragraphs to generate.",
        generate: "Press Generate to create text.",
      },
      generationTypes: {
        title: "Supported Text Types",
        word: "Word - Generate n random words.",
        paragraph: "Paragraph - Generate n Lorem Ipsum paragraphs.",
      },
    },
    cosinSimilarity: {
      purpose: {
        title: "What is Cosine Similarity?",
        content: "A tool to calculate cosine similarity between two n-dimensional vectors, commonly used in ML and NLP.",
      },
      howToUse: {
        title: "How to Use",
        enterFirst: "Enter the first vector (numbers separated by commas).",
        enterSecond: "Enter the second vector (same dimensions as the first).",
        calculate: "Press Calculate to compute.",
      },
      inputFormat: {
        title: "Input Format",
        content: "Enter numbers separated by commas. Example: 1, 2, 3, 4, 5",
        note: "Both vectors must have the same dimensions (number of elements).",
      },
    },
    apiMocking: {
      purpose: {
        title: "What is API Mocking?",
        content: "A tool to create mock APIs to fake data in environments where it's not possible to call external APIs. Data is stored on the backend (Agent).",
      },
      howToUse: {
        title: "How to Use",
        createMock: "Select HTTP method, enter endpoint and configure request/response.",
        configure: "Use the right panel to manage created mock APIs.",
        saveMock: "Press Save to save mock API, then copy CURL to call it.",
      },
      collection: {
        title: "Collection Management",
        description: "Organize mock APIs into groups for easy management. You can create new groups, delete groups and mock APIs.",
      },
      requirement: {
        title: "Requirements",
        note: "This tool requires downloading and running the Agent app (desktop application) as backend. Please click Help menu in the header to download Agent.",
      },
    },
    apiTesting: {
      purpose: {
        title: "What is API Testing?",
        content: "A tool to call APIs bypass CORS, SSL. Supports 3 modes: Normal Mode, CURL Mode and Pro Mode (run JavaScript scripts).",
      },
      modes: {
        title: "Modes",
        normal: "Normal Mode - Call single API with Header and Body configuration.",
        curl: "CURL Mode - Paste CURL command directly to call API.",
        proMode: "Pro Mode - Write JavaScript scripts to call multiple APIs in a scenario.",
      },
      features: {
        title: "Features",
        collection: "Store and manage created requests by groups.",
        history: "History of called requests, support quick re-call.",
        import: "Support import from Postman (JSON) or ZIP CURL collection.",
      },
      requirement: {
        title: "Requirements",
        note: "This tool requires downloading and running the Agent app (desktop application) as backend. Please click Help menu in the header to download Agent.",
      },
    },
    qrCodeToText: {
      purpose: {
        title: "What is QR Code Reader?",
        content: "A tool to read multiple QR codes and automatically combine them into a text. Supports decoding compressed data from the QR generation tool.",
      },
      howToUse: {
        title: "How to Use",
        upload: "Upload image files containing QR codes to read (supports multiple images).",
        scan: "Click Convert to scan and merge content from QR codes.",
        copy: "Click Copy to copy the result.",
      },
      features: {
        title: "Features",
        compress: "Automatically decompress data if text was compressed before.",
        header: "Support sorting QR fragments by header (creation date and sequence number).",
      },
    },
    textToQRCode: {
      purpose: {
        title: "What is QR Code Generator?",
        content: "A tool to generate multiple QR codes from text. Supports marking QR codes by creation date and sequence, encoding content for increased accuracy.",
      },
      howToUse: {
        title: "How to Use",
        input: "Enter the text to generate QR codes.",
        generate: "Click Generate to create QR codes.",
        copyDownload: "Click on a QR code to copy, click Download All to download all.",
      },
      features: {
        title: "Features",
        compress: "Compress data before generating QR to reduce number of codes.",
        header: "Add header (timestamp + sequence) to each QR code to support merging when reading.",
        batch: "Automatically split text into multiple QR codes if content is too long.",
      },
    },
    ocr: {
      purpose: {
        title: "What is OCR?",
        content: "Optical Character Recognition tool to extract text from images. Supports Vietnamese and English.",
      },
      howToUse: {
        title: "How to Use",
        upload: "Upload images to recognize (supports multiple images).",
        process: "Click Process to run OCR.",
        copy: "Click on each result or Copy All to copy all.",
      },
      features: {
        title: "Features",
        language: "Supports multiple languages: Vietnamese, English.",
        psm: "Customize page segmentation mode (PSM).",
        whitelist: "Only recognize characters in the allowed list.",
        preprocessing: "Image preprocessing to improve accuracy (grayscale, contrast enhancement, denoising).",
      },
    },
    jsonToPostgreSQL: {
      purpose: {
        title: "What is JSON to PostgreSQL?",
        content: "A tool to convert JSON data into PostgreSQL SQL statements (INSERT, CREATE TABLE, DELETE).",
      },
      howToUse: {
        title: "How to Use",
        input: "Paste JSON directly or upload a JSON file.",
        configure: "Configure table name, schema, primary key and other options.",
        convert: "Click Convert to generate SQL script.",
      },
      features: {
        title: "Features",
        createTable: "Auto-generate CREATE TABLE script with appropriate data types.",
        deleteScript: "Generate DELETE script to remove old data before INSERT.",
        fileUpload: "Support uploading JSON file to process.",
      },
    },
    jsonToOneLineString: {
      purpose: {
        title: "What is JSON to String?",
        content: "A tool to convert JSON to a single-line string in the syntax of various programming languages.",
      },
      howToUse: {
        title: "How to Use",
        input: "Paste JSON or JS object into the input field.",
        selectLanguage: "Select output language (JavaScript, C#, Go, Python, Java, Raw).",
        convert: "Click Convert to transform.",
      },
      features: {
        title: "Features",
        languages: "Supports multiple languages: JavaScript, C#, Go, Python, Java, Raw.",
        escapeUnicode: "Option to escape Unicode characters to \\uXXXX.",
      },
    },
    jsonToExcel: {
      purpose: {
        title: "What is JSON to Excel?",
        content: "A tool to convert JSON data to Excel file (.xlsx).",
      },
      howToUse: {
        title: "How to Use",
        input: "Paste JSON or upload a JSON file.",
        convert: "Click Convert to generate Excel file.",
        download: "Excel file will be downloaded automatically.",
      },
      features: {
        title: "Features",
        boldHeader: "Bold header row.",
        autoWidth: "Auto-fit column widths.",
        freezeRow: "Freeze the first row when scrolling.",
      },
    },
    jsonToModel: {
      purpose: {
        title: "What is JSON to Model?",
        content: "A tool to convert JSON to model class for multiple programming languages.",
      },
      howToUse: {
        title: "How to Use",
        input: "Paste JSON into the input field.",
        selectLanguage: "Select output language.",
        convert: "Click Convert to generate model class.",
      },
      features: {
        title: "Features",
        languages: "Supports multiple languages: C#,Go.",
        namespace: "Customize namespace/class name.",
        options: "Many options: PascalCase, nullable, JsonProperty, record type...",
      },
    },
    remoteDesktop: {
      purpose: {
        title: "What is Remote Desktop RDP?",
        content: "A tool to connect to remote computers via RDP (Remote Desktop Protocol). Uses IronRDP WebAssembly to connect directly from the browser.",
      },
      howToUse: {
        title: "How to Use",
        inputHost: "Enter the host address and port of the computer to connect to (e.g. 192.168.1.1:3389).",
        inputCredentials: "Enter username and password for authentication.",
        connect: "Click Connect button to start the remote session.",
        fullscreen: "Click fullscreen button to enlarge the display, press ESC to exit.",
      },
      features: {
        title: "Features",
        keyboard: "Full keyboard control support.",
        mouse: "Mouse support with click, scroll and movement.",
        clipboard: "Clipboard support for copy/paste text.",
        agent: "Requires running Agent app to connect via proxy.",
      },
      troubleshooting: {
        title: "Troubleshooting",
        connection: "Check if the host address and port are correct.",
        credentials: "Check the username and password.",
        agent: "Make sure the Agent app is running and connected.",
      },
    },
    bilingualWeb: {
      purpose: {
        title: "What is Bilingual Web?",
        content: "A tool that displays an actual website with 100% original layout, while translating the visible text into bilingual form without breaking the HTML/CSS structure.",
      },
      howToUse: {
        title: "How to use",
        input: "Enter the website URL to translate.",
        fetch: "Click 'Fetch & Translate' to embed the website and automatically find text to translate.",
        wait: "The system will automatically call the Agent to translate and inject the results directly below each original text.",
      },
      options: {
        title: "Configuration Options",
        delay: "Delay time - Wait time for dynamic websites (React, etc.) to finish loading UI before scanning for text.",
        tags: "Block Tags - HTML tags that will be scanned for translation (e.g., P, H1, LI).",
        classes: "Filter by Class - Specify class names to translate, separated by semicolons (;).",
        ids: "Filter by ID - Specify ID names to translate, separated by semicolons (;).",
      },
    },
  },
};
