<template>
  <div class="flex container">
    <div class="flex flex-col main-tool">
      <div class="flex flex-col input-section">
        <div class="flex flex-col form-area">
          <TMComboBox
            v-model="bankBin"
            :options="bankOptions"
            :label="$t('i18nCommon.vietQR.bank')"
            isLabelTop
            :noMargin="true"
            :width="100"
            :usingStylePercent="true"
            :isCapitalizeText="false"
            :placeHolder="$t('i18nCommon.vietQR.bankPlaceholder')"
          />
          <TMInput
            v-model="accountNumber"
            :label="$t('i18nCommon.vietQR.accountNumber')"
            isLabelTop
            :noMargin="true"
            :placeHolder="$t('i18nCommon.vietQR.accountPlaceholder')"
            :readOnly="isGenerating"
            @update:modelValue="onInputChange"
          />
          <TMInput
            v-model="amount"
            :label="$t('i18nCommon.vietQR.amount')"
            isLabelTop
            :noMargin="true"
            :inputType="'number'"
            :placeHolder="$t('i18nCommon.vietQR.amountPlaceholder')"
            :readOnly="isGenerating"
            @update:modelValue="onInputChange"
          />
          <TMInput
            v-model="description"
            :label="$t('i18nCommon.vietQR.description')"
            isLabelTop
            :noMargin="true"
            :placeHolder="$t('i18nCommon.vietQR.descriptionPlaceholder')"
            :readOnly="isGenerating"
            @update:modelValue="onInputChange"
          />
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="isCard"
            :label="$t('i18nCommon.vietQR.isCard')"
            @change="onInputChange"
          ></TMCheckbox>
          <div class="flex form-buttons">
            <TMButton
              :noMargin="true"
              :label="$t('i18nCommon.vietQR.generate')"
              :readOnly="!bankBin || !accountNumber || isGenerating"
              @click="generateQR"
            />
            <TMButton
              v-if="qrSrc"
              :noMargin="true"
              :type="$tmEnum.buttonType.secondary"
              :label="$t('i18nCommon.vietQR.download')"
              @click="downloadQR"
            />
          </div>
          <div v-if="qrPayload" class="flex flex-col payload-section">
            <span class="payload-title">{{
              $t("i18nCommon.vietQR.qrPayload")
            }}</span>
            <div
              class="payload-text"
              v-tooltip="$t('i18nCommon.copy')"
              @click="copyPayload"
            >
              {{ qrPayload }}
            </div>
          </div>
        </div>
      </div>
      <div class="flex qr-preview">
        <div v-if="isGenerating" class="qr-loading">
          <TMLoading />
        </div>
        <div
          v-else-if="qrSrc"
          class="qr-container"
          v-tooltip="$t('i18nCommon.copy')"
          @click="copyQR"
        >
          <img :src="qrSrc" />
        </div>
        <div v-else class="qr-empty">
          {{ $t("i18nCommon.vietQR.emptyHint") }}
        </div>
      </div>
    </div>
    <div class="credit-line">
      <a href="https://github.com/Ngochiendev/vietqr-core" target="_blank"
        >vietqr-core</a
      >
      &
      <a href="https://github.com/openhoangnc/vietqr" target="_blank">vietqr</a>
      (MIT)
    </div>
  </div>
</template>
<script>
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMLoading from "@/components/TMLoading.vue";
import banks from "@/common/vietqr/banks.json";
import { makeVietQRContent } from "@/common/vietqr/TMVietQR.js";
import { generateQRItems } from "@/common/qrcode/TMQRCodeWorkerClient.js";

// Option sinh QR đặt NGOÀI component: object trong `data()` là reactive Proxy
// không structured-clone được khi postMessage sang worker (Luật 13).
const QR_GENERATE_OPTIONS = {
  errorCorrectionLevel: "M",
  type: "image/png",
  quality: 1,
  margin: 2,
  color: {
    dark: "#000000",
    light: "#ffffff",
  },
  width: 1000,
};

