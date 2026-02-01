import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

/**
 * TDServerTestingAPI - API class cho Agent controller chuyên về testing api
 */
class TDServerTestingAPI extends TDAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
  }

  /**
   * Xử lý gọi nối api
   */
  async executeRequest(request, signal) {
    return await this.post("/api_test/exec", request, null, signal);
  }

  /**
   * Lấy tất cả API testing
   */
  async getAllTestingAPIs() {
    return await this.get("/api_test/get_all_test");
  }

  /**
   * Tạo API testing mới
   */
  async createTestingAPI(testData) {
    return await this.post("/api_test/create_test", testData);
  }

  /**
   * Cập nhật API testing
   */
  async updateTestingAPI(testData) {
    return await this.put("/api_test/update_test", testData);
  }

  /**
   * Xóa API testing
   */
  async deleteTestingAPI(id) {
    return await this.delete(`/api_test/delete_test?id=${id}`);
  }

  /**
   * Lấy tất cả nhóm API testing
   */
  async getAllTestingGroups() {
    return await this.get("/api_test/get_all_group");
  }

  /**
   * Tạo nhóm API testing mới
   */
  async createTestingGroup(groupData) {
    return await this.post("/api_test/create_group", groupData);
  }

  /**
   * Cập nhật nhóm API testing
   */
  async updateTestingGroup(groupData) {
    return await this.put("/api_test/update_group", groupData);
  }

  /**
   * Xóa nhóm API testing
   */
  async deleteTestingGroup(id) {
    return await this.delete(`/api_test/delete_group?id=${id}`);
  }

  /**
   * Import batch (Groups + Items)
   */
  async importTestingDataBatch(batchData) {
    return await this.post("/api_test/import_batch", batchData);
  }
}

export default TDServerTestingAPI;
