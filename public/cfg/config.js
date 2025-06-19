/**
 * File config dùng chung cho toàn bộ ứng dụng frontend, được tiêm thẳng vào index.html
 */
(function (window) {
  window.__env = window.__env || {};
  window.__env.version = "v1.1.5";
  window.__env.defaultValue = {
    theme: "light",
  };
  window.__env.textToQRConfig = {
    maxTextOneChunk: 1000,
    maxHistoryLength: 100,
    maxTitleLength: 50,
    isCompressText: true,
  };
  window.__env.githubSource = {
    url: "https://github.com/tonguyenducmanh/utility-for-dev",
  };
  window.__env.jsonParser = {
    showConfigLib: false,
  };
  window.__env.oneTimePasswordAuthen = {
    showDecodedInfo: false,
    autoSave: true,
  };
})(this);
