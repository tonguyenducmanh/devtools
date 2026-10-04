<template>
  <div class="td-footer-app">
    <div ref="shortcutsEl" class="td-footer-shortcuts">
      <transition-group name="slide-fade" tag="div" class="td-shortcut-wrapper">
        <TDFooterShortcutItem
          v-for="shortcut in displayedShortcuts"
          :key="shortcut.key"
          :presentKey="shortcut.presentKey"
          :label="$t(shortcut.labelKey)"
        />
      </transition-group>
    </div>

    <!--
      Row đo: render sẵn toàn bộ phím tắt ở trạng thái ẩn để lấy chiều rộng thật
      của từng item. Nhờ vậy số item hiển thị không bị hardcode theo số phím
      (Ctrl / Option / Shift...) hay độ dài chuỗi đa ngôn ngữ
    -->
    <div
      ref="measureEl"
      class="td-shortcut-wrapper td-shortcut-measure"
      aria-hidden="true"
    >
      <TDFooterShortcutItem
        v-for="shortcut in activeShortcuts"
        :key="shortcut.key"
        :presentKey="shortcut.presentKey"
        :label="$t(shortcut.labelKey)"
      />
    </div>
  </div>
</template>

<script>
import TDShortcutAction from "@/common/TDShortcutAction.js";
import TDCommonFunction from "@/common/TDCommonFunction.js";
import TDFooterShortcutItem from "@/views/misc/TDFooterShortcutItem.vue";

// Debounce đo lại số item: kéo/thay đổi kích thước cửa sổ bắn event liên tục
const MEASURE_DEBOUNCE_DELAY = 150;

