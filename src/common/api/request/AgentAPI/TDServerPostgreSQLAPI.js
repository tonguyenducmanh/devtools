import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

/**
 * TDServerPostgreSQLAPI - API class cho PostgreSQL Query Tool
 */
class TDServerPostgreSQLAPI extends TDAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
    this.connectionGroup = new TDAgentAPI(
      baseUrl,
      "postgresql_connection_group",
    );
    this.connection = new TDAgentAPI(baseUrl, "postgresql_connection");
    this.savedQuery = new TDAgentAPI(baseUrl, "postgresql_saved_query");
  }

  /**
   * Thực thi câu lệnh SQL trên PostgreSQL
   * @param {string} connectionId - ID của connection đã lưu
   * @param {string} sql - câu lệnh SQL cần thực thi
   * @param {number} defaultLimit - giới hạn dòng mặc định
   * @param {boolean} unlimited - không giới hạn dòng
   */
  async executeQuery(connectionId, sql, defaultLimit = 1000, unlimited = false) {
    return await this.post("/postgresql/execute_query", {
      connection_id: connectionId,
      sql: sql,
      default_limit: defaultLimit,
      unlimited: unlimited,
    });
  }

}

export default TDServerPostgreSQLAPI;
