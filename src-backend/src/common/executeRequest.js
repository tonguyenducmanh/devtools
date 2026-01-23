import axios from "axios";
import https from "https";
import { parseHeaders } from "./parseHeaders.js";

export async function executeRequest(body) {
  const { api_url, http_method, headers_text, body_text } = body;

  const headers = parseHeaders(headers_text);

  try {
    const response = await axios({
      url: api_url,
      method: http_method.toLowerCase(),
      headers,
      data: body_text ?? undefined,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
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
