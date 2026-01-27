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
   * @returns {Promise<Object>} - Response data
   */
  async request(url, method = "GET", param = {}, headers = {}) {
    try {
      let response;
      const upperMethod = method.toUpperCase();

      // Gọi method tương ứng từ TDHttpClient
      switch (upperMethod) {
        case "GET":
          response = await TDHttpClient.get(url, param, headers);
          break;

        case "POST":
          response = await TDHttpClient.post(url, param, headers);
          break;

        case "PUT":
          response = await TDHttpClient.put(url, param, headers);
          break;

        case "PATCH":
          response = await TDHttpClient.patch(url, param, headers);
          break;

        case "DELETE":
          response = await TDHttpClient.delete(url, headers);
          break;

        case "OPTIONS":
          response = await TDHttpClient.options(url, headers);
          break;

        default:
          throw new Error(`HTTP method không hợp lệ: ${method}`);
      }

      // Kiểm tra response status
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        };
      }

      // Parse response JSON
      const data = await response.json();

      return {
        success: true,
        status: response.status,
        data: data,
      };
    } catch (error) {
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
  async get(endpoint, param = {}, headers = {}) {
    const url = this.getURLRequest(endpoint);
    return await this.request(url, "GET", param, headers);
  }

  async post(endpoint, param = {}, headers = {}) {
    const url = this.getURLRequest(endpoint);
    return await this.request(url, "POST", param, headers);
  }

  async put(endpoint, param = {}, headers = {}) {
    const url = this.getURLRequest(endpoint);
    return await this.request(url, "PUT", param, headers);
  }

  async patch(endpoint, param = {}, headers = {}) {
    const url = this.getURLRequest(endpoint);
    return await this.request(url, "PATCH", param, headers);
  }

  async delete(endpoint, headers = {}) {
    const url = this.getURLRequest(endpoint);
    return await this.request(url, "DELETE", {}, headers);
  }

  async options(endpoint, headers = {}) {
    const url = this.getURLRequest(endpoint);
    return await this.request(url, "OPTIONS", {}, headers);
  }
}

export default TDBaseAPI;
