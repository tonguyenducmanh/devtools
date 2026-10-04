import TMAgentAPI from "@/common/api/request/AgentAPI/TMAgentAPI.js";

/**
 * TMServerRDPAPI - API class cho Agent controller chuyên về RDP connection
 */
class TMServerRDPAPI extends TMAgentAPI {
  constructor(baseUrl, controllerName = "") {
    super(baseUrl, controllerName);
    // Cặp master-detail: nhóm chứa connection
    this.rdpConnectionGroup = new TMAgentAPI(
      baseUrl,
      "rdp_connection_group",
    );
    this.rdpConnection = new TMAgentAPI(baseUrl, "rdp_connection");
  }
}

export default TMServerRDPAPI;
