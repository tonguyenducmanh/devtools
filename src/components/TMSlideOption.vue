<template>
  <div class="tm-slide-group" ref="slideGroupRef" :class="{
    'layout-horizontal': layout === $tmEnum.coordinateAxes.horizontal,
    'layout-vertical': layout === $tmEnum.coordinateAxes.vertical,
    'tm-slide-group-no-margin': noMargin,
  }">
    <div class="tm-slide-group-label" v-if="label">
      {{ label.capitalize() }}
    </div>
    <div v-if="options && options.length > 0" class="flex tm-slide-group-area" ref="slideAreaRef">
      <!-- Background slider cho selected item -->
      <div class="tm-slide-background" :style="sliderStyle"></div>

      <div class="tm-slide-item" :class="{ 'tm-slide-item-selected': isSelected(option) }"
        v-for="(option, index) in options" :key="index" :ref="(el) => setItemRef(el, index)"
        @click="changeSlideVal(option.value)">
        <div v-if="showIcon" class="tm-icon" :class="{
          [option.icon]: option.icon,
        }" v-tooltip="option.label"></div>
        <span v-else>{{ option.label }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import tmEnum from "@/common/TMEnum.js";

/**
 * Style của slider khi chưa có item nào được chọn (selectedIndex = -1)
 * Khai báo ngoài component để dùng lại được, không tạo object mới mỗi lần gọi
 */
const HIDDEN_SLIDER_STYLE = {
  transform: "translateX(0px)",
  width: "0px",
  height: "0px",
};

export default {
  name: "TMslideGroup",
  props: {
    showIcon: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: null,
    },
    modelValue: {
      type: [String, Number, Boolean, Object],
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    options: {
      type: Array,
      default: () => [],
      required: true,
      validator: (options) =>
        options.every((option) => option.hasOwnProperty("value")),
    },
    layout: {
      type: String,
      default: tmEnum.coordinateAxes.horizontal,
      validator: (value) =>
        [
          tmEnum.coordinateAxes.horizontal,
          tmEnum.coordinateAxes.vertical,
        ].includes(value),
    },
    noMargin: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "change"],
  data() {
    return {
      itemRefs: [],
      sliderStyle: { ...HIDDEN_SLIDER_STYLE },
      resizeObserver: null,
    };
  },
  computed: {
    generatedName() {
      return this.name || `tm-slide-group-${this.$.uid}`;
    },
    selectedIndex() {
      // so sánh loose giống hệt class active, tránh trường hợp chữ đã đổi màu
      // nhưng slider vẫn nằm ở vị trí cũ
      return this.options.findIndex((opt) => opt.value == this.modelValue);
    },
    isVertical() {
      return this.layout === tmEnum.coordinateAxes.vertical;
    },
    /**
     * Danh sách value của options, dùng để detect option bị thêm/bớt/đổi thứ tự
     * mà selectedIndex vẫn giữ nguyên (khi đó index không đổi nên watcher không chạy)
     */
    optionValues() {
      return this.options.map((opt) => opt.value);
    },
  },
  watch: {
    selectedIndex: {
      handler() {
        this.scheduleUpdateSlider();
      },
      immediate: true,
    },
    optionValues() {
      this.scheduleUpdateSlider();
    },
    layout() {
      this.scheduleUpdateSlider();
    },
  },
  mounted() {
    this.scheduleUpdateSlider();
    this.initResizeObserver();
    window.addEventListener("resize", this.updateSliderPosition);
  },
  /**
   * Tool được render trong KeepAlive (TMDynamicTabView), khi tab được reactivate
   * DOM vừa được gắn lại vào document nên cần đo lại vị trí slider
   */
  activated() {
    this.scheduleUpdateSlider();
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.updateSliderPosition);
    this.disposeResizeObserver();
  },
  methods: {
    isSelected(option) {
      return option.value == this.modelValue;
    },
    setItemRef(el, index) {
      if (el) {
        this.itemRefs[index] = el;
      } else {
        // item bị unmount thì xoá luôn ref, tránh đo nhầm node đã bị detach khỏi DOM
        delete this.itemRefs[index];
      }
    },
    /**
     * Chờ Vue render xong DOM rồi mới đo, vì lúc này itemRefs mới được gán đủ
     */
    scheduleUpdateSlider() {
      this.$nextTick(() => {
        this.updateSliderPosition();
      });
    },
    /**
     * Theo dõi kích thước 2 node cha để đo lại vị trí slider khi:
     * - sidebar collapse/expand (display: none -> block): rect chuyển từ 0 -> kích thước thật
     * - tab KeepAlive được reactivate
     * - đổi theme (padding), đổi ngôn ngữ, font/icon load trễ, sidebar bị đổi kích thước
     */
    initResizeObserver() {
      let me = this;
      if (typeof ResizeObserver == "undefined") return;
      me.resizeObserver = new ResizeObserver(() => {
        me.updateSliderPosition();
      });
      [me.$refs.slideGroupRef, me.$refs.slideAreaRef].forEach((el) => {
        if (el) me.resizeObserver.observe(el);
      });
    },
    disposeResizeObserver() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    },
    updateSliderPosition() {
      let me = this;
      let containerEl = me.$refs.slideAreaRef;
      let selectedEl = me.selectedIndex >= 0 ? me.itemRefs[me.selectedIndex] : null;

      // chưa chọn item nào, hoặc item đã bị tháo khỏi DOM: ẩn slider đi
      // (trước đây hàm return sớm, giữ lại style cũ khiến slider nằm lệch vị trí)
      if (!containerEl || !selectedEl || !selectedEl.isConnected) {
        if (me.sliderStyle.width !== HIDDEN_SLIDER_STYLE.width) {
          me.sliderStyle = { ...HIDDEN_SLIDER_STYLE };
        }
        return;
      }

      let containerRect = containerEl.getBoundingClientRect();
      let itemRect = selectedEl.getBoundingClientRect();

      /**
       * Container đang bị ẩn (sidebar bị collapse, chưa reactivate tab, ...)
       * thì getBoundingClientRect trả về toàn 0, nếu ghi vào sliderStyle sẽ
       * biến slider thành 0px rồi không có gì đo lại giúp. Bỏ qua, đợi
       * ResizeObserver báo kích thước thật rồi đo lại.
       */
      if (!containerRect.width || !containerRect.height || !itemRect.width || !itemRect.height) {
        return;
      }

      if (me.isVertical) {
        // Vertical layout
        me.sliderStyle = {
          transform: `translateY(${itemRect.top - containerRect.top}px)`,
          width: `${itemRect.width}px`,
          height: `${itemRect.height}px`,
        };
      } else {
        // Horizontal layout
        me.sliderStyle = {
          transform: `translateX(${itemRect.left - containerRect.left}px)`,
          width: `${itemRect.width}px`,
          height: `${itemRect.height}px`,
        };
      }
    },
    changeSlideVal(e) {
      this.$emit("update:modelValue", e);
      this.$emit("change", e);
    },
  },
};
</script>

