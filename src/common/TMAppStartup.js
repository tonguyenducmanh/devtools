import utility from "@/common/TMUtility.js";
import TMAutomation from "@/common/automation/TMAutomation.js";

class TMAppStartup {
  constructor() {}

  /**
   * Phương thức khởi tạo ứng dụng
   */
  async initialize() {
    let userSetting = await utility.getUserSettings();
    utility.userSettings = userSetting;
    let setConfig = TMAutomation.setGlobalInfoBeforeRequest({
      agentURL: userSetting["agentURL"],
    });

    utility.setTheme(userSetting["theme"]);
    // đảm bảo rằng __env là một đối tượng bất biến
    utility.freezeDeepObject(window.__env);
    document.title = `${utility.defaultTitleApp()} - ${utility.getAuthorApp()}`;
  }
}

export default new TMAppStartup();
