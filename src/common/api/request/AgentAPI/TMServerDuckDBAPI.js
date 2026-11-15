import TMAgentAPI from "@/common/api/request/AgentAPI/TMAgentAPI.js";

/**
 * TMServerDuckDBAPI - API class cho DuckDB Query Tool
 * DuckDB chạy in-memory trong daemon, không cần connection string.
 */
class TMServerDuckDBAPI extends TMAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
  }

  /**
   * Thực thi câu lệnh SQL trên session DuckDB in-memory
   * @param {string} sessionId - ID của session DuckDB
   * @param {string} sql - câu lệnh SQL cần thực thi
   * @param {number} defaultLimit - giới hạn số dòng (0 = không giới hạn)
   * @param {boolean} unlimited - bỏ qua giới hạn
   */
  async executeQuery(sessionId, sql, defaultLimit = 1000, unlimited = false) {
    return await this.post("/duckdb/execute_query", {
      session_id: sessionId,
      sql: sql,
      default_limit: defaultLimit,
      unlimited: unlimited,
    });
  }

  /**
   * Upload file (Excel/CSV/Parquet/JSON) vào session DuckDB
   * @param {string} sessionId - ID của session DuckDB
   * @param {File} file - file cần upload
   * @param {string} [tableName] - tên table tùy chỉnh (mặc định = tên file)
   */
  async uploadFile(sessionId, file, tableName = "") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", sessionId);
    if (tableName) formData.append("table_name", tableName);
    return await this.post("/duckdb/upload_file", formData);
  }

  /**
   * Lấy danh sách file đã nạp trong session
   * @param {string} sessionId - ID của session DuckDB
   */
  async getSessionFiles(sessionId) {
    return await this.get(`/duckdb/session_files?session_id=${encodeURIComponent(sessionId)}`);
  }

  /**
   * Xoá 1 file/view khỏi session DuckDB
   * @param {string} sessionId - ID của session DuckDB
   * @param {string} fileId - ID của file cần xoá
   */
  async dropFile(sessionId, fileId) {
    return await this.post("/duckdb/drop_file", {
      session_id: sessionId,
      file_id: fileId,
    });
  }

  /**
   * Xoá toàn bộ session DuckDB (giải phóng memory)
   * @param {string} sessionId - ID của session DuckDB
   */
  async dropSession(sessionId) {
    return await this.post("/duckdb/drop_session", {
      session_id: sessionId,
    });
  }

  /**
   * Xoá tất cả file/view trong session DuckDB
   * @param {string} sessionId - ID của session DuckDB
   */
  async dropAllFiles(sessionId) {
    return await this.post("/duckdb/drop_all_files", {
      session_id: sessionId,
    });
  }
}

export default TMServerDuckDBAPI;
