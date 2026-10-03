<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    :showFullScreenHeaderIcon="false"
    :resizable="false"
    width="320px"
    height="auto"
    :title="$t('i18nCommon.collection.addGroup')"
    @close="handleClose(false)"
  >
    <div class="flex flex-col td-collection-group-popup">
      <TDInput
        ref="nameInput"
        v-model="name"
        :noMargin="true"
        :placeHolder="$t('i18nCommon.collection.groupName')"
        @keyup.enter="handleSave"
      />
      <div class="flex td-collection-group-actions">
        <TDButton
          :noMargin="true"
          :label="$t('i18nCommon.collection.addGroup')"
          @click="handleSave"
        />
        <TDButton
          :noMargin="true"
          :label="$t('i18nCommon.toastMessage.cancel')"
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
 * TDCollectionGroupPopup - popup tạo nhóm mới cho mọi tool dùng chung
 * pattern master-detail (api testing, api mocking, automation, postgresql, rdp).
 *
 * Thay cho việc mỗi tool tự có 1 ô input + nút "+" nhúng thẳng trong sidebar.
 * Đổi tên nhóm vẫn làm inline trên sidebar (TDCollectionList), không qua popup.
 *
 * Mở qua TDDialogUtil.showPopup, callback nhận về { name }.
 */
export default {
  name: "TDCollectionGroupPopup",
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
      name: "",
    };
  },

  methods: {
    /**
     * Được gọi từ TDDialogUtil ngay sau khi mount
     */
    show() {
      this.name = "";
      this.$nextTick(() => {
        this.$refs.nameInput?.focus?.();
      });
    },

    handleSave() {
      const trimmedName = (this.name ?? "").trim();
      if (!trimmedName) {
        this.$tdToast.warning(this.$t("i18nCommon.collection.nameRequired"));
        return;
      }
      // Trả về tên mới, tool tự gọi API tạo nhóm
      this.handleClose({ name: trimmedName });
    },

    handleClose(payload) {
      this.$emit("close", payload);
    },
  },
};
</script>

<style scoped lang="scss">
.td-collection-group-popup {
  gap: var(--padding);
  padding: var(--padding);
  min-height: 100px;

  .td-collection-group-actions {
    gap: var(--padding);
    justify-content: flex-end;
  }
}
</style>
