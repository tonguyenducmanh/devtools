<template>
  <TMPopup
    :visible="true"
    :showHeader="true"
    :showFullScreenHeaderIcon="false"
    :showCloseHeaderIcon="false"
    :closeOnClickOverlay="false"
    :resizable="false"
    width="520px"
    height="auto"
    :title="$t('i18nCommon.agreementTitle')"
  >
    <div class="flex flex-col tm-agreement-popup">
      <!-- Nội dung điều khoản dài nên chỉ giới hạn chiều cao và cho cuộn,
           giữ màu chữ mặc định của app để đồng nhất với phần còn lại -->
      <p class="tm-agreement-popup__content">
        {{ $t("i18nCommon.agreement") }}
      </p>
      <div class="flex tm-agreement-popup__actions">
        <TMButton
          :noMargin="true"
          :label="$t('i18nCommon.agreementAccept')"
          @click="handleClose"
        />
      </div>
    </div>
  </TMPopup>
</template>

<script>
import TMPopup from "@/components/TMPopup.vue";

/**
 * TMAgreementPopup - popup điều khoản sử dụng.
 *
 * Trước đây điều khoản nằm ở chân màn welcome, giờ chuyển sang popup và chỉ
 * hiện 1 lần duy nhất khi vào phần mềm (App.vue gọi, cờ đã đồng ý lưu cache).
 * Click ra ngoài vô hiệu để không lỡ tay đóng khi chưa đọc, chỉ đóng được khi
 * bấm nút đồng ý hoặc nút X trên header.
 */
export default {
  name: "TMAgreementPopup",
  components: {
    TMPopup,
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
     * TMDialogUtil gọi ngay sau khi mount (bắt buộc phải có)
     */
    show() {},
    handleClose() {
      this.onClose?.();
    },
  },
};
</script>

<style scoped lang="scss">
.tm-agreement-popup {
  gap: var(--padding-large);
  padding: var(--padding-large);
  align-items: stretch;

  .tm-agreement-popup__content {
    max-height: 45vh;
    overflow-y: auto;
    /* giãn dòng rộng cho dễ đọc, không justify vì cột hẹp sẽ giãn chữ theo
       từng dòng nhìn rất xấu */
    line-height: 1.7;
    text-align: left;
  }

  .tm-agreement-popup__actions {
    justify-content: flex-end;
  }
}
</style>
