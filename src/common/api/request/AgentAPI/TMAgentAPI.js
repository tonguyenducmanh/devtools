import TMBaseAPI from "@/common/api/request/TMBaseAPI.js";

/**
 * TMAgentAPI - API class cho Agent controller
 * Kế thừa từ TMBaseAPI
 */
class TMAgentAPI extends TMBaseAPI {
  /**
   * Constructor
   * @param {string} baseUrl - Base URL của API (vd: https://api.example.com)
   * @param {string} controllerName - Tên controller (vd: agents, users, products)
   */
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
  }
  getBaseUrl() {
    return window.__tdAPI?.automation?.agentURL;
  }

  /**
   * Health check
   * BE trả về trạng thái service kèm version của BE đang chạy
   */
  async heathCheck() {
    return await this.get("/");
  }
}

export default TMAgentAPI;
