/**
 * TDHttpClient - HTTP Client for API requests
 * Sử dụng fetch API native
 */

class TDHttpClient {
  // Default headers cho tất cả requests
  static defaultHeaders = {
    "Content-Type": "application/json",
  };
  /**
   * GET request
   * @param {string} url - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} headers - Custom headers
   * @returns {Promise}
   */
  static async get(url, params = {}, headers = {}) {
    // Build query string from params
    const queryString =
      Object.keys(params).length > 0
        ? "?" + new URLSearchParams(params).toString()
        : "";

    const fullUrl = url + queryString;

    const options = {
      method: "GET",
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
    };

    return await fetch(fullUrl, options);
  }

  /**
   * POST request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} headers - Custom headers
   * @returns {Promise}
   */
  static async post(url, data = {}, headers = {}) {
    const options = {
      method: "POST",
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
      body: JSON.stringify(data),
    };

    return await fetch(url, options);
  }

  /**
   * PUT request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} headers - Custom headers
   * @returns {Promise}
   */
  static async put(url, data = {}, headers = {}) {
    const options = {
      method: "PUT",
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
      body: JSON.stringify(data),
    };

    return await fetch(url, options);
  }

  /**
   * PATCH request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} headers - Custom headers
   * @returns {Promise}
   */
  static async patch(url, data = {}, headers = {}) {
    const options = {
      method: "PATCH",
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
      body: JSON.stringify(data),
    };

    return await fetch(url, options);
  }

  /**
   * DELETE request
   * @param {string} url - API endpoint
   * @param {Object} headers - Custom headers
   * @returns {Promise}
   */
  static async delete(url, headers = {}) {
    const options = {
      method: "DELETE",
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
    };

    return await fetch(url, options);
  }

  /**
   * OPTIONS request
   * @param {string} url - API endpoint
   * @param {Object} headers - Custom headers
   * @returns {Promise}
   */
  static async options(url, headers = {}) {
    const options = {
      method: "OPTIONS",
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
    };

    return await fetch(url, options);
  }
}

export default TDHttpClient;
