import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

/**
 * TDServerRDPAPI - API class cho Agent controller chuyên về RDP connection
 */
class TDServerRDPAPI extends TDAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
    // Cặp master-detail: nhóm chứa connection
    this.rdpConnectionGroup = new TDAgentAPI(
      baseUrl,
      "rdp_connection_group",
    );
    this.rdpConnection = new TDAgentAPI(baseUrl, "rdp_connection");
  }
}

export default TDServerRDPAPI;
