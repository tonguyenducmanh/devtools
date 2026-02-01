import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

/**
 * TDServerAppDataMiner - API class cho Agent controller chuyên về đọc toàn bộ dữ liệu ở server
 */
class TDServerAppDataMiner extends TDAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
  }

  /**
   * Lấy tất cả mock APIs
   */
  async getAllTable() {
    return await this.get("/data_miner/get_all_data");
  }
}

export default TDServerAppDataMiner;
