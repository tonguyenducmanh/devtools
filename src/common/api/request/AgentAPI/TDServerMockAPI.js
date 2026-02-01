import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

/**
 * TDServerMockAPI - API class cho Agent controller chuyên về tạo mock api
 */
class TDServerMockAPI extends TDAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
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

export default TDServerMockAPI;
