import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

class TDTerminalAPI extends TDAgentAPI {
  constructor(baseUrl, controllerName = "api/terminal") {
    super(baseUrl, controllerName);
  }

  async getShells() {
    return await this.get("shells");
  }

  async getSessions() {
    return await this.get("sessions");
  }

  async createSession(param) {
    return await this.post("session", param);
  }

  async killSession(id) {
    return await this.delete(`session/${id}`);
  }
}

export default new TDTerminalAPI();
