// services/executeRequest.js
const axios = require("axios");
const https = require("https");
const parseHeaders = require("./parseHeaders.js");

async function executeRequest(body) {
  const { api_url, http_method, headers_text, body_text } = body;

  const headers = parseHeaders(headers_text);

  try {
    const response = await axios({
      url: api_url,
      method: http_method.toLowerCase(),
      headers,
      data: body_text ?? undefined,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // giống danger_accept_invalid_certs(true)
      }),
      validateStatus: () => true, // không throw khi status != 2xx
    });

    return {
      status: response.status,
      headers: JSON.stringify(response.headers),
      body:
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data),
    };
  } catch (err) {
    throw new Error(`Request failed: ${err.message}`);
  }
}

module.exports = executeRequest;
