import * as insomniaCURL from "./insomnia/curl.ts";
import TDUtility from "@/common/TDUtility.js";
import * as curlReader from "./curlReader/index.ts";
/**
 * các method CURL dùng cho toàn bộ frontend
 * Created by tdmanh 16/12/2025
 */
class TDCURLUtil {
  /**
   * Sử dụng agent để thực hiện chạy command curl gọi API,
   * không bị giới hạn bởi các tool của trình duyệt
   * (dạng text code để inject động)
   */
  fetchAgent(request) {
    const fetchAgentDesktop = function (request) {
      const signalId = TDUtility.newGuid();
      let cancelled = false;

      // Sử dụng Tauri invoke
      const { invoke } = window.__TAURI_INTERNALS__;

      const promise = invoke("exec", {
        request: {
          api_url: request.api_url,
          http_method: request.http_method || "GET",
          headers_text: request.headers_text || "",
          body_text: request.body_text || null,
        },
        signalId,
      });

      return {
        promise,
        async cancel() {
          if (cancelled) return;
          cancelled = true;

          try {
            await invoke("cancel", { signalId });
          } catch (error) {
            console.error("Cancel failed:", error);
          }

          throw new Error("Request cancelled by user");
        },
      };
    };
    const fetchAgentBrowser = function (request) {
      let serverAgent = window.__tdInfo?.agentURL;
      if (!serverAgent) {
        throw new Error("Agent server not configured");
      }

      const controller = new AbortController();

      const promise = fetch(`${serverAgent}/exec`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      })
        .then(async (res) => {
          const text = await res.text();
          let data;

          try {
            data = JSON.parse(text);
            return {
              status: data.status,
              headers: data.headers,
              body: data.body,
            };
          } catch {
            data = text;
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
    };
    if (window && window.__TAURI_INTERNALS__) {
      return fetchAgentDesktop(request);
    }
    return fetchAgentBrowser(request);
  }

  /**
   * Đọc nội dung CURL
   * @param {string} curlText
   */
  parseCURL(curlText) {
    let me = this;
    let result = null;
    let data = insomniaCURL.convert(curlText);
    let dataParse = null;
    if (data) {
      if (Array.isArray(data) && data.length > 0) {
        dataParse = data[0];
      } else {
        dataParse = data;
      }
    }
    if (dataParse) {
      result = {
        url: dataParse.url,
        method: dataParse.method,
        headers: {},
        body: "",
        headersText: "",
      };
      this.buildHeaderText(dataParse, result, "name");
      if (dataParse?.body?.text) {
        result.body = dataParse.body.text;
      }

      if (result.body == "null") {
        result.body = null;
      } else {
        try {
          result.bodyText = result.body
            ? JSON.stringify(JSON.parse(result.body), null, 2)
            : null;
        } catch (ex) {
          console.log("Không parse được curl, thử cách khác");
          console.log(ex);
          // nếu như sử dụng parse thư viện không được thì dùng parse truyền thống
          let dataParseCustom = curlReader.parse(curlText);
          if (dataParseCustom) {
            result = {
              url: dataParseCustom.url,
              method: dataParseCustom.method,
              headers: dataParseCustom.headers,
              body: dataParseCustom.body,
            };
            if (result.body) {
              result.bodyText = result.body
                ? JSON.stringify(JSON.parse(result.body), null, 2)
                : null;
            }
            this.buildHeaderText(dataParseCustom, result, "key");
          }
        }
      }
    }
    return result;
  }

  buildHeaderText(dataParse, result, field = "key") {
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
  }

  /**
   * Build ra CURL dạng text
   */
  stringifyCURL(request) {
    let me = this;
    if (!request?.apiUrl) throw new Error("apiUrl is required");

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
   * Hàm chính thực hiện việc gọi API thông qua CURL
   */
  async requestCURL(curlText) {
    try {
      let parsed = window.__tdInfo.parseCURL(curlText);
      let requestData = {
        api_url: parsed.url,
        http_method: parsed.method || "GET",
        headers_text: parsed.headersText || "",
        body_text: parsed.bodyText || null,
      };
      let req = window.__tdInfo.fetchAgent(requestData);
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
  setGlobalInfoBeforeRequest(options) {
    let me = this;
    window.__tdInfo = {
      agentURL: options.agentURL ?? window.__env?.APITesting?.agentServer,
      requestCURL: me.requestCURL,
      parseCURL: me.parseCURL,
      fetchAgent: me.fetchAgent,
    };
  }
  /**
   * Đoạn code build ra script javascript động để chạy request bằng CURL
   * theo kịch bản người dùng tự viết
   */
  buildInjectCode(secranioCode) {
    let me = this;
    return `
const requestCURL = window.__tdInfo.requestCURL;
let result = 
(async () => {
  ${secranioCode}
})();
return result;`;
  }
}

export default new TDCURLUtil();
