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
    feature: {
      OpticalCharacterRecognition:
        "Công cụ OCR tiếng Việt, có thể có sai sót.",
      AppDataMiner:
        "Xem toàn bộ dữ liệu được lưu trữ trong cơ sở dữ liệu của ứng dụng",
      cosinSimilarity: "Tính toán độ tương đồng giữa 2 vector cùng có n chiều",
      oneTimePassword: "Tạo các mã OTP 6 ký tự 30s 1 lần",
      APITesting:
        "Gọi API bypass CORS, SSL (Normal Mode) hoặc tạo các script tùy chỉnh gọi hàng loạt API (Pro Mode)",
      APIMocking:
        "Tạo mock API giúp fake data ở những môi trường không thể call ra API bên ngoài internet",
      QRCodeFromText:
        "Tạo hàng loạt mã QR từ 1 đoạn văn bản, đánh dấu mã QR theo ngày tạo và số thứ tự gen QR, mã hóa nội dung để tăng độ chính xác",
      QRCodeToText:
        "Đọc hàng loạt mã QR và tự động nối lại thành 1 đoạn văn bản (chỉ ưu tiên lấy các mã của ngày tạo gần nhất), giải mã dữ liệu đã được nén từ tool tạo mã QR",
      textManipulation:
        "Xử lý hàng loạt đoạn văn bản tương tự nhau theo mẫu có sẵn",
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
        content: "PostgreSQL, MySQL với các tùy chọn indent, uppercase keyword.",
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
        execute: "Nhấn Manipulate để xử lý và xem kết quả.",
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
  },
};
