import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

/**
 * TDServerTestingAPI - API class cho Agent controller chuyên về testing api
 */
class TDServerTestingAPI extends TDAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
    this.testingItem = new TDAgentAPI(baseUrl, "api_testing");
    this.testingGroup = new TDAgentAPI(baseUrl, "api_testing_group");
  }

  /**
   * Xử lý gọi nối api
   */
  async executeRequest(request, signal) {
    return await this.post("/api_test/exec", request, null, signal);
  }

  /**
   * Import batch (Groups + Items)
   */
  async importTestingDataBatch(batchData) {
    return await this.post("/api_test/import_batch", batchData);
  }
}

export default TDServerTestingAPI;
