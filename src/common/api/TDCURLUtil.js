/**
 * các method CURL dùng cho toàn bộ frontend
 * Created by tdmanh 16/12/2025
 */
class TDCURLUtil {
  /**
   * Đọc nội dung CURL
   * @param {string} curlText
   */
  parse(curlText) {
    let me = this;
    let result = {
      url: "",
      method: "GET",
      headers: {},
      body: null,
      headersText: "",
    };
    let allHeaders = [];
    // normalize
    let tokens = curlText
      .replace(/\\\n/g, " ")
      .replace(/\n/g, " ")
      .match(/'[^']*'|"[^"]*"|\S+/g);

    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];

      // URL
      if (token.startsWith("http") || token.startsWith("'http")) {
        result.url = me.strip(token);
      }

      // Method
      if (token === "-X" || token === "--request") {
        result.method = me.strip(tokens[++i]).toUpperCase();
      }

      // Headers
      if (token === "-H" || token === "--header") {
        let header = me.strip(tokens[++i]);
        let [key, ...rest] = header.split(":");
        result.headers[key.trim()] = rest.join(":").trim();
        allHeaders.push(header);
      }

      // Body
      if (
        token === "--data" ||
        token === "--data-raw" ||
        token === "--data-binary" ||
        token === "-d"
      ) {
        result.body = me.strip(tokens[++i]);
        if (result.method === "GET") {
          result.method = "POST";
        }
      }
    }

    if (allHeaders && allHeaders.length > 0) {
      result.headersText = allHeaders.join("\n");
    }
    return result;
  }

  strip(str) {
    return str.replace(/^['"]|['"]$/g, "");
  }
  escapeShell(value) {
    return String(value).replace(/'/g, `'\\''`);
  }
  /**
   * Build ra CURL dạng text
   */
  stringify(request) {
    let me = this;
    if (!request?.apiUrl) throw new Error("apiUrl is required");

    let lines = [];

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
          lines.push(`--header '${me.escapeShell(header)}'`);
        });
    }

    // body
    if (request.bodyText && request.bodyText.trim() !== "") {
      lines.push(`--data '${me.escapeShell(request.bodyText)}'`);
    }
    let curlContent = lines.join(" \\\n");
    return curlContent;
  }
}

export default new TDCURLUtil();
