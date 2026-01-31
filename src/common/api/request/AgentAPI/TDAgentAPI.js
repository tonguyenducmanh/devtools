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

  /**
   * Tạo mock API mới
   */
  async createMockAPI(mockData) {
    return await this.post("/mock_api/create_mock", mockData);
  }

  /**
   * Lấy tất cả mock APIs
   */
  async getAllMockAPIs() {
    return await this.get("/mock_api/get_all_mock");
  }

  /**
   * Cập nhật mock API
   */
  async updateMockAPI(mockData) {
    return await this.put("/mock_api/update_mock", mockData);
  }

  /**
   * Xóa mock API
   */
  async deleteMockAPI(id) {
    return await this.delete(`/mock_api/delete_mock?id=${id}`);
  }

  /**
   * Lấy tất cả nhóm mock API
   */
  async getAllMockGroups() {
    return await this.get("/mock_api/get_all_group");
  }

  /**
   * Tạo nhóm mock API mới
   */
  async createMockGroup(groupData) {
    return await this.post("/mock_api/create_group", groupData);
  }

  /**
   * Xoá nhóm mock API
   */
  async deleteMockGroup(id) {
    return await this.delete(`/mock_api/delete_group?id=${id}`);
  }
}

export default TDAgentAPI;
