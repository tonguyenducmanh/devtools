import utility from "@/common/TDUtility.js";
import TDCURLUtil from "@/common/api/CURLHandle/TDCURLUtil.js";

class TDAppStartup {
  constructor() {}

  /**
   * Phương thức khởi tạo ứng dụng
   */
  async initialize() {
    let userSetting = await utility.getUserSettings();
    let setConfig = TDCURLUtil.setGlobalInfoBeforeRequest({
      agentURL: userSetting["agentURL"],
    });

    utility.setTheme(userSetting["theme"]);
    // đảm bảo rằng __env là một đối tượng bất biến
    utility.freezeDeepObject(window.__env);
  }
}

export default new TDAppStartup();
