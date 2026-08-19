/**
 * Config dùng chung cho toàn bộ ứng dụng frontend.
 * Được import ở đầu src/main.js để chạy trước toàn bộ app, bundle vào
 * entry chunk (có hash + version) nên CDN không cache bản cũ sau mỗi build.
 */
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
  { key: "graphics", url: "https://graphic.tomanh.com" },
  { key: "stories", url: "https://stories.tomanh.com" },
];
window.__env.APITesting = {
  agentServer: "http://localhost:7777",
};
