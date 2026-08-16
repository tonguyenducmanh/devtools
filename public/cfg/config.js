/**
 * File config dùng chung cho toàn bộ ứng dụng frontend, được tiêm thẳng vào index.html
 */
(function (window) {
  window.__env = window.__env || {};
  window.__env.appName = "Tools";
  window.__env.author = "Tô Mạnh";
  window.__env.footerQuote = "";
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
  window.__env.otherApps = [
    { key: "stories", url: "https://stories.tomanh.com" },
    { key: "graphics", url: "https://graphic.tomanh.com" },
  ];
  window.__env.APITesting = {
    agentServer: "http://localhost:7777",
  };
})(this);
