import tmEnum from "@/common/TMEnum.js";

/**
 * Config default toàn bộ thiết lập mặc định mà user có thể cấu hình bằng tay
 */
export function getUserSettingDefault() {
  return {
    theme: "github-light",
    currentLanguage: "vi",
    agentURL: window.__env?.APITesting?.agentServer,
    wrapTab: true,
    showSideBar: true,
    cursorEffect: "off",
    backgroundEffect: "off",
    welcomeBackground: tmEnum.welcomeBackground.Normal,
  };
}
