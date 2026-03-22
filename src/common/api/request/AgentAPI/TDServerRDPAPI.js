import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

/**
 * TDServerRDPAPI - API class cho Agent controller chuyên về RDP connection
 */
class TDServerRDPAPI extends TDAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
  }

  /**
   * Tạo RDP connection mới
   */
  async createRDPConnection(connData) {
    return await this.post("/rdp_connection/create", connData);
  }

  /**
   * Lấy tất cả RDP connections
   */
  async getAllRDPConnections() {
    return await this.get("/rdp_connection/get_all");
  }

  /**
   * Cập nhật RDP connection
   */
  async updateRDPConnection(connData) {
    return await this.put("/rdp_connection/update", connData);
  }

  /**
   * Xóa RDP connection
   */
  async deleteRDPConnection(id) {
    return await this.delete(`/rdp_connection/delete?id=${id}`);
  }
}

export default TDServerRDPAPI;
