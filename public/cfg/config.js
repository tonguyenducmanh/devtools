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
    // có muốn chạy hàm buildCreateTableScript không
    enableCreateTable: false,
    // có muốn tạo script delete không
    enableDeleteScript: true,
  };
  window.__env.textToQRConfig = {
    maxTextOneChunk: 1000,
    maxHistoryLength: 10,
    maxTitleLength: 50,
  };
})(this);