<style lang="scss" scoped>
.tm-slide-group {
  margin: var(--padding);

  .tm-slide-group-label {
    margin-bottom: var(--padding);
    font-size: var(--font-size-l-medium);
    color: var(--text-secondary-color);
  }
}

.tm-slide-group-no-margin {
  margin: unset;
}

.tm-slide-group.layout-horizontal {
  display: flex;
  flex-direction: row;
  align-items: end;

  .tm-slide-group-label {
    margin-bottom: 0;
    margin-right: var(--padding);
  }

  >div {
    margin-right: var(--padding-medium);

    &:last-child {
      margin-right: 0;
    }
  }
}

.tm-slide-group.layout-vertical {
  display: flex;
  flex-direction: column;

  .tm-slide-group-label {
    margin-bottom: var(--padding);
    margin-right: 0;
  }
}

.tm-slide-group-area {
  position: relative;
  border-radius: var(--border-radius);
  gap: 2px;
  padding: 0;

  .tm-slide-background {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: var(--border-radius);
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    z-index: 0;
  }

  .tm-slide-item {
    position: relative;
    box-sizing: border-box;
    cursor: pointer;
    padding: calc(var(--padding) / 2) var(--padding);
    border-radius: var(--border-radius);
    z-index: 1;
    transition: color 0.2s ease;

    border: 1px solid transparent;

    &:hover {
      border: 1px solid var(--focus-color);
    }
  }

  .tm-slide-item-selected {
    color: var(--selected-item-text-color);
  }
}

// Horizontal layout
.layout-horizontal .tm-slide-group-area {
  flex-direction: row;
}

// Vertical layout
.layout-vertical .tm-slide-group-area {
  flex-direction: column;
  align-items: stretch;
}

.tm-slide-item-selected .tm-icon {
  background-color: var(--selected-item-text-color);
}

.tm-slide-background {
  background-color: var(--tm-slide-bg);
}
</style>