export default {
  name: "TDFooterApp",
  components: { TDFooterShortcutItem },
  data() {
    return {
      activeShortcuts: [],
      // Số item vừa khít chiều ngang footer, tính ra sau khi đo DOM
      itemsPerPage: 0,
      currentPage: 0,
      intervalId: null,
      resizeObserver: null,
    };
  },
  computed: {
    // Trả về danh sách phím tắt cần hiển thị của trang hiện tại
    displayedShortcuts() {
      let perPage = this.itemsPerPage;
      // Chưa đo xong thì chưa hiện gì, tránh hiện thừa rồi giật lại
      if (perPage <= 0) {
        return [];
      }
      if (this.activeShortcuts.length <= perPage) {
        return this.activeShortcuts;
      }
      const start = this.currentPage * perPage;
      const end = start + perPage;
      return this.activeShortcuts.slice(start, end);
    },
    // Tính tổng số trang phím tắt dựa trên số item vừa khít bề ngang footer
    totalPages() {
      if (this.itemsPerPage <= 0) {
        return 1;
      }
      return Math.ceil(this.activeShortcuts.length / this.itemsPerPage);
    },
    // Chữ ký của các label: đổi ngôn ngữ làm độ rộng item đổi theo
    // nên cần đo lại số item hiển thị
    labelsSignature() {
      return this.activeShortcuts
        .map((item) => this.$t(item.labelKey))
        .join("|");
    },
  },
  watch: {
    labelsSignature() {
      this.refreshCapacity();
    },
  },
  created() {
    TDShortcutAction.onChange(() => {
      this.updateActiveShortcuts();
    });
    // Kéo cửa sổ sẽ bắn rất nhiều lần, debounce để chỉ đo lại 1 lần
    this.debouncedRefreshCapacity = TDCommonFunction.debounce(
      this.refreshCapacity,
      MEASURE_DEBOUNCE_DELAY,
    );
  },
  async mounted() {
    this.initResizeObserver();
    await this.updateActiveShortcuts();
  },
  beforeUnmount() {
    // Vue 3 sử dụng beforeUnmount thay thế cho beforeDestroy để xóa Interval tránh leak memory
    this.stopRotation();
    this.disposeResizeObserver();
    if (this.debouncedRefreshCapacity?.cancel) {
      this.debouncedRefreshCapacity.cancel();
    }
  },
  methods: {
    async updateActiveShortcuts() {
      const componentShortcuts = TDShortcutAction.getActiveShortcuts();
      this.activeShortcuts = [...componentShortcuts];

      // Reset về trang đầu tiên, đo lại số item vừa khít rồi mới bắt đầu xoay vòng
      this.currentPage = 0;
      await this.$nextTick();
      this.applyMeasuredCapacity();
      this.startRotation();
    },
    /**
     * Đo bề ngang thật của từng item rồi cộng dồn (kèm gap) để biết chính xác
     * bao nhiêu item vừa khít chiều ngang footer.
     * @returns số item vừa khít, hoặc null nếu chưa đo được (DOM chưa layout xong)
     */
    measureItemsPerPage() {
      let me = this;
      let containerEl = me.$refs.shortcutsEl;
      let measureEl = me.$refs.measureEl;
      if (!containerEl || !measureEl) {
        return null;
      }
      let available = containerEl.clientWidth;
      // Footer đang bị ẩn (display: none) thì clientWidth = 0, đo lúc khác
      if (available <= 0) {
        return null;
      }
      let gap = parseFloat(getComputedStyle(measureEl).columnGap) || 0;
      let itemEls = measureEl.querySelectorAll(".td-shortcut-item");

      let used = 0;
      let count = 0;
      for (let itemEl of itemEls) {
        let itemWidth = itemEl.offsetWidth;
        // Có item chưa layout xong thì số đo không đáng tin, để lần sau đo lại
        if (itemWidth <= 0) {
          return null;
        }
        let need = count === 0 ? itemWidth : gap + itemWidth;
        if (used + need > available) {
          break;
        }
        used += need;
        count++;
      }
      // Footer hẹp hơn cả item đầu tiên thì vẫn hiện tối thiểu 1 item
      return Math.max(count, 1);
    },
    applyMeasuredCapacity() {
      let nextPerPage = this.measureItemsPerPage();
      if (nextPerPage === null) {
        return;
      }
      this.itemsPerPage = nextPerPage;
      this.clampCurrentPage();
    },
    /**
     * Đo lại rồi cập nhật luôn vòng xoay: khi số item/trang thay đổi thì
     * chuyển từ "xoay vòng" sang "hiện hết" (hoặc ngược lại) cần xử lý lại
     */
    refreshCapacity() {
      this.$nextTick(() => {
        let before = this.itemsPerPage;
        this.applyMeasuredCapacity();
        if (before !== this.itemsPerPage) {
          this.startRotation();
        }
      });
    },
    clampCurrentPage() {
      let lastPage = Math.max(this.totalPages - 1, 0);
      if (this.currentPage > lastPage) {
        this.currentPage = lastPage;
      }
    },
    initResizeObserver() {
      let me = this;
      if (typeof ResizeObserver == "undefined") return;
      me.resizeObserver = new ResizeObserver(() => {
        me.debouncedRefreshCapacity();
      });
      if (me.$refs.shortcutsEl) {
        me.resizeObserver.observe(me.$refs.shortcutsEl);
      }
    },
    disposeResizeObserver() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    },
    startRotation() {
      this.stopRotation();

      // Chỉ tự động xoay vòng khi số phím tắt vượt quá số item vừa khít footer
      if (this.activeShortcuts.length > this.itemsPerPage) {
        this.intervalId = setInterval(() => {
          this.nextPage();
        }, 10000); // Đổi trang mỗi 10 giây
      }
    },
    stopRotation() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
    nextPage() {
      if (this.currentPage >= this.totalPages - 1) {
        this.currentPage = 0; // Quay lại trang đầu
      } else {
        this.currentPage++;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.td-footer-app {
  width: 100%;
  height: 32px;
  background-color: var(--bg-main-color);
  border-top: 1px solid var(--bg-layer-color);
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  flex-shrink: 0;
  overflow: hidden; /* Ẩn scrollbar để tránh việc thanh cuộn giật lag khi chạy animation */
}

.td-footer-shortcuts {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  flex-grow: 1;
  min-width: 0;
}

/* Khung chứa các phím tắt làm điểm mốc tương đối cho hiệu ứng absolute */
.td-shortcut-wrapper {
  display: flex;
  align-items: center;
  gap: var(--padding);
  position: relative;
  width: 100%;
}

/*
   Row đo chiều rộng: bị kéo ra ngoài luồng + ẩn đi, nhưng item bên trong vẫn
   layout bình thường nên đọc được offsetWidth thật của từng item
*/
.td-shortcut-measure {
  position: absolute;
  top: 0;
  left: 0;
  height: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
  flex-wrap: nowrap;
  white-space: nowrap;
}

/* 
   HIỆU ỨNG CHUYỂN TRANG MƯỢT

/* Thiết lập thời gian và đồ thị chuyển động cubic-bezier cao cấp */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Cơ chế FLIP: Giúp các phần tử còn lại tự động dịch chuyển mượt mà không bị khựng */
.slide-fade-move {
  transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Định nghĩa trạng thái bắt đầu xuất hiện (Fade In) - Trượt từ bên phải vào */
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

/* Định nghĩa trạng thái biến mất hoàn toàn (Fade Out) - Trượt sang bên trái */
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* BẮT BUỘC: Khi phần tử cũ đang mờ dần, đưa nó về absolute để nhường luồng hiển thị 
   ngay lập tức cho phần tử mới, triệt tiêu hoàn toàn lỗi giật sập layout. */
.slide-fade-leave-active {
  position: absolute;
}
</style>
