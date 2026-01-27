import TDHttpClient from "@/common/api/request/TDHttpClient.js";

/**
 * TDBaseAPI - Base API class với hàm request chung
 */
class TDBaseAPI {
  constructor(baseUrl = "", controllerName = "") {
    this.baseUrl = baseUrl;
    this.controllerName = controllerName;
  }
  getBaseUrl() {
    return this.baseUrl;
  }
  /**
   * Build URL request từ baseUrl, controllerName và endpoint
   * @param {string} endpoint - API endpoint (có thể bắt đầu với / hoặc không)
   * @returns {string} - Full URL
   */
  getURLRequest(endpoint = "") {
    // Loại bỏ trailing slash từ baseUrl
    const cleanBaseUrl = this.getBaseUrl().replace(/\/$/, "");

    // Loại bỏ trailing slash từ controllerName
    const cleanControllerName = this.controllerName.replace(/\/$/, "");

    // Loại bỏ leading slash từ endpoint
    const cleanEndpoint = endpoint.replace(/^\//, "");

    // Build URL
    const parts = [cleanBaseUrl];

    if (cleanControllerName) {
      parts.push(cleanControllerName);
    }

    if (cleanEndpoint) {
      parts.push(cleanEndpoint);
    }

    return parts.join("/");
  }

  /**
   * Hàm request chung để gọi API
   * @param {string} url - API endpoint
   * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE, OPTIONS)
   * @param {Object} param - Request parameters hoặc body data
   * @param {Object} headers - Custom headers (optional)
   * @param {AbortSignal} signal - AbortController signal for cancellation (optional)
   * @returns {Promise<Object>} - Response data
   */
  async request(url, method = "GET", param = {}, headers = {}, signal = null) {
    try {
      let response;
      const upperMethod = method.toUpperCase();

      // Gọi method tương ứng từ TDHttpClient
      switch (upperMethod) {
        case "GET":
          response = await TDHttpClient.get(url, param, headers, signal);
          break;

        case "POST":
          response = await TDHttpClient.post(url, param, headers, signal);
          break;

        case "PUT":
          response = await TDHttpClient.put(url, param, headers, signal);
          break;

        case "PATCH":
          response = await TDHttpClient.patch(url, param, headers, signal);
          break;

        case "DELETE":
          response = await TDHttpClient.delete(url, headers, signal);
          break;

        case "OPTIONS":
          response = await TDHttpClient.options(url, headers, signal);
          break;

        default:
          throw new Error(`HTTP method không hợp lệ: ${method}`);
      }

      // Kiểm tra response status
      if (!response.ok) {
        // Thử parse error response
        let errorData;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json().catch(() => ({}));
        } else {
          errorData = await response.text().catch(() => "");
        }

        throw {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        };
      }

      // Parse response dựa trên Content-Type
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        // Response là JSON
        data = await response.json();
      } else {
        // Response là text hoặc các loại khác
        data = await response.text();
      }

      return {
        success: true,
        status: response.status,
        data: data,
        contentType: contentType,
      };
    } catch (error) {
      // Xử lý riêng cho AbortError
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return {
          success: false,
          status: 0,
          statusText: "Aborted",
          error: "Request was cancelled",
          aborted: true,
        };
      }

      console.error("API Request Error:", error);

      return {
        success: false,
        status: error.status || 500,
        statusText: error.statusText || "Internal Error",
        error: error.data || error.message || "Unknown error occurred",
      };
    }
  }

  /**
   * Convenience methods - có thể sử dụng trực tiếp
   */
  async get(endpoint, param = {}, headers = {}, signal = null) {
    const url = this.getURLRequest(endpoint);
    return await this.request(url, "GET", param, headers, signal);
  }

  async post(endpoint, param = {}, headers = {}, signal = null) {
    const url = this.getURLRequest(endpoint);
    return await this.request(url, "POST", param, headers, signal);
  }

  async put(endpoint, param = {}, headers = {}, signal = null) {
    const url = this.getURLRequest(endpoint);
    return await this.request(url, "PUT", param, headers, signal);
  }

  async patch(endpoint, param = {}, headers = {}, signal = null) {
    const url = this.getURLRequest(endpoint);
    return await this.request(url, "PATCH", param, headers, signal);
  }

  async delete(endpoint, headers = {}, signal = null) {
    const url = this.getURLRequest(endpoint);
    return await this.request(url, "DELETE", {}, headers, signal);
  }

  async options(endpoint, headers = {}, signal = null) {
    const url = this.getURLRequest(endpoint);
    return await this.request(url, "OPTIONS", {}, headers, signal);
  }
}

export default TDBaseAPI;
