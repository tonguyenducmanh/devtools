export default {
  i18nHelp: {
    welcome: {
      purpose: {
        title: "Tại sao lại có app này?",
        content:
          "Dev Tools là bộ công cụ hỗ trợ lập trình viên trong quá trình phát triển phần mềm. Thay vì phải cài đặt nhiều ứng dụng riêng lẻ cho từng tính năng hoặc tự viết các script phức tạp tốn thời gian, bạn có thể sử dụng ngay các công cụ được tích hợp sẵn tại đây.",
      },
      quickStart: {
        title: "Bắt đầu nhanh",
        selectTool: "Chọn công cụ từ thanh menu bên trái để bắt đầu sử dụng.",
        searchTool: "Nhấn Ctrl + P (hoặc Cmd + P trên Mac) để mở hộp tìm kiếm, gõ tên công cụ bạn cần và nhấn Enter để mở nhanh.",
        note: "Mẹo: Sử dụng ↑↓ để di chuyển giữa các kết quả tìm kiếm.",
      },
      multiTab: {
        title: "Làm việc với nhiều tab",
        description:
          "Ứng dụng hỗ trợ mở nhiều công cụ cùng lúc dưới dạng tab. Điều này giúp bạn không cần mở nhiều cửa sổ trình duyệt để sử dụng đồng thời các tính năng khác nhau.",
        rightClick: "Nhấn chuột phải vào tên tab để mở menu ngữ cảnh với các tùy chọn:",
        duplicateTab: "Nhân bản tab - Tạo bản sao của tab hiện tại",
        closeTab: "Đóng tab - Đóng tab đang chọn",
        closeAllTabs: "Đóng tất cả - Đóng toàn bộ các tab đang mở",
        dragReorder: "Kéo thả tab để sắp xếp lại thứ tự các tab.",
      },
      agent: {
        title: "Các công cụ trong app được chia làm 2 loại:",
        webOnly: "Chạy trên web - Không cần cài đặt thêm, hoạt động trực tiếp trên trình duyệt.",
        needAgent: "Cần Agent - Cần tải và chạy app Agent (ứng dụng desktop) để làm backend, giúp vượt qua các giới hạn của trình duyệt như CORS, SSL, fake header,...",
        downloadAgent: "Để tải Agent, bấm vào menu Trợ giúp ở thanh header phía trên và chọn \"Tải Agent\".",
      },
    },
    oneTimePassword: {
      purpose: {
        title: "Công cụ OTP là gì?",
        content: "Công cụ giúp tạo mã OTP (One-Time Password) 6 ký tự, tự động thay đổi mỗi 30 giây. Hỗ trợ import tài khoản từ Google Authenticator thông qua QR code, URL hoặc nhập thủ công.",
      },
      importData: {
        title: "Nhập dữ liệu",
        scanQR: "Quét QR Code - Upload file ảnh chứa mã QR từ Google Authenticator để tự động nhập tài khoản.",
        pasteURL: "Dán URL - Dán link otpauth-migration:// từ Google Authenticator để import tài khoản.",
        manual: "Nhập thủ công - Điền thông tin issuer, name và secret để thêm tài khoản mới.",
      },
      security: {
        title: "Bảo mật",
        description: "Dữ liệu OTP được mã hóa và lưu trữ cục bộ trên thiết bị của bạn. Bạn cần nhập mật khẩu (mật khẩu do bạn tự tạo) để mã hóa dữ liệu cache phía trình duyệt và mở tài khoản đã lưu.",
      },
      quickUse: {
        title: "Sử dụng nhanh",
        copyOTP: "Nhấp vào bất kỳ mã OTP nào để sao chép vào clipboard.",
        autoRefresh: "Mã OTP tự động làm mới mỗi 30 giây.",
        note: "Thanh progress phía trên hiển thị thời gian còn lại trước khi mã OTP thay đổi.",
      },
    },
    compareCode: {
      purpose: {
        title: "So sánh code là gì?",
        content: "Công cụ so sánh code hỗ trợ xem diff giữa 2 đoạn code với tính năng highlight cú pháp cho nhiều ngôn ngữ lập trình khác nhau.",
      },
      supportedFormats: {
        title: "Định dạng được hỗ trợ",
        list: "PostgreSQL, MySQL, SQL, JSON, CSS, JavaScript, TypeScript, C#, C++, Rust, Shell, XML, YAML, PowerShell, Markdown và nhiều ngôn ngữ khác.",
      },
      features: {
        title: "Tính năng",
        highlight: "Highlight cú pháp code theo ngôn ngữ được chọn.",
        wrapText: "Hỗ trợ wrap text để xem code dài mà không cần cuộn ngang.",
      },
    },
    colorPicker: {
      purpose: {
        title: "Trích xuất màu từ ảnh là gì?",
        content: "Công cụ cho phép upload ảnh, click vào vị trí bất kỳ trên ảnh để lấy mã màu (HEX, RGB, HSL) tại điểm đó.",
      },
      howToUse: {
        title: "Cách sử dụng",
        upload: "Upload ảnh cần trích xuất màu.",
        click: "Click vào vị trí bất kỳ trên ảnh để lấy mã màu.",
        copy: "Nhấn nút Copy để sao chép mã màu HEX vào clipboard.",
      },
      features: {
        title: "Tính năng",
        magnifier: "Kính lúp phóng đại vùng xung quanh con trỏ chuột để chọn màu chính xác hơn.",
        palette: "Tự động trích xuất bảng màu chính từ ảnh.",
      },
    },
    imageToBase64: {
      purpose: {
        title: "Chuyển ảnh sang Base64 là gì?",
        content: "Công cụ chuyển đổi file ảnh thành chuỗi Base64, thường dùng để nhúng ảnh trực tiếp vào HTML/CSS hoặc truyền qua API.",
      },
      howToUse: {
        title: "Cách sử dụng",
        select: "Chọn file ảnh cần chuyển đổi.",
        preview: "Xem trước ảnh đã chọn ở panel bên trái.",
        copy: "Nhấn nút Copy để sao chép chuỗi Base64.",
      },
      note: {
        title: "Lưu ý",
        content: "Chuỗi Base64 có thể rất dài, đặc biệt với ảnh có kích thước lớn.",
      },
    },
    base64ToImage: {
      purpose: {
        title: "Chuyển Base64 sang ảnh là gì?",
        content: "Công cụ chuyển đổi chuỗi Base64 thành file ảnh, hỗ trợ tải ảnh về máy.",
      },
      howToUse: {
        title: "Cách sử dụng",
        paste: "Dán chuỗi Base64 vào panel bên trái.",
        convert: "Nhấn nút Convert để xem ảnh.",
        download: "Nhấn nút Download để tải ảnh về máy.",
      },
      note: {
        title: "Lưu ý",
        content: "Chuỗi Base64 phải có prefix data:image/...;base64,",
      },
    },
    codeFormatter: {
      purpose: {
        title: "Định dạng code SQL là gì?",
        content: "Công cụ format code SQL tự động, hỗ trợ PostgreSQL và MySQL với nhiều tùy chọn định dạng.",
      },
      howToUse: {
        title: "Cách sử dụng",
        select: "Chọn loại SQL (PostgreSQL hoặc MySQL).",
        paste: "Dán code SQL cần format vào panel bên trái.",
        format: "Nhấn nút Format để định dạng code.",
      },
      supported: {
        title: "Ngôn ngữ được hỗ trợ",
        content: "PostgreSQL, MySQL.",
      },
    },
    textCompress: {
      purpose: {
        title: "Nén/Giải nén text là gì?",
        content: "Công cụ nén và giải nén văn bản sử dụng các thuật toán nén phổ biến như Gzip, Deflate.",
      },
      howToUse: {
        title: "Cách sử dụng",
        compress: "Dán text cần nén, chọn thuật toán và nhấn Compress.",
        decompress: "Dán text đã nén và nhấn Decompress để giải nén.",
      },
      algorithms: {
        title: "Thuật toán nén",
        gzip: "Gzip - Nén dữ liệu theo chuẩn Gzip, tương thích rộng rãi.",
        deflate: "Deflate - Nén dữ liệu theo chuẩn Deflate.",
        deflateRaw: "Deflate Raw - Nén dữ liệu không có header/footer.",
      },
    },
    textManipulation: {
      purpose: {
        title: "Xử lý text hàng loạt là gì?",
        content: "Công cụ xử lý hàng loạt văn bản theo mẫu có sẵn, cho phép biến đổi text với các biểu thức cho trước.",
      },
      howToUse: {
        title: "Cách sử dụng",
        input: "Nhập danh sách text cần xử lý (mỗi dòng 1 item), đặt separator cho cột và dòng.",
        expression: "Nhập biểu thức xử lý, dùng $0, $1, $2... để refer đến cột tương ứng.",
        execute: "Nhấn Xử lý để xử lý và xem kết quả.",
      },
      expressions: {
        title: "Các biểu thức được hỗ trợ",
        variable: "$n - Lấy giá trị cột thứ n.",
        upper: "$n.upper - Viết hoa giá trị cột thứ n.",
        lower: "$n.lower - Viết thường giá trị cột thứ n.",
        snake: "$n.snake - Chuyển giá trị cột thứ n thành snake_case.",
        trim: "$n.trim - Trim khoảng trắng giá trị cột thứ n.",
      },
    },
    textGenerator: {
      purpose: {
        title: "Tạo text mẫu là gì?",
        content: "Công cụ tạo nhanh các đoạn text mẫu (Lorem Ipsum) để sử dụng trong quá trình phát triển và testing.",
      },
      howToUse: {
        title: "Cách sử dụng",
        selectType: "Chọn loại text cần tạo (Word hoặc Paragraph).",
        enterCount: "Nhập số lượng từ/đoạn cần tạo.",
        generate: "Nhấn Generate để tạo text.",
      },
      generationTypes: {
        title: "Loại text được hỗ trợ",
        word: "Word - Tạo n từ ngẫu nhiên.",
        paragraph: "Paragraph - Tạo n đoạn văn Lorem Ipsum.",
      },
    },
    cosinSimilarity: {
      purpose: {
        title: "Tính độ tương đồng Cosine là gì?",
        content: "Công cụ tính toán độ tương đồng cosine giữa 2 vector n chiều, thường dùng trong ML và NLP.",
      },
      howToUse: {
        title: "Cách sử dụng",
        enterFirst: "Nhập vector thứ nhất (các số cách nhau bằng dấu phẩy).",
        enterSecond: "Nhập vector thứ hai (cùng số chiều với vector thứ nhất).",
        calculate: "Nhấn Calculate để tính toán.",
      },
      inputFormat: {
        title: "Định dạng nhập liệu",
        content: "Nhập các số cách nhau bằng dấu phẩy. Ví dụ: 1, 2, 3, 4, 5",
        note: "Cả 2 vector phải có cùng số chiều (số phần tử).",
      },
    },
    apiMocking: {
      purpose: {
        title: "Mock API là gì?",
        content: "Công cụ tạo mock API giúp fake data ở những môi trường không thể call ra API bên ngoài internet. Dữ liệu được lưu trữ phía backend (Agent).",
      },
      howToUse: {
        title: "Cách sử dụng",
        createMock: "Chọn HTTP method, nhập endpoint và cấu hình request/response.",
        configure: "Sử dụng panel bên phải để quản lý các mock API đã tạo.",
        saveMock: "Nhấn Save để lưu mock API, sau đó có thể copy CURL để gọi.",
      },
      collection: {
        title: "Quản lý Collection",
        description: "Tổ chức các mock API theo nhóm (group) để dễ quản lý. Có thể tạo nhóm mới, xóa nhóm và xóa mock API.",
      },
      requirement: {
        title: "Yêu cầu",
        note: "Công cụ này cần tải và chạy app Agent (ứng dụng desktop) để làm backend. Vui lòng bấm menu Trợ giúp ở header để tải Agent.",
      },
    },
    apiTesting: {
      purpose: {
        title: "Test API là gì?",
        content: "Công cụ gọi API bypass CORS, SSL. Hỗ trợ 2 chế độ: Normal Mode và Pro Mode (chạy script JavaScript).",
      },
      modes: {
        title: "Các chế độ",
        normal: "Normal Mode - Gọi API đơn lẻ với cấu hình Header và Body.",
        proMode: "Pro Mode - Viết script JavaScript để gọi hàng loạt API theo kịch bản.",
      },
      features: {
        title: "Tính năng",
        collection: "Lưu trữ và quản lý các request đã tạo theo nhóm.",
        history: "Lịch sử các request đã gọi, hỗ trợ gọi lại nhanh.",
        import: "Hỗ trợ import từ Postman (JSON) hoặc ZIP collection CURL.",
      },
      requirement: {
        title: "Yêu cầu",
        note: "Công cụ này cần tải và chạy app Agent (ứng dụng desktop) để làm backend. Vui lòng bấm menu Trợ giúp ở header để tải Agent.",
      },
    },
    qrCodeToText: {
      purpose: {
        title: "Đọc QR Code là gì?",
        content: "Công cụ đọc hàng loạt mã QR và tự động nối lại thành đoạn văn bản. Hỗ trợ giải mã dữ liệu đã được nén từ tool tạo mã QR.",
      },
      howToUse: {
        title: "Cách sử dụng",
        upload: "Upload file ảnh chứa mã QR cần đọc (hỗ trợ nhiều ảnh).",
        scan: "Nhấn nút Convert để quét và ghép nối nội dung từ các mã QR.",
        copy: "Nhấn nút Copy để sao chép kết quả.",
      },
      features: {
        title: "Tính năng",
        compress: "Tự động giải nén dữ liệu nếu text được nén trước đó.",
        header: "Hỗ trợ sắp xếp các mảnh QR theo header (ngày tạo và số thứ tự).",
      },
    },
    textToQRCode: {
      purpose: {
        title: "Tạo QR Code là gì?",
        content: "Công cụ tạo hàng loạt mã QR từ đoạn văn bản. Hỗ trợ đánh dấu mã QR theo ngày tạo và số thứ tự, mã hóa nội dung để tăng độ chính xác.",
      },
      howToUse: {
        title: "Cách sử dụng",
        input: "Nhập đoạn text cần tạo mã QR.",
        generate: "Nhấn Generate để tạo các mã QR.",
        copyDownload: "Click vào mã QR để copy, nhấn Download All để tải tất cả.",
      },
      features: {
        title: "Tính năng",
        compress: "Nén dữ liệu trước khi tạo QR để giảm số lượng mã.",
        header: "Thêm header (timestamp + thứ tự) vào mỗi mã QR để hỗ trợ ghép nối khi đọc.",
        batch: "Tự động chia text thành nhiều mã QR nếu nội dung quá dài.",
      },
    },
    ocr: {
      purpose: {
        title: "OCR là gì?",
        content: "Công cụ nhận dạng ký tự quang học (OCR) giúp trích xuất text từ ảnh. Hỗ trợ tiếng Việt và tiếng Anh.",
      },
      howToUse: {
        title: "Cách sử dụng",
        upload: "Upload ảnh cần nhận dạng (hỗ trợ nhiều ảnh).",
        process: "Nhấn Process để xử lý OCR.",
        copy: "Click vào từng kết quả hoặc Copy All để sao chép toàn bộ.",
      },
      features: {
        title: "Tính năng",
        language: "Hỗ trợ nhiều ngôn ngữ: Tiếng Việt, Tiếng Anh.",
        psm: "Tùy chỉnh chế độ phân đoạn trang (PSM).",
        whitelist: "Chỉ nhận dạng các ký tự trong danh sách cho phép.",
        preprocessing: "Tiền xử lý ảnh để tăng độ chính xác (grayscale, tăng contrast, khử nhiễu).",
      },
    },
    jsonToPostgreSQL: {
      purpose: {
        title: "JSON to PostgreSQL là gì?",
        content: "Công cụ chuyển đổi dữ liệu JSON thành câu lệnh SQL (INSERT, CREATE TABLE, DELETE) cho PostgreSQL.",
      },
      howToUse: {
        title: "Cách sử dụng",
        input: "Dán JSON trực tiếp hoặc upload file JSON.",
        configure: "Cấu hình tên bảng, schema, primary key và các tùy chọn khác.",
        convert: "Nhấn Convert để tạo script SQL.",
      },
      features: {
        title: "Tính năng",
        createTable: "Tự động tạo script CREATE TABLE với kiểu dữ liệu phù hợp.",
        deleteScript: "Tạo script DELETE để xóa dữ liệu cũ trước khi INSERT.",
        fileUpload: "Hỗ trợ upload file JSON để xử lý.",
      },
    },
    jsonToOneLineString: {
      purpose: {
        title: "JSON to String là gì?",
        content: "Công cụ chuyển đổi JSON thành chuỗi string một dòng theo cú pháp của nhiều ngôn ngữ lập trình khác nhau.",
      },
      howToUse: {
        title: "Cách sử dụng",
        input: "Dán JSON hoặc JS object vào ô input.",
        selectLanguage: "Chọn ngôn ngữ đầu ra (JavaScript, C#, Go, Python, Java, Raw).",
        convert: "Nhấn Convert để chuyển đổi.",
      },
      features: {
        title: "Tính năng",
        languages: "Hỗ trợ nhiều ngôn ngữ: JavaScript, C#, Go, Python, Java, Raw.",
        escapeUnicode: "Tùy chọn escape các ký tự Unicode thành \\uXXXX.",
      },
    },
    jsonToExcel: {
      purpose: {
        title: "JSON to Excel là gì?",
        content: "Công cụ chuyển đổi dữ liệu JSON thành file Excel (.xlsx).",
      },
      howToUse: {
        title: "Cách sử dụng",
        input: "Dán JSON hoặc upload file JSON.",
        convert: "Nhấn Convert để tạo file Excel.",
        download: "File Excel sẽ được tải xuống tự động.",
      },
      features: {
        title: "Tính năng",
        boldHeader: "In đậm dòng header.",
        autoWidth: "Tự động điều chỉnh độ rộng cột.",
        freezeRow: "Cố định dòng đầu tiên khi cuộn.",
      },
    },
    jsonToModel: {
      purpose: {
        title: "JSON to Model là gì?",
        content: "Công cụ chuyển đổi JSON thành class model cho nhiều ngôn ngữ lập trình.",
      },
      howToUse: {
        title: "Cách sử dụng",
        input: "Dán JSON vào ô input.",
        selectLanguage: "Chọn ngôn ngữ đầu ra.",
        convert: "Nhấn Convert để tạo model class.",
      },
      features: {
        title: "Tính năng",
        languages: "Hỗ trợ nhiều ngôn ngữ: C#,Go.",
        namespace: "Tùy chỉnh namespace/class name.",
        options: "Nhiều tùy chọn: PascalCase, nullable, JsonProperty, record type...",
      },
    },
    remoteDesktop: {
      purpose: {
        title: "Máy tính từ xa RDP là gì?",
        content: "Công cụ kết nối máy tính từ xa qua giao thức RDP (Remote Desktop Protocol). Sử dụng IronRDP WebAssembly để kết nối trực tiếp từ trình duyệt.",
      },
      howToUse: {
        title: "Cách sử dụng",
        inputHost: "Nhập địa chỉ host và port của máy muốn kết nối (vd: 192.168.1.1:3389).",
        inputCredentials: "Nhập tên người dùng và mật khẩu để xác thực.",
        connect: "Nhấn nút Kết nối để bắt đầu phiên làm việc từ xa.",
        fullscreen: "Nhấn nút fullscreen để phóng to màn hình, nhấn ESC để thoát.",
      },
      features: {
        title: "Tính năng",
        keyboard: "Hỗ trợ điều khiển bàn phím đầy đủ.",
        mouse: "Hỗ trợ chuột với click, scroll và di chuyển.",
        clipboard: "Hỗ trợ clipboard để copy/paste text.",
        agent: "Cần chạy Agent app để kết nối qua proxy.",
      },
      troubleshooting: {
        title: "Xử lý sự cố",
        connection: "Kiểm tra địa chỉ host và port đã đúng chưa.",
        credentials: "Kiểm tra tên đăng nhập và mật khẩu.",
        agent: "Đảm bảo Agent app đang chạy và kết nối được.",
      },
    },
    bilingualWeb: {
      purpose: {
        title: "Dịch trang web song ngữ là gì?",
        content: "Công cụ cho phép hiển thị một trang web thực tế 100% giao diện gốc, đồng thời dịch các đoạn văn bản hiển thị trên trang thành song ngữ mà không làm hỏng cấu trúc HTML/CSS.",
      },
      howToUse: {
        title: "Cách sử dụng",
        input: "Nhập URL trang web cần dịch.",
        fetch: "Nhấn 'Tải & Dịch' để hệ thống nhúng trang web và tự động tìm văn bản để dịch.",
        wait: "Hệ thống sẽ tự động gọi Agent để dịch và chèn kết quả trực tiếp xuống phía dưới mỗi văn bản gốc.",
      },
      options: {
        title: "Tuỳ chọn cấu hình",
        delay: "Thời gian delay - Thời gian chờ trang web động (React, v.v) tải xong giao diện trước khi bắt đầu quét text.",
        tags: "Block Tags - Các thẻ HTML sẽ được quét để dịch (VD: P, H1, LI).",
        classes: "Lọc theo Class - Chỉ định cụ thể tên các class muốn dịch, ngăn cách bởi dấu chấm phẩy (;).",
        ids: "Lọc theo ID - Chỉ định cụ thể tên các ID muốn dịch, ngăn cách bởi dấu chấm phẩy (;).",
      },
    },
    postgreSQLQuery: {
      purpose: {
        title: "Mô tả tính năng",
        content: "PostgreSQL Query là công cụ cho phép bạn kết nối trực tiếp vào cơ sở dữ liệu PostgreSQL và thực thi các câu lệnh SQL ngay trong ứng dụng. Kết quả trả về dưới dạng bảng trực quan, dễ đọc.",
      },
      howToUse: {
        title: "Hướng dẫn sử dụng",
        step1: "1. Mở tab Kết nối ở thanh bên phải để thêm nhóm và cấu hình kết nối PostgreSQL.",
        step2: "2. Chọn kết nối muốn dùng từ combobox ở header.",
        step3: "3. Nhập câu lệnh SQL vào ô soạn thảo (hỗ trợ gợi ý intellisense).",
        step4: "4. Nhấn nút 'Chạy truy vấn' hoặc Ctrl+Enter để thực thi.",
        step5: "5. Kết quả hiển thị bên dưới dưới dạng bảng có thể cuộn và sắp xếp.",
      },
      features: {
        title: "Các tính năng nổi bật",
        intellisense: "Gợi ý SQL thông minh: Keywords, tên bảng, tên cột được load tự động từ PostgreSQL server.",
        savedScripts: "Lưu script: Lưu các câu query thường dùng vào mục 'Script đã lưu' để tái sử dụng.",
        formatCode: "Định dạng code: Tự động định dạng câu SQL cho dễ đọc.",
        multipleConnections: "Nhiều kết nối: Quản lý nhiều kết nối và phân nhóm dễ dàng.",
      },
      connectionString: {
        title: "Cấu hình chuỗi kết nối",
        format: "postgresql://user:password@host:port/dbname",
        example: "Ví dụ: postgresql://postgres:mypassword@localhost:5432/mydb",
        sslNote: "Thêm ?sslmode=disable nếu không dùng SSL.",
      },
    },
  },
};
