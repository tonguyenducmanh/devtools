import * as insomniaCURL from "@/common/api/CURLHandle/insomnia/curl.ts";
import TDServerTestingAPI from "@/common/api/request/AgentAPI/TDServerTestingAPI.js";
import { jsonToPostgreSQL } from "@/common/utils/TDJSONToPostgreSQLUtil.js";

import * as curlReader from "@/common/api/CURLHandle/curlReader/index.ts";
/**
 * Các method injectable cho Automation (window.__tdAPI.apiTesting).
 * Các method này được inject vào eval scope để user script sử dụng.
 * Created by tdmanh 16/12/2025
 */
class TDAutomationInject {
  /**
   * Sử dụng agent để thực hiện chạy command curl gọi API,
   * không bị giới hạn bởi các tool của trình duyệt
   * (dạng text code để inject động)
   */
  fetchAgent(request) {
    let serverAgent = window.__tdAPI?.apiTesting?.agentURL;
    if (!serverAgent) {
      throw new Error("Agent server not configured");
    }

    let controller = new AbortController();
    // thực hiện gọi api vào agent
    let promise = new TDServerTestingAPI()
      .executeRequest(request, controller.signal)
      .then(async (res) => {
        let data = await res.data;

        try {
          return {
            status: data.status,
            headers: data.headers,
            body: data.body,
          };
        } catch {
          data = data;
          return {
            status: 200,
            headers: {},
            body: data,
          };
        }
      })
      .catch((error) => {
        throw error;
      });

    return {
      promise,
      cancel() {
        controller.abort();
        throw new Error("Request cancelled by user");
      },
    };
  }

  /**
   * Đọc nội dung CURL
   * @param {string} curlText
   */
  parseCURL(curlText) {
    let result = null;
    let dataParse = null;
    let buildSuccess = false;
    try {
      // build ra chuỗi header dạng text
      let buildHeaderText = function (dataParse, result, field = "key") {
        result.headers = {};
        if (Array.isArray(dataParse.headers) && dataParse.headers.length > 0) {
          let allHeaders = [];
          dataParse.headers.forEach((header) => {
            if (header && header[field] && header.value) {
              result.headers[header[field]] = header.value;
              allHeaders.push(`${header[field]}:${header.value}`);
            }
          });
          if (allHeaders && allHeaders.length > 0) {
            result.headersText = allHeaders.join("\n");
          }
        }
      };
      // build ra body theo data truyền vào
      let buildBody = function (result) {
        let parseSuccess = false;
        if (result.body == "null") {
          result.body = null;
        } else {
          try {
            if (result.body) {
              result.bodyText = result.body
                ? JSON.stringify(JSON.parse(result.body), null, 2)
                : null;
            }
            parseSuccess = true;
          } catch (ex) {
            console.log(ex);
          }
        }
        return parseSuccess;
      };
      let data = insomniaCURL.convert(curlText);
      dataParse = Array.isArray(data) ? data[0] : data;
      if (dataParse) {
        result = {
          url: dataParse.url,
          method: dataParse.method,
          body: dataParse.body.text,
        };
        buildHeaderText(dataParse, result, "name");
        buildSuccess = buildBody(result);
      }
      if (!buildSuccess) {
        console.log("Không parse được curl, thử cách khác");
        // nếu như sử dụng parse thư viện không được thì dùng parse truyền thống
        let dataParseCustom = curlReader.parse(curlText);
        if (dataParseCustom) {
          result = {
            url: dataParseCustom.url,
            method: dataParseCustom.method,
            body: dataParseCustom.body,
          };
          buildHeaderText(dataParseCustom, result, "key");
          buildSuccess = buildBody(result);
        }
      }
    } catch (errorTotal) {
      // đảm bảo phải log lại tránh lỗi effect bên ngoài
      console.log(errorTotal);
    }
    return result;
  }

