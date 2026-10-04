<template>
  <div
    class="tm-history-wrapper"
    :style="styleHistoryWrapper"
    v-click-outside="closeHistory"
  >
    <div
      class="flex flex-start button-group"
      :class="{
        'tm-hide-history': !isHistoryVisible,
      }"
    >
      <TMButton
        v-if="!allwayShowHistory"
        @click="toggleHistory"
        :type="$tmEnum.buttonType.secondary"
        :label="
          isHistoryVisible
            ? $t('i18nCommon.history.hide')
            : $t('i18nCommon.history.show')
        "
      ></TMButton>
      <TMButton
        v-if="isHistoryVisible"
        @click="clearAllHistory"
        :type="$tmEnum.buttonType.secondary"
        :label="$t('i18nCommon.deleteAll')"
      ></TMButton>
    </div>

    <div
      v-if="
        (isHistoryVisible || allwayShowHistory) &&
        historyItems &&
        historyItems.length > 0
      "
      class="tm-history-container"
      :style="styleHistoryContainer"
    >
      <div class="flex flex-col tm-history">
        <template v-for="(item, index) in historyItems">
          <div
            class="tm-history-item"
            @click="applyHistoryText(item.historyId)"
          >
            <span>{{ item.textContent }}</span>
            <button
              class="tm-history-delete-btn"
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
import tmEnum from "@/common/TMEnum.js";
import TMStylePremitiveMixin from "@/mixins/TMStylePremitiveMixin.js";
export default {
  name: "TMHistory",
  mixins: [TMStylePremitiveMixin],
  created() {
    let me = this;
  },
  mounted() {
    let me = this;
    me.prepareData();
  },
  methods: {},
  props: {
    allwayShowHistory: {
      type: Boolean,
      default: false,
    },
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
    /**
     * Số lượng lịch sử tối đa lưu trữ
     * Để trống mặc định dùng window.__env.textToQRConfig.maxHistoryLength
     */
    maxHistoryLength: {
      type: Number,
      default: 0,
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
      default: false,
    },
    historyContainerStyleEnum: {
      type: Number,
      default: tmEnum.AbsolutePositionStyle.Unset,
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
    styleHistoryContainer() {
      let me = this;
      let style = me.getPositionAbsoluteStyle(me.historyContainerStyleEnum);
      return style;
    },
  },
  methods: {
    toggleHistory() {
      this.isHistoryVisible = !this.isHistoryVisible;
    },
    closeHistory() {
      this.isHistoryVisible = false;
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
      me.$tmCache.remove(me.cacheKey);
      me.historyItems = [];
      me.$tmToast.success(me.$t("i18nCommon.toastMessage.removed"));
    },
    /**
     * Xóa một item khỏi lịch sử
     * @param {number} index - Vị trí của item cần xóa
     */
    async deleteHistoryItem(historyId) {
      let me = this;
      let history = await me.getHistory();
      history = history.filter((x) => x.historyId != historyId);
      await me.$tmCache.set(me.cacheKey, JSON.stringify(history));
      await me.updateHistoryDisplay();
      me.$tmToast.success(me.$t("i18nCommon.toastMessage.removed"));
    },
    /**
     * Cập nhật hiển thị lịch sử
     */
    async updateHistoryDisplay() {
      let me = this;
      let history = await me.getHistory();
      // let titleLength = window.__env.textToQRConfig.maxTitleLength;
      me.historyItems = [];
      [...history].reverse().forEach((historyItem, index) => {
        let text = historyItem.title;
        // let displayText =
        //   text && text.length > titleLength && me.isSliceHistoryText
        //     ? text.slice(0, titleLength) + "..."
        //     : text;
        historyItem.textContent = text;
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
      let history = await me.$tmCache.get(me.cacheKey);
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
        let maxHistoryLength =
          me.maxHistoryLength ||
          window.__env.textToQRConfig.maxHistoryLength;
        if (history.length > maxHistoryLength) {
          history.shift(); // Xóa item cũ nhất
        }
        await me.$tmCache.set(me.cacheKey, history);
        await me.updateHistoryDisplay();
      } catch (error) {
        console.error("Lỗi khi lưu vào history:", error);
        // Lỗi sẽ được bỏ qua để không ảnh hưởng tới luồng chính
      }
    },
    buildHistoryItem(newHistory, source) {
      let me = this;
      let historyItem = {
        historyId: me.$tmUtility.newGuid(),
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
.tm-history-wrapper {
}
.tm-history-container {
  padding: var(--padding);
  margin: var(--padding) 0;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  width: 100%;
  max-height: 500px;
  position: absolute;
  z-index: 999;
  background-color: var(--bg-main-color);
  box-shadow: var(--box-shadow);
  overflow-y: auto; 
}

.button-group {
  column-gap: var(--padding);
  button {
    margin: unset;
  }
}

.tm-history {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.tm-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--padding);
  background-color: var(--bg-layer-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  color: #444;
  gap: 0.5rem;
  width: 100%;
}

.tm-history-item span {
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
  text-overflow: ellipsis;
  cursor: pointer;
  color: var(--text-primary-color);
}

.tm-history-item:hover {
  background-color: var(--bg-hover-color);
  border: 1px solid var(--focus-color);
  box-shadow: var(--box-shadow);
}

.tm-history-item .tm-history-delete-btn {
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

.tm-history-item .tm-history-delete-btn:hover {
  color: var(--focus-color);
}

.tm-history-item span:hover {
  color: var(--focus-color);
  text-decoration: underline;
}
</style>
