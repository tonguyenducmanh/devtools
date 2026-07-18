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

  /**
   * Backup database bằng pg_dump, trả về file SQL text
   * @param {Object} sourceConn - { host, port, user, password, dbname }
   * @param {string} [pgBinPath]
   * @returns {Promise<Object>} - { success, status, data: string (SQL text), contentType }
   */
  async backupDatabase(sourceConn, pgBinPath) {
    return await this.post("/postgresql/database_ops", {
      operation: "backup",
      source_host: sourceConn.host,
      source_port: sourceConn.port,
      source_user: sourceConn.user,
      source_password: sourceConn.password,
      source_db: sourceConn.dbname,
      pg_bin_path: pgBinPath || "",
    });
  }

  /**
   * Restore database từ file dump (upload file binary)
   * @param {Object} conn - { host, port, user, password, dbname }
   * @param {File} dumpFile - file .sql từ pg_dump
   * @param {Object} [opts] - { pgBinPath }
   */
  async restoreDatabase(conn, dumpFile, opts = {}) {
    const formData = new FormData();
    formData.append("dump_file", dumpFile);
    formData.append("source_host", conn.host);
    formData.append("source_port", conn.port || "");
    formData.append("source_user", conn.user);
    formData.append("source_password", conn.password);
    formData.append("source_db", conn.dbname);
    formData.append("pg_bin_path", opts.pgBinPath || "");
    return await this.post("/postgresql/database_ops_upload", formData);
  }

  /**
   * Clone database từ nguồn sang đích (pg_dump | psql)
   */
  async cloneDatabase(sourceConn, targetConn, opts = {}) {
    return await this.post("/postgresql/database_ops", {
      operation: "clone",
      source_host: sourceConn.host,
      source_port: sourceConn.port,
      source_user: sourceConn.user,
      source_password: sourceConn.password,
      source_db: sourceConn.dbname,
      target_host: targetConn.host,
      target_port: targetConn.port,
      target_user: targetConn.user,
      target_password: targetConn.password,
      target_db: targetConn.dbname,
      pg_bin_path: opts.pgBinPath || "",
    });
  }

}

export default TDServerPostgreSQLAPI;