  /**
   * Hàm chính thực hiện việc gọi API thông qua CURL
   */
  async requestCURL(curlText) {
    try {
      let parsed = this.parseCURL(curlText);
      let requestData = {
        api_url: parsed.url,
        http_method: parsed.method || "GET",
        headers_text: parsed.headersText || "",
        body_text: parsed.bodyText || null,
      };
      let req = this.fetchAgent(requestData);
      let resp = await req.promise;
      return resp;
    } catch (ex) {
      let msgErr = "requestCURL call api error";
      console.log(msgErr + ex);
      return {
        status: 599,
        body: {
          message: msgErr,
          ex: ex.toString(),
          stackTrace: ex.stack ? ex.stack.split("\n") : [],
        },
      };
    }
  }
  /**
   * Hàm thực hiện nhiều request CURL đồng thời thông qua backend goroutines.
   * @param {string[]} curlTexts - Mảng các curl command text
   * @returns {Promise<Array>} Mảng response theo thứ tự input
   */
  async requestMultiCURL(curlTexts) {
    try {
      if (!Array.isArray(curlTexts) || curlTexts.length === 0) {
        throw new Error(
          "requestMultiCURL requires a non-empty array of curl texts",
        );
      }

      let requests = curlTexts.map((curlText) => {
        let parsed = this.parseCURL(curlText);
        return {
          api_url: parsed.url,
          http_method: parsed.method || "GET",
          headers_text: parsed.headersText || "",
          body_text: parsed.bodyText || null,
        };
      });

      let res = await new TDServerTestingAPI().executeParallel(requests);
      let data = res.data;

      return (data.results || []).map((r) => ({
        status: r.status,
        headers: r.headers,
        body: r.body,
        totalTimeMs: data.total_time_ms,
      }));
    } catch (ex) {
      let msgErr = "requestMultiCURL call api error";
      console.log(msgErr + ex);
      return curlTexts.map(() => ({
        status: 599,
        body: {
          message: msgErr,
          ex: ex.toString(),
        },
      }));
    }
  }

  /**
   * Gọi HTTP request trực tiếp với tham số rõ ràng (không cần CURL string).
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method (GET, POST, PUT, PATCH, DELETE)
   * @param {string} options.url - URL endpoint
   * @param {string|object} options.headers - Headers (text format "key:value" per line, hoặc object)
   * @param {string|object|null} options.body - Request body (JSON string hoặc object)
   * @returns {Promise<{status, headers, body}>}
   */
  async request({ method, url, headers, body }) {
    try {
      let headersText = "";
      if (typeof headers === "object" && headers !== null) {
        headersText = Object.entries(headers)
          .map(([k, v]) => `${k}:${v}`)
          .join("\n");
      } else if (typeof headers === "string") {
        headersText = headers;
      }

      let bodyText = null;
      if (body !== null && body !== undefined) {
        bodyText =
          typeof body === "object" ? JSON.stringify(body) : String(body);
      }

      let requestData = {
        api_url: url,
        http_method: (method || "GET").toUpperCase(),
        headers_text: headersText,
        body_text: bodyText,
      };
      let req = this.fetchAgent(requestData);
      let resp = await req.promise;
      return resp;
    } catch (ex) {
      let msgErr = "request call api error";
      console.log(msgErr + ex);
      return {
        status: 599,
        body: {
          message: msgErr,
          ex: ex.toString(),
          stackTrace: ex.stack ? ex.stack.split("\n") : [],
        },
      };
    }
  }

