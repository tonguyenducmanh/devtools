import tdEnum from "@/common/TDEnum.js";

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
    showTabNumber: false,
    toastInHeader: false,
    showCursorTrail: false,
    currentLoadingType: tdEnum.LoadingType.Normal,
    logCopy: true,
    logCopyDelay: 500,
  };
}
