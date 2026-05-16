import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

/**
 * TDServerMockAPI - API class cho Agent controller chuyên về tạo mock api
 */
class TDServerMockAPI extends TDAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
    this.mockItem = new TDAgentAPI(baseUrl, "mock_api");
    this.mockGroup = new TDAgentAPI(baseUrl, "mock_group");
  }

  /**
   * Lấy tất cả mock APIs
   */
  async restartMockServerFromClient() {
    // using base controller's manual route
    return await this.get("/mock_api/restart_mock_server");
  }

  /**
   * Lấy ra base url của mock server
   */
  async getMockBaseURL() {
    return await this.get("/mock_api/get_base_url");
  }
}

export default TDServerMockAPI;
