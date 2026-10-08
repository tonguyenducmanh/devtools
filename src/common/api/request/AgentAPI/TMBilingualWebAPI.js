import TMAgentAPI from "@/common/api/request/AgentAPI/TMAgentAPI.js";

class TMBilingualWebAPI extends TMAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
  }

  async fetchBilingualWeb(url) {
    return await this.post("/bilingual_web/fetch", { url: url });
  }

  async translateTextBatch(texts, targetLang = "vi") {
    return await this.post("/bilingual_web/translate", { texts, targetLang });
  }
}

export default TMBilingualWebAPI;
