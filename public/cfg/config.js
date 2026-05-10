/**
 * File config dùng chung cho toàn bộ ứng dụng frontend, được tiêm thẳng vào index.html
 */
(function (window) {
  window.__env = window.__env || {};
  window.__env.appName = "Dev Tools";
  window.__env.author = "Tô Mạnh";
  window.__env.version = "v10.1.8";
  window.__env.defaultValue = {
    theme: "light",
  };
  window.__env.textToQRConfig = {
    maxTextOneChunk: 1000,
    maxHistoryLength: 100,
    isCompressText: true,
  };
  window.__env.githubSource = {
    url: "https://github.com/tonguyenducmanh/devtools",
    releasesUrl: "https://github.com/tonguyenducmanh/devtools/releases",
  };
  window.__env.oneTimePasswordAuthen = {
    showDecodedInfo: false,
    autoSave: true,
  };
  window.__env.APITesting = {
    agentServer: "http://localhost:7777",
  };
  window.__env.quoteConfig = {
    showQuote: false,
  };
  window.__env.mindMapConfig = {
    autoSaveIntervalInSecond: 60,
    maxHistoryItems: 500,
  };
  window.__env.eventGlobal = {
    logCopy: true,
    logCopyDelay: 500,
  };
})(this);
