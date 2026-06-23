<template>
  <div class="td-footer-app">
    <div class="td-footer-shortcuts">
      <transition-group name="slide-fade" tag="div" class="td-shortcut-wrapper">
        <div
          v-for="shortcut in displayedShortcuts"
          :key="shortcut.key"
          class="td-shortcut-item"
        >
          <span class="td-shortcut-keys">
            <span
              v-for="part in shortcut.presentKey"
              :key="part"
              class="td-shortcut-key"
            >
              {{ part }}
            </span>
          </span>
          <span class="text-nowrap td-shortcut-label">
            {{ $t(shortcut.labelKey) }}
          </span>
        </div>
      </transition-group>
    </div>
    <div class="td-footer-actions">
      <span class="td-footer-title">{{ currentTitle }}</span>
    </div>
  </div>
</template>

<script>
import TDShortcutAction from "@/common/TDShortcutAction.js";

export default {
  name: "TDFooterApp",
  data() {
    return {
      activeShortcuts: [],
      currentPage: 0,
      intervalId: null,
      itemsPerPage: 3, // Cấu hình số lượng phím tắt hiển thị trên một màn hình
    };
  },
  computed: {
    currentTitle() {
      let version = this.$tdUtility.getAppVersion();
      return `v${version}`;
    },
    // Trả về danh sách phím tắt cần hiển thị của trang hiện tại
    displayedShortcuts() {
      if (this.activeShortcuts.length <= this.itemsPerPage) {
        return this.activeShortcuts;
      }
      const start = this.currentPage * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.activeShortcuts.slice(start, end);
    },
    // Tính tổng số trang phím tắt dựa trên cấu hình số lượng
    totalPages() {
      return Math.ceil(this.activeShortcuts.length / this.itemsPerPage);
    },
  },
  created() {
    TDShortcutAction.onChange(() => {
      this.updateActiveShortcuts();
    });
  },
  mounted() {
    this.updateActiveShortcuts();
  },
  beforeUnmount() {
    // Vue 3 sử dụng beforeUnmount thay thế cho beforeDestroy để xóa Interval tránh leak memory
    this.stopRotation();
  },
  methods: {
    updateActiveShortcuts() {
      const componentShortcuts = TDShortcutAction.getActiveShortcuts();
      this.activeShortcuts = [...componentShortcuts];

      // Reset về trang đầu tiên và kích hoạt lại vòng lặp đếm thời gian
      this.currentPage = 0;
      this.startRotation();
    },
    startRotation() {
      this.stopRotation();

      // Chỉ tự động xoay vòng nếu số lượng phím tắt vượt quá số lượng tối đa hiển thị (3)
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
}

/* Khung chứa các phím tắt làm điểm mốc tương đối cho hiệu ứng absolute */
.td-shortcut-wrapper {
  display: flex;
  align-items: center;
  gap: var(--padding);
  position: relative;
  width: 100%;
}

.td-shortcut-item {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: var(--border-radius);
  /* Tránh co chữ đột ngột khi chuyển đổi layout */
  white-space: nowrap;
}

.td-shortcut-keys {
  display: flex;
  align-items: center;
  gap: 2px;
}

.td-shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 2px 6px;
  background-color: var(--bg-layer-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color-secondary);
}

.td-shortcut-label {
  font-size: var(--font-size-medium-rare);
  color: var(--text-secondary-color);
}

.td-footer-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.td-footer-title {
  font-size: var(--font-size-medium-rare);
  color: var(--text-secondary-color);
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
