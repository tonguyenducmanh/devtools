import TMAgentAPI from "@/common/api/request/AgentAPI/TMAgentAPI.js";

/**
 * TMServerTestingAPI - API class cho Agent controller chuyên về testing api
 */
class TMServerTestingAPI extends TMAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
    this.testingItem = new TMAgentAPI(baseUrl, "api_testing");
    this.testingGroup = new TMAgentAPI(baseUrl, "api_testing_group");
    this.proModeItem = new TMAgentAPI(baseUrl, "api_testing_pro_mode");
    this.proModeGroup = new TMAgentAPI(baseUrl, "api_testing_pro_mode_group");
  }

  /**
   * Xử lý gọi nối api
   */
  async executeRequest(request, signal) {
    return await this.post("/api_test/exec", request, null, signal);
  }

  /**
   * Xử lý gọi nối api đồng thời (goroutines backend)
   */
  async executeParallel(requests, signal) {
    return await this.post("/api_test/exec_parallel", { requests }, null, signal);
  }

  /**
   * Import batch (Groups + Items)
   */
  async importTestingDataBatch(batchData) {
    return await this.post("/api_test/import_batch", batchData);
  }

  /**
   * Import batch ProMode (Groups + Items)
   */
  async importProModeBatch(batchData) {
    return await this.post("/api_test/import_pro_mode_batch", batchData);
  }

  /**
   * Đọc nội dung 1 file từ máy local
   */
  async readFile(filePath) {
    return await this.post("/file_ops/read_file", { file_path: filePath });
  }

  /**
   * Đọc hàng loạt file trong 1 folder
   */
  async readFolder(folderPath) {
    return await this.post("/file_ops/read_folder", { folder_path: folderPath });
  }

  /**
   * Ghi nội dung vào 1 file trên máy local
   */
  async writeFile(filePath, content) {
    return await this.post("/file_ops/write_file", {
      file_path: filePath,
      content: content,
    });
  }
}

export default TMServerTestingAPI;
