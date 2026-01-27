import TDBaseAPI from "@/common/api/request/TDBaseAPI.js";

/**
 * TDAgentAPI - API class cho Agent controller
 * Kế thừa từ TDBaseAPI
 */
class TDAgentAPI extends TDBaseAPI {
  /**
   * Constructor
   * @param {string} baseUrl - Base URL của API (vd: https://api.example.com)
   * @param {string} controllerName - Tên controller (vd: agents, users, products)
   */
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
  }
  getBaseUrl() {
    return window.__tdInfo?.agentURL;
  }

  /**
   * Health check
   */
  async heathCheck() {
    return await this.get("/");
  }

  /**
   * Xử lý gọi nối api
   */
  async executeRequest(request, signal) {
    return await this.post("/exec", request, null, signal);
  }
}

export default TDAgentAPI;
