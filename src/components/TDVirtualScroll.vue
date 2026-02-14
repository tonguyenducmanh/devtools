<template>
  <div ref="scrollContainer" class="td-virtual-scroll" @scroll="handleScroll">
    <div
      class="td-virtual-scroll-spacer"
      :style="{ height: totalHeight + 'px' }"
    >
      <div
        class="td-virtual-scroll-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="item.index"
          class="td-virtual-scroll-item"
          :style="itemStyle"
        >
          <slot :item="item.data" :index="item.index"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDVirtualScroll",

  props: {
    // Mảng dữ liệu cần render
    items: {
      type: Array,
      required: true,
      default: () => [],
    },

    // Chiều cao của mỗi item (px)
    itemHeight: {
      type: Number,
      required: true,
      default: 100,
    },

    // Chiều rộng của mỗi item (px) - dùng khi có nhiều item/row
    itemWidth: {
      type: Number,
      default: null,
    },

    // Số items trên 1 row (nếu không set sẽ tự tính theo itemWidth)
    itemsPerRow: {
      type: Number,
      default: 1,
    },

    // Số lượng items buffer thêm phía trên/dưới để scroll mượt hơn
    // Set = 0 để chỉ render đúng items visible (tiết kiệm nhất)
    // Set = 1-2 để scroll mượt hơn một chút
    // Set = 3+ để rất mượt nhưng tốn tài nguyên hơn
    bufferSize: {
      type: Number,
      default: 1,
    },

    // Gap giữa các items (px)
    gap: {
      type: Number,
      default: 0,
    },
  },

  data() {
    return {
      scrollTop: 0,
      containerHeight: 0,
      containerWidth: 0,
    };
  },

  computed: {
    // Tính số items trên 1 row
    actualItemsPerRow() {
      if (this.itemWidth && this.containerWidth > 0) {
        const availableWidth = this.containerWidth - this.gap;
        const itemWithGap = this.itemWidth + this.gap;
        return Math.floor(availableWidth / itemWithGap) || 1;
      }
      return this.itemsPerRow;
    },

    // Tổng số rows
    totalRows() {
      return Math.ceil(this.items.length / this.actualItemsPerRow);
    },

    // Chiều cao thực của mỗi row (bao gồm gap)
    rowHeight() {
      return this.itemHeight + this.gap;
    },

    // Tổng chiều cao của container
    totalHeight() {
      return this.totalRows * this.rowHeight - this.gap;
    },

    // Index của row đầu tiên hiển thị (không có buffer)
    startRow() {
      return Math.max(0, Math.floor(this.scrollTop / this.rowHeight));
    },

    // Index của row cuối cùng hiển thị (không có buffer)
    endRow() {
      return Math.min(
        this.totalRows - 1,
        Math.ceil((this.scrollTop + this.containerHeight) / this.rowHeight),
      );
    },

    // Start row có buffer để render trước
    startRowWithBuffer() {
      return Math.max(0, this.startRow - this.bufferSize);
    },

    // End row có buffer để render sau
    endRowWithBuffer() {
      return Math.min(this.totalRows - 1, this.endRow + this.bufferSize);
    },

    // Offset Y để đặt vị trí content
    offsetY() {
      return this.startRowWithBuffer * this.rowHeight;
    },

    // Danh sách items hiển thị
    visibleItems() {
      const items = [];
      const startIndex = this.startRowWithBuffer * this.actualItemsPerRow;
      const endIndex = Math.min(
        (this.endRowWithBuffer + 1) * this.actualItemsPerRow,
        this.items.length,
      );

      for (let i = startIndex; i < endIndex; i++) {
        items.push({
          index: i,
          data: this.items[i],
        });
      }

      return items;
    },

    // Style cho mỗi item
    itemStyle() {
      const style = {
        height: this.itemHeight + "px",
        marginBottom: this.gap + "px",
      };

      if (this.actualItemsPerRow > 1) {
        style.width = this.itemWidth
          ? this.itemWidth + "px"
          : `calc(${100 / this.actualItemsPerRow}% - ${this.gap}px)`;
        style.display = "inline-block";
        style.marginRight = this.gap + "px";
      }

      return style;
    },
  },

  mounted() {
    this.updateContainerSize();

    // Theo dõi resize
    this.resizeObserver = new ResizeObserver(() => {
      this.updateContainerSize();
    });
    this.resizeObserver.observe(this.$refs.scrollContainer);
  },

  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  },

  methods: {
    handleScroll(event) {
      this.scrollTop = event.target.scrollTop;
    },

    updateContainerSize() {
      if (this.$refs.scrollContainer) {
        this.containerHeight = this.$refs.scrollContainer.clientHeight;
        this.containerWidth = this.$refs.scrollContainer.clientWidth;
      }
    },

    // Public method: scroll đến item theo index
    scrollToIndex(index) {
      const row = Math.floor(index / this.actualItemsPerRow);
      const scrollTop = row * this.rowHeight;
      this.$refs.scrollContainer.scrollTop = scrollTop;
    },

    // Public method: lấy thông tin debug
    getDebugInfo() {
      return {
        totalItems: this.items.length,
        visibleItemsCount: this.visibleItems.length,
        actualItemsPerRow: this.actualItemsPerRow,
        totalRows: this.totalRows,
        startRow: this.startRow,
        endRow: this.endRow,
        startRowWithBuffer: this.startRowWithBuffer,
        endRowWithBuffer: this.endRowWithBuffer,
        containerHeight: this.containerHeight,
        containerWidth: this.containerWidth,
        scrollTop: this.scrollTop,
      };
    },
  },
};
</script>

<style scoped>
.td-virtual-scroll {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.td-virtual-scroll-spacer {
  position: relative;
  width: 100%;
}

.td-virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.td-virtual-scroll-item {
  box-sizing: border-box;
}

/* Smooth scrolling */
.td-virtual-scroll {
  scroll-behavior: smooth;
}
</style>