  /**
   * Parse response từ request(), trả về body đã parse JSON.
   * @param {Object} response - Response từ request() hoặc requestCURL()
   * @returns {any} Body đã parse JSON (hoặc string gốc nếu không parse được)
   */
  parseResponse(response) {
    if (!response) return null;
    let body = response.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        // keep as string
      }
    }
    return body;
  }

  /**
   * Parse nhiều response cùng lúc.
   * @param {Array} responses - Mảng response từ requestMultiCURL() hoặc requestMulti()
   * @returns {Array} Mảng body đã parse JSON
   */
  parseResponseMulti(responses) {
    if (!Array.isArray(responses)) return [];
    return responses.map((r) => this.parseResponse(r));
  }

  /**
   * Gửi nhiều request song song với tham số rõ ràng (không cần CURL string).
   * @param {Array<{method, url, headers, body}>} requests - Mảng request objects
   * @returns {Promise<Array<{status, headers, body}>>}
   */
  async requestMulti(requests) {
    try {
      if (!Array.isArray(requests) || requests.length === 0) {
        throw new Error(
          "requestMulti requires a non-empty array of request objects",
        );
      }

      let apiRequests = requests.map((req) => {
        let headersText = "";
        if (typeof req.headers === "object" && req.headers !== null) {
          headersText = Object.entries(req.headers)
            .map(([k, v]) => `${k}:${v}`)
            .join("\n");
        } else if (typeof req.headers === "string") {
          headersText = req.headers;
        }

        let bodyText = null;
        if (req.body !== null && req.body !== undefined) {
          bodyText =
            typeof req.body === "object"
              ? JSON.stringify(req.body)
              : String(req.body);
        }

        return {
          api_url: req.url,
          http_method: (req.method || "GET").toUpperCase(),
          headers_text: headersText,
          body_text: bodyText,
        };
      });

      let res = await new TDServerTestingAPI().executeParallel(apiRequests);
      let data = res.data;

      return (data.results || []).map((r) => ({
        status: r.status,
        headers: r.headers,
        body: r.body,
        totalTimeMs: data.total_time_ms,
      }));
    } catch (ex) {
      let msgErr = "requestMulti call api error";
      console.log(msgErr + ex);
      return requests.map(() => ({
        status: 599,
        body: {
          message: msgErr,
          ex: ex.toString(),
        },
      }));
    }
  }

  /**
   * Đọc nội dung 1 file từ máy local qua backend agent
   * @param {string} filePath - đường dẫn tuyệt đối đến file
   * @returns {Promise<string>} nội dung file
   */
  async readFile(filePath) {
    try {
      let response = await new TDServerTestingAPI().readFile(filePath);
      let data = response.data;
      if (data && data.success) {
        return data.data;
      } else {
        console.error("readFile error:", data?.message);
        return null;
      }
    } catch (ex) {
      console.error("readFile error:", ex.message);
      return null;
    }
  }

  /**
   * Đọc hàng loạt file trong 1 folder qua backend agent
   * @param {string} folderPath - đường dẫn tuyệt đối đến folder
   * @returns {Promise<Array<{name: string, content: string}>>} danh sách file
   */
  async readFolder(folderPath) {
    try {
      let response = await new TDServerTestingAPI().readFolder(folderPath);
      let data = response.data;
      if (data && data.success) {
        return data.data || [];
      } else {
        console.error("readFolder error:", data?.message);
        return [];
      }
    } catch (ex) {
      console.error("readFolder error:", ex.message);
      return [];
    }
  }

  /**
   * Chuyển đổi JSON sang PostgreSQL script
   * @param {Array|Object} jsonData - dữ liệu JSON cần convert
   * @param {Object} config - { tableName, schemaName, primaryKeyField, enableCreateTable, enableDeleteScript }
   * @returns {string} PostgreSQL script
   */
  convertJSONToPostgreSQL(jsonData, config) {
    return jsonToPostgreSQL(jsonData, config);
  }

  /**
   * Build ra CURL dạng text
   */
  stringifyCURL(request) {
    if (!request?.apiUrl) {
      console.error("stringifyCURL: apiUrl is required");
      return "";
    }

    let lines = [];
    let escapeShell = function (value) {
      return String(value).replace(/'/g, `'\\''`);
    };
    // base curl
    lines.push(`curl '${request.apiUrl}'`);

    // method
    let method = (request.httpMethod || "GET").toUpperCase();
    if (method !== "GET") {
      lines.push(`--request ${method}`);
    }

    // headers
    if (request.headersText) {
      request.headersText
        .split("\n")
        .map((h) => h.trim())
        .filter(Boolean)
        .forEach((header) => {
          lines.push(`--header '${escapeShell(header)}'`);
        });
    }

    // body
    if (request.bodyText && request.bodyText.trim() !== "") {
      lines.push(`--data '${escapeShell(request.bodyText)}'`);
    }
    let curlContent = lines.join(" \\\n");
    return curlContent;
  }

  /**
   * Build mock objects từ request/response data để export JSON (dùng import thủ công vào Mock API tool).
   * Không gọi API backend, chỉ xử lý local.
   *
   * @param {Object|Array<Object>} input - 1 item hoặc mảng items, mỗi item có dạng:
   *   { request: string|Object, response: { status, headers, body } }
   *   - request (string): CURL command text, ví dụ "curl 'https://...'"
   *   - request (Object): { method, url, headers, body } hoặc { apiUrl, httpMethod, headersText, bodyText }
   *   - response (Object): { status, headers, body } - kết quả từ request() hoặc requestCURL()
   *
   *   Hoặc backward-compat dạng flat: { status, headers, body, request? }
   *
   * @param {Object} options - tùy chọn (optional)
   * @param {string} options.request_name - tên mock (dùng khi input là 1 item)
   * @param {string} options.group_id - group_id cho mock
   * @param {string} options.defaultStatusText - response text mặc định khi không có body
   * @returns {Array<Object>} mảng mock objects sẵn sàng để copy JSON import vào Mock API tool
   */
  createMockResponse(input, options = {}) {
    // Normalize to array
    let items = Array.isArray(input) ? input : input ? [input] : [];

    if (items.length === 0) {
      console.error(
        "createMockResponse: input must be a non-empty item or array",
      );
      return [];
    }

    return items.map((item, index) => {
      let mock = {
        request_name: options.request_name || "",
        group_id: options.group_id || "",
        method: "GET",
        api_url: "",
        headers_text: "",
        body_text: "",
        response_text: "",
        response_headers_text: "",
        status_code: 200,
      };

      // ─── Resolve request & response from input format ───
      let reqInput = null;
      let resInput = null;

      if (item.request !== undefined || item.response !== undefined) {
        // New format: { request, response }
        reqInput = item.request || null;
        resInput = item.response || {};
      } else {
        // Backward-compat flat format: { status, headers, body, request? }
        reqInput = item.request || null;
        resInput = {
          status: item.status,
          headers: item.headers,
          body: item.body,
        };
      }

      // ─── Parse request ───
      if (reqInput) {
        if (typeof reqInput === "string") {
          // CURL string format
          let parsed = this.parseCURL(reqInput);
          if (parsed) {
            mock.method = (parsed.method || "GET").toUpperCase();
            mock.api_url = parsed.url || "";
            mock.headers_text = parsed.headersText || "";
            mock.body_text = parsed.bodyText || "";
          }
        } else if (typeof reqInput === "object") {
          // Object format - support both { method, url, headers, body } and { apiUrl, httpMethod, headersText, bodyText }
          mock.method = (
            reqInput.method ||
            reqInput.httpMethod ||
            "GET"
          ).toUpperCase();
          mock.api_url = reqInput.url || reqInput.apiUrl || "";
          // Headers
          if (reqInput.headers) {
            if (typeof reqInput.headers === "string") {
              mock.headers_text = reqInput.headers;
            } else if (typeof reqInput.headers === "object") {
              mock.headers_text = Object.entries(reqInput.headers)
                .map(([k, v]) => `${k}:${v}`)
                .join("\n");
            }
          } else if (reqInput.headersText) {
            mock.headers_text = reqInput.headersText;
          }
          // Body
          if (reqInput.body !== undefined && reqInput.body !== null) {
            mock.body_text =
              typeof reqInput.body === "string"
                ? reqInput.body
                : JSON.stringify(reqInput.body);
          } else if (reqInput.bodyText) {
            mock.body_text = reqInput.bodyText;
          }
        }
      }

      // ─── Parse response ───
      if (resInput.status !== undefined) {
        mock.status_code = resInput.status;
      }

      // Response body
      if (resInput.body !== undefined && resInput.body !== null) {
        if (typeof resInput.body === "string") {
          try {
            mock.response_text = JSON.stringify(
              JSON.parse(resInput.body),
              null,
              2,
            );
          } catch {
            mock.response_text = resInput.body;
          }
        } else {
          mock.response_text = JSON.stringify(resInput.body, null, 2);
        }
      } else {
        mock.response_text = options.defaultStatusText || "{}";
      }

      // Response headers
      if (resInput.headers) {
        if (typeof resInput.headers === "string") {
          mock.response_headers_text = resInput.headers;
        } else if (typeof resInput.headers === "object") {
          mock.response_headers_text = JSON.stringify(
            resInput.headers,
            null,
            2,
          );
        }
      }

      // ─── Fallback request_name → api_url ───
      if (!mock.request_name && mock.api_url) {
        mock.request_name = mock.api_url;
      }

      return mock;
    });
  }
}

export default TDAutomationInject;
