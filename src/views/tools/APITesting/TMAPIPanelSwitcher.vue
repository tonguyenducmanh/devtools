<template>
  <div class="tm-header-options">
    <div class="tm-header-options-left">
      <span
        class="tm-header-option"
        :class="{ active: currentOption == headerOption }"
        @click="handleChange(headerOption)"
        v-tooltip="tooltipHeaderKey"
        >{{ labelHeaderKey }}</span
      >
      <span
        class="tm-header-option"
        :class="{ active: currentOption == bodyOption }"
        @click="handleChange(bodyOption)"
        v-tooltip="tooltipBodyKey"
        >{{ labelBodyKey }}</span
      >
    </div>
    <!-- ô status code chỉ có ở panel response -->
    <div class="tm-header-options-right" v-if="$slots.right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script>
/**
 * Cặp nút chuyển giữa panel header và panel body,
 * dùng chung cho api testing và api mocking
 */
export default {
  name: "TMAPIPanelSwitcher",
  props: {
    // panel đang mở, bấm nút còn lại thì phát sự kiện change
    currentOption: {
      type: Number,
      required: true,
    },
    headerOption: {
      type: Number,
      required: true,
    },
    bodyOption: {
      type: Number,
      required: true,
    },
    // panel response dùng bộ chữ khác với panel request
    isResponse: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["change"],
  computed: {
    labelHeaderKey() {
      return this.$t(
        this.isResponse
          ? "i18nCommon.apiTesting.changeToViewHeaderResponse"
          : "i18nCommon.apiTesting.changeToViewHeader",
      );
    },
    labelBodyKey() {
      return this.$t(
        this.isResponse
          ? "i18nCommon.apiTesting.changeToViewBodyResponse"
          : "i18nCommon.apiTesting.changeToViewBody",
      );
    },
    tooltipHeaderKey() {
      return this.$t(
        this.isResponse
          ? "i18nCommon.apiTesting.clickToViewHeaderResponse"
          : "i18nCommon.apiTesting.clickToViewHeader",
      );
    },
    tooltipBodyKey() {
      return this.$t(
        this.isResponse
          ? "i18nCommon.apiTesting.clickToViewBodyResponse"
          : "i18nCommon.apiTesting.clickToViewBody",
      );
    },
  },
  methods: {
    handleChange(option) {
      if (option != this.currentOption) {
        this.$emit("change", option);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.tm-header-options {
  display: flex;
  width: 100%;
  // đẩy ô status code sang bên phải
  justify-content: space-between;
  gap: var(--padding);
}

.tm-header-options-left,
.tm-header-options-right {
  display: flex;
  align-items: center;
  gap: var(--padding);
}

.tm-header-option {
  cursor: pointer;
  color: var(--tm-monaco-text-inactive);
  transition: color 0.15s;
}

.tm-header-option.active {
  color: var(--tm-monaco-text-active);
  font-weight: 600;
  // panel đang mở thì không bấm được, chỉ là nhãn báo trạng thái
  cursor: default;
}
</style>
