class TDAppStartup {
  constructor() {}

  /**
   * Phương thức khởi tạo ứng dụng
   */
  async initialize() {
    // đảm bảo rằng __env là một đối tượng bất biến
    Object.freeze(window.__env);
  }
}

export default new TDAppStartup();
