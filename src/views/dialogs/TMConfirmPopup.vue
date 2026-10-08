<template>
  <TMPopup
    :visible="true"
    :showHeader="true"
    :showFullScreenHeaderIcon="false"
    :resizable="false"
    width="420px"
    height="auto"
    :title="title"
    @close="handleClose(false)"
  >
    <div class="flex flex-col tm-confirm-popup">
      <div class="tm-confirm-message" v-if="message">{{ message }}</div>
      <slot />
      <div class="flex tm-confirm-actions">
        <TMButton
          :noMargin="true"
          :label="confirmLabel || $t('i18nCommon.toastMessage.ok')"
          :type="confirmType"
          @click="handleClose(true)"
        />
        <TMButton
          :noMargin="true"
          :label="cancelLabel || $t('i18nCommon.toastMessage.cancel')"
          :type="$tmEnum.buttonType.secondary"
          @click="handleClose(false)"
        />
      </div>
    </div>
  </TMPopup>
</template>

<script>
import TMPopup from "@/components/TMPopup.vue";

/**
 * TMConfirmPopup - popup xác nhận chung cho toàn app.
 *
 * Dùng cho các thao tác không thể hoàn tác (xoá nhóm sẽ xoá luôn item bên trong).
 * Mở qua TMDialogUtil.confirm() để nhận về Promise<boolean>.
 */
export default {
  name: "TMConfirmPopup",
  components: {
    TMPopup,
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
     * Được gọi từ TMDialogUtil ngay sau khi mount
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
.tm-confirm-popup {
  gap: var(--padding);
  padding: var(--padding);
  min-height: 80px;
  justify-content: center;

  .tm-confirm-message {
    width: 100%;
    text-align: center;
  }

  .tm-confirm-actions {
    gap: var(--padding);
    justify-content: space-between;
    margin: 0 var(--padding);
  }
}
</style>
