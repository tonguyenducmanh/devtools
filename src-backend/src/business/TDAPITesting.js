import axios from "axios";
import https from "https";

/**
 * class gọi nối API hộ web app
 */
class TDAPITesting {
  constructor() {}
  /**
   * Đọc nội dung header
   */
  parseHeaders(text) {
    const headers = {};

    if (!text) return headers;

    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const index = trimmed.indexOf(":");
      if (index === -1) continue;

      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();

      if (key && value) {
        headers[key] = value;
      }
    }

    return headers;
  }
  /**
   * thực hiện run request
   */
  async executeRequest(body) {
    const { api_url, http_method, headers_text, body_text } = body;

    const headers = this.parseHeaders(headers_text);

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
}

export const tdAPITesting = new TDAPITesting();