export default {
  extends: TMToolBase,
  name: "TMVietQR",
  components: { TMLoading },
  watch: {
    bankBin() {
      this.reBuildTabTitle(this.selectedBankLabel);
      this.onInputChange();
    },
  },
  beforeUnmount() {
    let me = this;
    if (me.debounceTimer) {
      clearTimeout(me.debounceTimer);
    }
  },
  methods: {
    onInputChange() {
      let me = this;
      if (me.debounceTimer) {
        clearTimeout(me.debounceTimer);
      }
      // Sinh lại preview sau khi user ngừng gõ 400ms
      me.debounceTimer = setTimeout(() => me.generateQR(), 400);
    },
    /**
     * Dựng payload VietQR rồi sinh ảnh QR qua worker (không block main thread).
     * Có số tiền → QR động (010212), không → QR tĩnh (010211) theo NAPAS247.
     */
    async generateQR() {
      let me = this;
      if (!me.bankBin || !me.accountNumber) {
        return;
      }
      let amountValue = null;
      if (me.amount && Number(me.amount) > 0) {
        amountValue = Number(me.amount);
      }
      let payload;
      try {
        payload = makeVietQRContent({
          bankId: me.bankBin,
          accountId: String(me.accountNumber),
          amount: amountValue,
          description: me.description,
          isCard: me.isCard,
        });
      } catch (error) {
        me.qrPayload = null;
        me.qrSrc = null;
        me.$tmToast.error(me.$t("i18nCommon.vietQR.invalidInput"));
        return;
      }

      const genToken = ++me.generateToken;
      me.isGenerating = true;
      try {
        const { items, errors } = await generateQRItems(
          [{ index: 0, text: payload }],
          QR_GENERATE_OPTIONS,
        );
        if (me.generateToken !== genToken) return;
        if (errors && errors.length) {
          me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
          return;
        }
        me.qrPayload = payload;
        me.qrSrc = items && items[0] ? items[0].src : null;
      } catch (error) {
        console.error("Error in generateQR:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      } finally {
        if (me.generateToken === genToken) {
          me.isGenerating = false;
        }
      }
    },
    copyQR() {
      let me = this;
      if (me.qrSrc) {
        me.$tmUtility.copyImageFromUrl(me.qrSrc);
      }
    },
    copyPayload() {
      let me = this;
      if (me.qrPayload) {
        me.$tmUtility.copyToClipboard(me.qrPayload);
      }
    },
    downloadQR() {
      let me = this;
      if (!me.qrSrc) {
        return;
      }
      const arr = me.qrSrc.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      me.$tmUtility.createDownloadFileFromBlob(
        new Blob([u8arr], { type: mime }),
        `vietqr-${me.bankBin}-${me.accountNumber}.png`,
      );
    },
  },
  computed: {
    bankOptions() {
      let me = this;
      return banks.map((bank) => ({
        value: bank.bin,
        label: `${bank.shortName} - ${bank.code}`,
      }));
    },
    selectedBankLabel() {
      let me = this;
      let found = banks.find((bank) => bank.bin === me.bankBin);
      return found ? found.shortName : null;
    },
  },
  data() {
    return {
      bankBin: null,
      accountNumber: null,
      amount: null,
      description: null,
      isCard: false,
      qrSrc: null,
      qrPayload: null,
      isGenerating: false,
      generateToken: 0,
      debounceTimer: null,
    };
  },
};
</script>
<style scoped lang="scss">
.container {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
}
.main-tool {
  height: 100%;
  width: 100%;
  flex-direction: row;
  justify-content: flex-start;
  align-items: stretch;
}
.input-section {
  flex: 0 0 380px;
  padding: var(--padding);
  box-sizing: border-box;
  border-right: 1px solid var(--border-color);
  overflow: auto;
}
.form-area {
  width: 100%;
  gap: var(--padding);
}
.form-buttons {
  gap: var(--padding);
  margin-top: calc(var(--padding) / 2);
}
.payload-section {
  width: 100%;
  gap: calc(var(--padding) / 2);
  margin-top: var(--padding);
  .payload-title {
    color: var(--text-secondary-color);
    font-size: 12px;
  }
  .payload-text {
    width: 100%;
    padding: var(--padding);
    box-sizing: border-box;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background: var(--bg-layer-color);
    font-family: monospace;
    font-size: 12px;
    word-break: break-all;
    cursor: pointer;
    user-select: all;
  }
}
.qr-preview {
  flex: 1;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: var(--padding);
}
.qr-container {
  cursor: pointer;
  img {
    max-width: 100%;
    max-height: 100%;
    width: 400px;
    height: auto;
  }
}
.qr-loading {
  width: 100%;
  align-items: center;
  justify-content: center;
}
.qr-empty {
  color: var(--text-secondary-color);
}
.credit-line {
  position: absolute;
  right: var(--padding);
  bottom: calc(var(--padding) / 2);
  font-size: 11px;
  color: var(--text-secondary-color);
  a {
    color: var(--focus-color);
  }
}
</style>
