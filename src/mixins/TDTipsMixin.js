/**
 * Logic chung cho danh sách tip hướng dẫn dùng app (i18nTip.list):
 * - màn welcome chỉ xoay từng tip để quảng bá, người dùng không có cách đọc hết,
 *   nên có thêm popup xem toàn bộ tip
 * - popup xem toàn bộ dùng ở cả màn welcome và menu trợ giúp trên header, vì
 *   màn welcome chỉ hiện khi chưa mở tab nào
 */
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";

/**
 * Thời gian tự chuyển sang tip tiếp theo (ms)
 */
const TIP_AUTO_NEXT_DELAY = 10000;

/**
 * Gom danh sách tip thành nội dung hiển thị trong popup xem tất cả.
 * Popup đã có số dòng và tiêu đề riêng nên nội dung chỉ giữ mỗi tip một dòng,
 * không đánh số lại. Danh sách lấy thẳng từ i18n nên thêm tip mới không phải
 * sửa thêm chỗ khác.
 *
 * @param {string[]} tips - danh sách tip
 * @returns {string} nội dung hiển thị
 */
function buildTipsContent(tips) {
  let list = (Array.isArray(tips) ? tips : []).filter((tip) => !!tip);
  return list.join("\n");
}

export default {
  data() {
    return {
      tipIndex: 0,
      tipTimer: null,
    };
  },
  computed: {
    /**
     * danh sách tip hướng dẫn sử dụng app
     */
    tipsList() {
      return this.$t("i18nTip.list") ?? [];
    },
    /**
     * tip đang hiển thị
     */
    currentTip() {
      return this.tipsList[this.tipIndex] ?? "";
    },
  },
  methods: {
    /**
     * tự động chuyển sang tip tiếp theo
     */
    autoNextTip() {
      let len = this.tipsList.length;
      if (!len) return;
      this.tipIndex = (this.tipIndex + 1) % len;
    },
    /**
     * bấm vào tip: clear interval cũ, chuyển tip và tạo interval mới để reset thời gian tự chuyển
     */
    nextTip() {
      this.autoNextTip();
      this.startTipTimer();
    },
    /**
     * clear interval cũ và tạo interval mới
     */
    startTipTimer() {
      this.stopTipTimer();
      this.tipTimer = setInterval(this.autoNextTip, TIP_AUTO_NEXT_DELAY);
    },
    /**
     * dừng tự chuyển tip, gọi ở beforeUnmount
     */
    stopTipTimer() {
      clearInterval(this.tipTimer);
      this.tipTimer = null;
    },
    /**
     * Mở popup xem toàn bộ tip. Dùng chung TDQuickPreview với phần xem tài liệu
     * của tool automation: hiển thị trong editor nên đọc và copy đều thoải mái.
     */
    showAllTips() {
      let me = this;
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDQuickPreview,
        ownerForm: me,
        props: {},
        param: {
          value: buildTipsContent(me.tipsList),
          label: me.$t("i18nTip.viewAllTips"),
          language: "markdown",
        },
      });
    },
  },
};
