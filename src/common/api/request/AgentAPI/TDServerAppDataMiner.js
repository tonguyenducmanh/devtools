import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

/**
 * TDServerAppDataMiner - API class cho Agent controller chuyên về đọc toàn bộ dữ liệu ở server
 */
class TDServerAppDataMiner extends TDAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
  }

  /**
   * Lấy tất cả table mà ứng dụng này đang lưu trữ
   */
  async getAllTable() {
    return await this.get("/data_miner/get_all_table_name");
  }

  /**
   * Lấy tất cả data trong 1 database
   */
  async getAllDataByTableName(tableName) {
    return await this.get(
      `/data_miner/get_data_by_table_name?table_name=${tableName}`,
    );
  }

  /**
   * query dữ liệu động từ data ứng dụng
   */
  async dataMinerExecuteQuery(param) {
    return await this.post(`/data_miner/execute_query`, param);
  }
}

export default TDServerAppDataMiner;
