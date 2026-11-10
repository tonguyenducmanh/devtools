<template>
  <span
    class="tm-monaco-footer-checkbox"
    v-tooltip="$t('i18nCommon.TMTextEditor.jsonPreviewTooltip')"
  >
    <TMCheckbox
      :modelValue="previewActive"
      :label="$t('i18nCommon.TMTextEditor.preview')"
      :no-margin="true"
      @update:modelValue="handlePreviewChange"
    />
  </span>
</template>

<script>
import TMCheckbox from "@/components/TMCheckbox.vue";

/**
 * Footer controls dành riêng cho editor JSON.
 * Component này được TMTextEditor render động qua language feature registry,
 * nên TMTextEditor hoàn toàn không biết gì về JSON.
 *
 * Props:
 * - previewActive: preview đang bật hay tắt (checkbox được tick theo state này).
 * Emits:
 * - update:previewActive: người dùng tick/bỏ tick, TMTextEditor tự bật/tắt preview.
 */
export default {
  name: "TMJSONFooterControls",
  components: { TMCheckbox },
  emits: ["update:previewActive"],
  props: {
    previewActive: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    handlePreviewChange(checked) {
      // Chỉ phát khi trạng thái thực sự thay đổi
      if (checked === this.previewActive) {
        return;
      }
      this.$emit("update:previewActive", checked);
    },
  },
};
</script>

<style lang="scss" scoped>
.tm-monaco-footer-checkbox {
  display: inline-flex;
  align-items: center;
  cursor: default;
}
</style>
