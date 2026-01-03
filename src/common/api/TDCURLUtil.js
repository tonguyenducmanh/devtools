/**
 * các method CURL dùng cho toàn bộ frontend
 * Created by tdmanh 16/12/2025
 */
class TDCURLUtil {
  /**
   * Đọc nội dung CURL (dạng text code để inject động)
   */
  parseFuncContent() {
    return `
const strip = function(str) {
  return str.replace(/^['"]|['"]$/g, "");
};
const parseCurl =  function (curlText) {
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
    .replace(/\\\\\\n/g, " ")
    .replace(/\\n/g, " ")
    .match(/'[^']*'|"[^"]*"|\\S+/g);

  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];

    // URL
    if (token.startsWith("http") || token.startsWith("'http")) {
      result.url = strip(token);
    }

    // Method
    if (token === "-X" || token === "--request") {
      result.method = strip(tokens[++i]).toUpperCase();
    }

    // Headers
    if (token === "-H" || token === "--header") {
      let header = strip(tokens[++i]);
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
      result.body = strip(tokens[++i]);
      if (result.method === "GET") {
        result.method = "POST";
      }
    }
  }

  if (allHeaders && allHeaders.length > 0) {
    result.headersText = allHeaders.join("\\n");
  }
  return result;
};`;
  }

  /**
   * Sử dụng agent để thực hiện chạy command curl gọi API,
   * không bị giới hạn bởi các tool của trình duyệt
   * (dạng text code để inject động)
   */
  fetchAgentFuncContent() {
    return `
const uuidv4 = function() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const fetchAgentDesktop = function(request) {
  const signalId = uuidv4();
  let cancelled = false;

  // Sử dụng Tauri invoke
  const { invoke } = window.__TAURI_INTERNALS__;
  
  const promise = invoke('exec', { 
    request: {
      api_url: request.api_url,
      http_method: request.http_method || 'GET',
      headers_text: request.headers_text || null,
      body_text: request.body_text || null,
    },
    signalId 
  });

  return {
    promise,
    async cancel() {
      if (cancelled) return;
      cancelled = true;
      
      try {
        await invoke('cancel', { signalId });
      } catch (error) {
        console.error('Cancel failed:', error);
      }
      
      throw new Error("Request cancelled by user");
    },
  };
}

const fetchAgentBrowser = function(request) {
  let serverAgent = window.__tdInfo?.agentURL;
  if (!serverAgent) {
    throw new Error("Agent server not configured");
  }

  const controller = new AbortController();

  const promise = fetch(\`\${serverAgent}/exec\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal: controller.signal,
  }).then(async (res) => {
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
}

const fetchAgent = function(request) {
  if (window && window.__TAURI_INTERNALS__) {
    return fetchAgentDesktop(request);
  }
  return fetchAgentBrowser(request);
}`;
  }

  /**
   * Đọc nội dung CURL
   * @param {string} curlText
   */
  parse(curlText) {
    let me = this;
    let result = null;
    // inject động function có tham số
    let contentFn = `${me.parseFuncContent()}; return parseCurl(curlText);`;
    let parseFn = new Function("curlText", contentFn);
    result = parseFn(curlText);
    return result;
  }

  fetchAgent(request) {
    let me = this;
    let result = null;
    let contentFn = `${me.fetchAgentFuncContent()}; return fetchAgent(request)`;
    let fetchFn = new Function("request", contentFn);
    result = fetchFn(request);
    return result;
  }

  /**
   * Build ra CURL dạng text
   */
  stringify(request) {
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
   * Đoạn code inject demo việc dùng nhiều CURL theo kịch bản custom gọi API
   */
  sampleCURLScript() {
    return `
let curlOne = \`
    curl 'http://localhost:3000/api/get_list_item?limit=5' \
    --header 'Content-Type: application/json'
\`;

let responseOne = await requestCURL(curlOne);
return responseOne;`;
  }
  /**
   * Đoạn code build ra script javascript động để chạy request bằng CURL
   * theo kịch bản người dùng tự viết
   */
  buildInjectCode(secranioCode) {
    let me = this;
    return `
const requestCURL = async (curlText) => {
  ${me.parseFuncContent()}
  ${me.fetchAgentFuncContent()}
  const parsed = parseCurl(curlText);

  const requestData = {
    api_url: parsed.url,
    http_method: parsed.method || "GET",
    headers_text: parsed.headersText || null,
    body_text: parsed.body || null,
  };

  const req = fetchAgent(requestData);
  const resp = await req.promise;

  return resp;
};
let result = 
(async () => {
  ${secranioCode}
})();
return result;`;
  }
}

export default new TDCURLUtil();
