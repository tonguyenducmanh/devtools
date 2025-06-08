<template>
  <div class="td-history-container">
    <div class="td-history-header">
      <h3>Lịch sử</h3>
      <TDButton @click="clearAllHistory" label="Xóa tất cả"></TDButton>
    </div>
    <div class="td-history">
      <template v-for="(item, index) in historyItems">
        <div class="td-history-item" @click="applyHistoryText(item.historyId)">
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
</template>

<script>
import tdEnum from "@/common/TDEnum.js";

export default {
  name: "TDHistory",
  created() {
    let me = this;
    me.updateHistoryDisplay();
  },
  mounted() {},
  methods: {},
  props: {
    /**
     * function được dùng sau khi click vào item history
     */
    applyFunction: {
      type: Function,
      default: () => {},
    },
    cacheKey: {
      type: Number,
    },
  },
  data() {
    return {
      historyItems: [],
    };
  },
  methods: {
    /**
     * Áp dụng text từ lịch sử
     * @param {string} text - Text cần áp dụng
     */
    applyHistoryText(historyId) {
      let me = this;
      if (me.historyItems && me.historyItems.length > 0 && historyId) {
        let currentItem = me.historyItems.find((x) => x.historyId == historyId);
        if (currentItem) {
          me.applyFunction(currentItem.title);
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
        let item = {};
        let displayText =
          text && text.length > titleLength
            ? text.slice(0, titleLength) + "..."
            : text;
        item.textContent = displayText;
        item.title = text;
        item.historyId = historyItem.historyId;
        me.historyItems.push(item);
      });
    },
    /**
     * Lấy lịch sử text từ localStorage
     * @returns {Array} Mảng các text đã lưu
     */
    async getHistory() {
      let me = this;
      let history = await me.$tdCache.get(me.cacheKey);
      if (history) {
        if (Array.isArray(history)) {
          // Nếu history là mảng, không cần xử lý gì thêm
          console.log("History is already an array.");
        } else {
          history = JSON.parse(history);
        }
      } else {
        history = [];
      }
      return history;
    },

    /**
     * Lưu text vào lịch sử nếu khác với lần lưu trước
     * @param {string} text - Text cần lưu
     */
    async saveToHistory(text) {
      try {
        let me = this;
        let newHistory = typeof text === "string" ? text : JSON.stringify(text);
        let history = await me.getHistory();
        history = history.filter((x) => x.title != newHistory);
        history.push(me.buildHistoryItem(newHistory));
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
    buildHistoryItem(text) {
      let me = this;
      return {
        title: text,
        historyId: me.$tdUtility.newGuid(),
      };
    },
  },
};
</script>
<style lang="scss" scoped>
.td-history-container {
  padding: var(--padding);
  margin: var(--padding);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.td-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.td-history-header h3 {
  color: var(--text-primary-color);
  margin: 0;
}

.td-history {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.td-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--padding);
  background-color: var(--bg-sub-color);
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
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.1);
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
