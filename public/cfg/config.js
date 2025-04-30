/**
 * File config dùng chung cho toàn bộ ứng dụng frontend, được tiêm thẳng vào index.html
 */
(function (window) {
  window.__env = window.__env || {};
  window.__env.testConfig = {
    testMessage: "hello config",
  };
  window.__env.defaultValue = {
    theme: "light",
  };
  window.__env.jsonToPostgreSQLConfig = {
    logTime: "Thời gian chạy tổng cộng là: {0} phút",
    keyReplace: "{0}",
    logActionSuccess: "Đã thực hiện được: {0}%",
    startLog: "Bắt đầu thực hiện tác vụ",
    // có muốn ghi log không phải lỗi không
    isLogInfo: true,
    // định dạng ngày tháng khi ghi log
    logLocation: "vn-VN",
    // có muốn chạy hàm buildCreateTableScript không
    enableCreateTable: false,
  };
})(this);
