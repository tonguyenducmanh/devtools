<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    :showFullScreenHeaderIcon="false"
    :closeOnClickOverlay="false"
    :resizable="false"
    width="520px"
    height="auto"
    :title="$t('i18nCommon.agreementTitle')"
    @close="handleClose"
  >
    <div class="flex flex-col td-agreement-popup">
      <!-- Nội dung điều khoản dài nên chỉ giới hạn chiều cao và cho cuộn,
           giữ màu chữ mặc định của app để đồng nhất với phần còn lại -->
      <p class="td-agreement-popup__content">
        {{ $t("i18nCommon.agreement") }}
      </p>
      <div class="flex td-agreement-popup__actions">
        <TDButton
          :noMargin="true"
          :label="$t('i18nCommon.agreementAccept')"
          @click="handleClose"
        />
      </div>
    </div>
  </TDPopup>
</template>

<script>
import TDPopup from "@/components/TDPopup.vue";

/**
 * TDAgreementPopup - popup điều khoản sử dụng.
 *
 * Trước đây điều khoản nằm ở chân màn welcome, giờ chuyển sang popup và chỉ
 * hiện 1 lần duy nhất khi vào phần mềm (App.vue gọi, cờ đã đồng ý lưu cache).
 * Click ra ngoài vô hiệu để không lỡ tay đóng khi chưa đọc, chỉ đóng được khi
 * bấm nút đồng ý hoặc nút X trên header.
 */
export default {
  name: "TDAgreementPopup",
  components: {
    TDPopup,
  },
  props: {
    ownerForm: {
      type: Object,
      default: null,
    },
    onClose: {
      type: Function,
      default: null,
    },
  },
  methods: {
    /**
     * TDDialogUtil gọi ngay sau khi mount (bắt buộc phải có)
     */
    show() {},
    handleClose() {
      this.onClose?.();
    },
  },
};
</script>

<style scoped lang="scss">
.td-agreement-popup {
  gap: var(--padding-large);
  padding: var(--padding-large);
  align-items: stretch;

  .td-agreement-popup__content {
    max-height: 45vh;
    overflow-y: auto;
    /* giãn dòng rộng cho dễ đọc, không justify vì cột hẹp sẽ giãn chữ theo
       từng dòng nhìn rất xấu */
    line-height: 1.7;
    text-align: left;
  }

  .td-agreement-popup__actions {
    justify-content: flex-end;
  }
}
</style>