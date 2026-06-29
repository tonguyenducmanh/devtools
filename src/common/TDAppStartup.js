import utility from "@/common/TDUtility.js";
import TDCURLUtil from "@/common/api/CURLHandle/TDCURLUtil.js";
import { toast } from "@/common/plugin/TDToastPlugin.js";

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
    toast.setUseHeaderToast(userSetting["toastInHeader"] !== false);
    // đảm bảo rằng __env là một đối tượng bất biến
    utility.freezeDeepObject(window.__env);
    document.title = `${utility.defaultTitleApp()} - ${utility.getAuthorApp()}`;
  }
}

export default new TDAppStartup();
