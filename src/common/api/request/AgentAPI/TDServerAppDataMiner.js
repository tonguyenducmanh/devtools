import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

/**
 * TDServerAppDataMiner - API class cho Agent controller chuyên về đọc toàn bộ dữ liệu ở server
 */
class TDServerAppDataMiner extends TDAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
  }

  /**
   * Lấy danh sách toàn bộ bảng kèm columns (dùng cho intellisense)
   */
  async getAllTableAndColumns() {
    return await this.get("/data_miner/get_all_table_and_columns");
  }

  /**
   * query dữ liệu động từ data ứng dụng
   */
  async dataMinerExecuteQuery(param) {
    return await this.post(`/data_miner/execute_query`, param);
  }
}

export default TDServerAppDataMiner;
