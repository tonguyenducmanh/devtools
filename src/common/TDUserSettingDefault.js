/**
 * Config default toàn bộ thiết lập mặc định mà user có thể cấu hình bằng tay
 */
export function getUserSettingDefault() {
  return {
    theme: "light",
    currentLanguage: "vi",
    agentURL: window.__env?.APITesting?.agentServer,
    wrapTab: true,
    showSideBar: true,
    showHeader: true,
  };
}
