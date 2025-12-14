<template>
  <div class="td-history-wrapper" :style="styleHistoryWrapper">
    <div
      class="flex flex-start button-group"
      :class="{
        'td-hide-history': !isHistoryVisible,
      }"
    >
      <TDButton
        @click="toggleHistory"
        :type="$tdEnum.buttonType.secondary"
        :label="
          isHistoryVisible
            ? $t('i18nCommon.history.hide')
            : $t('i18nCommon.history.show')
        "
      ></TDButton>
      <TDButton
        v-if="isHistoryVisible"
        @click="clearAllHistory"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.deleteAll')"
      ></TDButton>
    </div>

    <div
      v-if="isHistoryVisible && historyItems && historyItems.length > 0"
      class="td-history-container"
    >
      <div class="td-history">
        <template v-for="(item, index) in historyItems">
          <div
            class="td-history-item"
            @click="applyHistoryText(item.historyId)"
          >
            <span>{{ item.textContent }}</span>
            <button
              class="td-history-delete-btn"
              @click.stop.prevent="deleteHistoryItem(item.historyId)"
            >
              x
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import tdEnum from "@/common/TDEnum.js";

export default {
  name: "TDHistory",
  created() {
    let me = this;
  },
  mounted() {
    let me = this;
    me.prepareData();
  },
  methods: {},
  props: {
    /**
     * function được dùng sau khi click vào item history
     */
    applyFunction: {
      type: Function,
      default: () => {},
    },
    /**
     * Khóa cache để lưu lịch sử
     * @type {string}
     */
    cacheKey: {
      type: Number,
    },
    /**
     * Khóa tiêu đề của lịch sử
     * Để trống mặc định sẽ dùng luôn lịch sử làm tiêu đề
     * @type {string}
     */
    titleKey: {
      type: String,
    },
    /**
     * Cho phép append duplicate vào lịch sử
     * Nếu true, sẽ không kiểm tra trùng lặp khi lưu vào lịch sử
     */
    isAppendDuplicate: {
      type: Boolean,
      default: false, // Mặc định không append duplicate
    },
    noMargin: {
      type: Boolean,
      default: false,
    },
    /**
     * style để là relative thì khu vực history sẽ width max theo historywrap
     */
    positionRelative: {
      type: Boolean,
      default: true,
    },
    /**
     * Có tự động load history cuối cùng không
     */
    autoLoadLastHistory: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      historyItems: [],
      isHistoryVisible: false,
    };
  },
  computed: {
    styleHistoryWrapper() {
      let me = this;
      let currentStyleHistoryWraper = {};
      if (me.positionRelative) {
        currentStyleHistoryWraper.position = "relative";
      }
      if (me.noMargin) {
        currentStyleHistoryWraper.margin = "unset";
      } else {
        currentStyleHistoryWraper.margin = "var(--padding)";
      }
      return currentStyleHistoryWraper;
    },
  },
  methods: {
    toggleHistory() {
      this.isHistoryVisible = !this.isHistoryVisible;
    },
    /**
     * Áp dụng text từ lịch sử
     * @param {string} text - Text cần áp dụng
     */
    applyHistoryText(historyId) {
      let me = this;
      if (me.historyItems && me.historyItems.length > 0 && historyId) {
        let currentItem = me.historyItems.find((x) => x.historyId == historyId);
        if (currentItem) {
          me.applyFunction(currentItem.source || currentItem.title);
          me.isHistoryVisible = false;
        }
      }
    },
    /**
     * Xóa tất cả lịch sử
     */
    clearAllHistory() {
      let me = this;
      me.$tdCache.remove(me.cacheKey);
      me.historyItems = [];
      me.$tdToast.success(null, me.$t("i18nCommon.toastMessage.removed"));
    },
    /**
     * Xóa một item khỏi lịch sử
     * @param {number} index - Vị trí của item cần xóa
     */
    async deleteHistoryItem(historyId) {
      let me = this;
      let history = await me.getHistory();
      history = history.filter((x) => x.historyId != historyId);
      await me.$tdCache.set(me.cacheKey, JSON.stringify(history));
      await me.updateHistoryDisplay();
      me.$tdToast.success(null, me.$t("i18nCommon.toastMessage.removed"));
    },
    /**
     * Cập nhật hiển thị lịch sử
     */
    async updateHistoryDisplay() {
      let me = this;
      let history = await me.getHistory();
      let titleLength = window.__env.textToQRConfig.maxTitleLength;
      me.historyItems = [];
      [...history].reverse().forEach((historyItem, index) => {
        let text = historyItem.title;
        let displayText =
          text && text.length > titleLength
            ? text.slice(0, titleLength) + "..."
            : text;
        historyItem.textContent = displayText;
        me.historyItems.push(historyItem);
      });
    },
    /**
     * Chuẩn bị dữ liệu khi đã loading xong
     */
    async prepareData() {
      let me = this;
      await me.updateHistoryDisplay();
      if (
        me.autoLoadLastHistory &&
        me.historyItems &&
        me.historyItems.length > 0
      ) {
        me.$nextTick(() => {
          let lastHistoryItem = me.historyItems[0];
          if (lastHistoryItem) {
            me.applyHistoryText(lastHistoryItem.historyId);
          }
        });
      }
    },
    /**
     * Lấy lịch sử text từ localStorage
     * @returns {Array} Mảng các text đã lưu
     */
    async getHistory() {
      let me = this;
      let history = await me.$tdCache.get(me.cacheKey);
      if (history) {
        if (!Array.isArray(history)) {
          // Nếu history là mảng, không cần xử lý gì thêm
          history = JSON.parse(history);
        }
      } else {
        history = [];
      }
      return history;
    },

    /**
     * Lưu source vào lịch sử nếu khác với lần lưu trước
     * @param {string} text - Text cần lưu
     */
    async saveToHistory(source) {
      try {
        let me = this;
        let newHistory =
          typeof source === "string" ? source : JSON.stringify(source);
        let history = await me.getHistory();
        if (!me.isAppendDuplicate) {
          if (typeof source === "string") {
            history = history.filter((x) => x.source != source);
          } else {
            history = history.filter(
              (x) => JSON.stringify(x.source) != JSON.stringify(source)
            );
          }
        }
        history.push(me.buildHistoryItem(newHistory, source));
        // Giới hạn số lượng lịch sử lưu trữ
        if (history.length > window.__env.textToQRConfig.maxHistoryLength) {
          history.shift(); // Xóa item cũ nhất
        }
        await me.$tdCache.set(me.cacheKey, history);
        await me.updateHistoryDisplay();
      } catch (error) {
        console.error("Lỗi khi lưu vào history:", error);
        // Lỗi sẽ được bỏ qua để không ảnh hưởng tới luồng chính
      }
    },
    buildHistoryItem(newHistory, source) {
      let me = this;
      let historyItem = {
        historyId: me.$tdUtility.newGuid(),
        source: source,
      };
      if (me.titleKey && source && source.hasOwnProperty(me.titleKey)) {
        historyItem.title = source[me.titleKey] || newHistory;
      } else {
        historyItem.title = newHistory;
      }
      return historyItem;
    },
  },
};
</script>
<style lang="scss" scoped>
.td-history-wrapper {
}
.td-history-container {
  padding: var(--padding);
  margin: var(--padding) 0;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  width: 100%;
  position: absolute;
  z-index: 999;
  background-color: var(--bg-main-color);
  box-shadow: var(--box-shadow);
}

.button-group {
  column-gap: var(--padding);
  button {
    margin: unset;
  }
}

.td-history {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-height: 400px;
  overflow: auto;
}

.td-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--padding);
  background-color: var(--bg-layer-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  color: #444;
  max-width: 300px;
  gap: 0.5rem;
}

.td-history-item span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  color: var(--text-primary-color);
}

.td-history-item:hover {
  background-color: var(--bg-hover-color);
  border: 1px solid var(--focus-color);
  box-shadow: var(--box-shadow);
}

.td-history-item .td-history-delete-btn {
  background: none;
  border: none;
  color: var(--text-primary-color);
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 50%;
  margin-left: 4px;
}

.td-history-item .td-history-delete-btn:hover {
  color: var(--focus-color);
}

.td-history-item span:hover {
  color: var(--focus-color);
  text-decoration: underline;
}
</style>
