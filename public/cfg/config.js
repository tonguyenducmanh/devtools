/**
 * File config dùng chung cho toàn bộ ứng dụng frontend, được tiêm thẳng vào index.html
 */
(function (window) {
  window.__env = window.__env || {};
  window.__env.appName = "Tool";
  window.__env.author = "Tô Mạnh";
  window.__env.defaultValue = {
    theme: "light",
  };
  window.__env.textToQRConfig = {
    maxTextOneChunk: 1000,
    maxHistoryLength: 100,
    isCompressText: true,
  };
  window.__env.githubSource = {
    url: "https://github.com/tonguyenducmanh/tool-tomanh",
  };
  window.__env.oneTimePasswordAuthen = {
    showDecodedInfo: false,
    autoSave: true,
  };
  window.__env.APITesting = {
    agentServer: "http://127.0.0.1:7777",
  };
})(this);
