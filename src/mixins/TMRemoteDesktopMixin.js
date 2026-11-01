/**
 * Mixin dùng chung cho các tool Remote Desktop (RDP, UltraViewer).
 * Chứa các method logic giống hệt nhau, không phụ thuộc vào WASM session
 * hay template của từng component.
 * Mỗi component vẫn tự quản lý: data, kết nối WASM, sidebar, toolbar.
 */
export const TMRemoteDesktopMixin = {
  methods: {
    /**
     * Ghi log vào panel log của component.
     * Yêu cầu component instance có: this.logEntries (array),
     * this.$refs.logPanel, this.$t, this.$nextTick.
     */
    addLog(message, type = 'info') {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      this.logEntries.push({ time, message, type });
      if (this.logEntries.length > 200) {
        this.logEntries.splice(0, this.logEntries.length - 200);
      }
      this.$nextTick(() => {
        const panel = this.$refs.logPanel;
        if (panel) panel.scrollTop = panel.scrollHeight;
      });
    },

    /**
     * Chuẩn hóa lỗi hiển thị (phiên bản đơn giản, dùng chung).
     * Component RDP có thể override để xử lý lỗi WASM chi tiết (__wbg_ptr).
     * Do mixin gọi qua this.formatError(), component override sẽ được áp dụng.
     */
    formatError(e) {
      return e?.message || e?.toString() || String(e);
    },

    /**
     * Chụp ảnh màn hình canvas hiện tại và tải về dưới dạng PNG.
     * @param {string} canvasRef tên ref của canvas (vd 'rdpCanvas' hoặc 'uvCanvas')
     * @param {string} savedKey i18n key dùng cho log thành công
     * @param {string} failedKey i18n key dùng cho log thất bại
     */
    async takeScreenshot(canvasRef, savedKey, failedKey) {
      const canvas = this.$refs[canvasRef];
      if (!canvas || !this.isConnected) return;
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `screenshot-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        this.addLog(this.$t(savedKey), 'success');
      } catch (e) {
        this.addLog(
          `${this.$t(failedKey)}: ${this.formatError(e)}`,
          'error',
        );
      }
    },

    /**
     * Sao chép khung hình hiện tại trên canvas vào clipboard.
     * Dùng flow chung của chương trình ($tmUtility.copyImageFromBlob),
     * không tự viết lại mã gọi API clipboard trong component.
     * @param {string} canvasRef tên ref của canvas
     * @param {string} copyKey i18n key dùng cho tooltip
     * @param {string} copiedKey i18n key dùng cho log thành công
     * @param {string} failedKey i18n key dùng cho log thất bại
     */
    async copyCurrentFrame(canvasRef, copyKey, copiedKey, failedKey) {
      const canvas = this.$refs[canvasRef];
      if (!canvas || !this.isConnected) return;
      try {
        const blob = await new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/png');
        });
        if (blob) {
          await this.$tmUtility.copyImageFromBlob(blob);
          this.addLog(this.$t(copiedKey), 'success');
        }
      } catch (e) {
        this.addLog(
          `${this.$t(failedKey)}: ${this.formatError(e)}`,
          'error',
        );
      }
    },
  },
};
