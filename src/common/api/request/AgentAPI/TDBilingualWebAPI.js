import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

class TDBilingualWebAPI extends TDAgentAPI {
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

export default TDBilingualWebAPI;
