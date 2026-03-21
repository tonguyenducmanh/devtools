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
  },
};
