<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    :showFullScreenHeaderIcon="false"
    :resizable="false"
    width="420px"
    height="auto"
    :title="title"
    @close="handleClose(false)"
  >
    <div class="flex flex-col td-confirm-popup">
      <div class="td-confirm-message" v-if="message">{{ message }}</div>
      <slot />
      <div class="flex td-confirm-actions">
        <TDButton
          :noMargin="true"
          :label="confirmLabel || $t('i18nCommon.toastMessage.ok')"
          :type="confirmType"
          @click="handleClose(true)"
        />
        <TDButton
          :noMargin="true"
          :label="cancelLabel || $t('i18nCommon.toastMessage.cancel')"
          :type="$tdEnum.buttonType.secondary"
          @click="handleClose(false)"
        />
      </div>
    </div>
  </TDPopup>
</template>

<script>
import TDPopup from "@/components/TDPopup.vue";

/**
 * TDConfirmPopup - popup xác nhận chung cho toàn app.
 *
 * Dùng cho các thao tác không thể hoàn tác (xoá nhóm sẽ xoá luôn item bên trong).
 * Mở qua TDDialogUtil.confirm() để nhận về Promise<boolean>.
 */
export default {
  name: "TDConfirmPopup",
  components: {
    TDPopup,
  },
  props: {
    ownerForm: {
      type: Object,
      required: true,
    },
  },
  emits: ["close"],

  data() {
    return {
      title: "",
      message: "",
      confirmLabel: "",
      cancelLabel: "",
      confirmType: null,
    };
  },

  methods: {
    /**
     * Được gọi từ TDDialogUtil ngay sau khi mount
     * @param {Object} param { title, message, confirmLabel, cancelLabel, confirmType }
     */
    show(param = {}) {
      this.title = param.title ?? this.$t("i18nCommon.popup.confirm");
      this.message = param.message ?? "";
      this.confirmLabel = param.confirmLabel ?? "";
      this.cancelLabel = param.cancelLabel ?? "";
      this.confirmType = param.confirmType ?? null;
    },

    handleClose(result) {
      this.$emit("close", result);
    },
  },
};
</script>

<style scoped lang="scss">
.td-confirm-popup {
  gap: var(--padding);
  padding: var(--padding);
  min-height: 80px;
  justify-content: center;

  .td-confirm-message {
    width: 100%;
    text-align: center;
  }

  .td-confirm-actions {
    gap: var(--padding);
    justify-content: space-between;
    margin: 0 var(--padding);
  }
}
</style>
