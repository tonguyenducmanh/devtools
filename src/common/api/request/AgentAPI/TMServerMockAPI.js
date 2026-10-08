import TMAgentAPI from "@/common/api/request/AgentAPI/TMAgentAPI.js";

/**
 * TMServerMockAPI - API class cho Agent controller chuyên về tạo mock api
 */
class TMServerMockAPI extends TMAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
    this.mockItem = new TMAgentAPI(baseUrl, "mock_api");
    this.mockGroup = new TMAgentAPI(baseUrl, "mock_group");
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

  /**
   * Import hàng loạt mock APIs
   */
  async importBatch(mocks) {
    return await this.post("/mock_api/import_batch", { mocks });
  }
}

export default TMServerMockAPI;
