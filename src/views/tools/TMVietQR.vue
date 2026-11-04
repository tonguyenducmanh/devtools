<template>
  <div class="flex flex-col vietqr-container">
    <div class="flex vietqr-main">
      <div class="card form-card">
        <div class="card-header">
          <span class="card-title">{{
            $t("i18nCommon.vietQR.paymentInfo")
          }}</span>
          <span class="card-hint">{{
            $t("i18nCommon.vietQR.paymentInfoHint")
          }}</span>
        </div>
        <div class="flex flex-col form-area">
          <div class="bank-select" v-click-outside="closeBankDropdown">
            <div class="field-label">{{
              $t("i18nCommon.vietQR.bank")
            }}</div>
            <div
              ref="bankControlRef"
              class="bank-control"
              :class="{ open: bankOpen }"
              @click="toggleBankDropdown"
            >
              <template v-if="selectedBank">
                <img
                  v-if="bankLogoUrls[selectedBank.bin]"
                  class="bank-logo"
                  :src="bankLogoUrls[selectedBank.bin]"
                />
                <span class="bank-control-short">{{
                  selectedBank.shortName
                }}</span>
                <span class="bank-control-name"
                  >— {{ selectedBank.name }} ({{ selectedBank.bin }})</span
                >
              </template>
              <span v-else class="bank-control-placeholder">{{
                $t("i18nCommon.vietQR.bankPlaceholder")
              }}</span>
              <TMArrow :openProp="bankOpen" />
            </div>
            <TMFlyoutPanel
              :show="bankOpen"
              :anchorElFlyout="bankControlEl"
              :minWidth="bankControlWidth"
              panelClass="vietqr-bank-flyout"
            >
              <div class="bank-dropdown">
                <input
                  ref="bankSearchInput"
                  v-model="bankSearch"
                  class="bank-search"
                  :placeholder="$t('i18nCommon.vietQR.bankSearchPlaceholder')"
                  spellcheck="false"
                  autocomplete="off"
                />
                <div ref="bankListEl" class="bank-list">
                  <div
                    v-for="bank in filteredBanks"
                    :key="bank.bin"
                    class="bank-item"
                    :class="{ selected: bank.bin === bankBin }"
                    @click="selectBank(bank.bin)"
                  >
                    <img
                      v-if="bankLogoUrls[bank.bin]"
                      class="bank-logo"
                      :src="bankLogoUrls[bank.bin]"
                    />
                    <div class="bank-item-text">
                      <div class="bank-item-top">
                        <span class="bank-item-short">{{ bank.shortName }}</span>
                        <span class="bank-item-code"
                          >{{ bank.code }} • {{ bank.bin }}</span
                        >
                      </div>
                      <div class="bank-item-name">{{ bank.name }}</div>
                    </div>
                  </div>
                  <div v-if="!filteredBanks.length" class="bank-empty">
                    {{ $t("i18nCommon.vietQR.bankNoResult") }}
                  </div>
                </div>
              </div>
            </TMFlyoutPanel>
          </div>
          <TMInput
            v-model="accountNumber"
            :label="$t('i18nCommon.vietQR.accountNumber')"
            isLabelTop
            :noMargin="true"
            :placeHolder="$t('i18nCommon.vietQR.accountPlaceholder')"
            @update:modelValue="onInputChange"
          />
          <TMInput
            v-model="accountName"
            :label="$t('i18nCommon.vietQR.accountName')"
            isLabelTop
            :noMargin="true"
            :placeHolder="$t('i18nCommon.vietQR.accountNamePlaceholder')"
            @update:modelValue="onInputChange"
          />
          <div class="form-row">
            <TMInput
              v-model="amount"
              :label="$t('i18nCommon.vietQR.amount')"
              isLabelTop
              :noMargin="true"
              :inputType="'number'"
              :placeHolder="$t('i18nCommon.vietQR.amountPlaceholder')"
              @update:modelValue="onInputChange"
            />
            <TMInput
              v-model="description"
              :label="$t('i18nCommon.vietQR.description')"
              isLabelTop
              :noMargin="true"
              :placeHolder="$t('i18nCommon.vietQR.descriptionPlaceholder')"
              @update:modelValue="onInputChange"
            />
          </div>
          <TMRadioGroup
            :noMargin="true"
            v-model="isCard"
            :label="$t('i18nCommon.vietQR.transferMethod')"
            :layout="$tmEnum.coordinateAxes.vertical"
            :options="transferMethodOptions"
            @update:modelValue="onInputChange"
          />
          <div class="custom-logo-row">
            <div class="field-label no-pad">
              {{ $t("i18nCommon.vietQR.customLogo") }}
            </div>
            <div class="flex custom-logo-controls">
              <TMButton
                :noMargin="true"
                :type="$tmEnum.buttonType.secondary"
                :label="$t('i18nCommon.vietQR.chooseLogo')"
                @click="pickLogo"
              />
              <template v-if="customLogoDataUrl">
                <img class="custom-logo-preview" :src="customLogoDataUrl" />
                <TMButton
                  :noMargin="true"
                  :type="$tmEnum.buttonType.secondary"
                  :label="$t('i18nCommon.vietQR.removeLogo')"
                  @click="removeLogo"
                />
              </template>
            </div>
            <input
              ref="logoInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="logo-file-input"
              @change="onLogoChange"
            />
          </div>
          <div class="form-row">
            <TMComboBox
              v-model="template"
              :options="templateOptions"
              :label="$t('i18nCommon.vietQR.templateLabel')"
              isLabelTop
              :noMargin="true"
              :width="100"
              :usingStylePercent="true"
              :isCapitalizeText="false"
            />
            <TMComboBox
              v-model="format"
              :options="formatOptions"
              :label="$t('i18nCommon.vietQR.imageFormat')"
              isLabelTop
              :noMargin="true"
              :width="100"
              :usingStylePercent="true"
              :isCapitalizeText="false"
            />
          </div>
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
        </div>
      </div>
      <div class="card preview-card">
        <div class="card-header">
          <span class="card-title preview-title">{{
            $t("i18nCommon.vietQR.previewTitle")
          }}</span>
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
import TMArrow from "@/components/TMArrow.vue";
import TMFlyoutPanel from "@/components/TMFlyoutPanel.vue";
import banks from "@/common/vietqr/banks.json";
import { makeVietQRContent } from "@/common/vietqr/TMVietQR.js";
import {
  renderVietQrImage,
  bankLogoUrls as bankLogoMap,
} from "@/common/vietqr/TMVietQrCardRenderer.js";

// Bỏ dấu tiếng Việt để tìm "vietcombank" ra được "Vietcombank" / "VCB"
function normalizeSearch(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

export default {
  extends: TMToolBase,
  name: "TMVietQR",
  components: { TMLoading, TMArrow, TMFlyoutPanel },
  watch: {
    bankBin() {
      this.reBuildTabTitle(this.selectedBank?.shortName);
      this.onInputChange();
    },
    bankOpen(val) {
      if (val) {
        this.bankSearch = "";
        this.$nextTick(() => {
          // TMFlyoutPanel còn visibility:hidden cho tới khi position() chạy
          // trong nextTick của nó — focus trong lúc đó bị browser bỏ qua,
          // nên đợi hết microtask (setTimeout) rồi mới focus
          setTimeout(() => {
            this.$refs.bankSearchInput?.focus();
            this.scrollSelectedBankToVisible();
          }, 0);
        });
      }
    },
    // Đổi mẫu / định dạng / logo tâm → vẽ lại ảnh ngay không cần gõ lại
    template() {
      this.generateQR();
    },
    format() {
      this.generateQR();
    },
    customLogoDataUrl() {
      this.generateQR();
    },
  },
  beforeUnmount() {
    let me = this;
    if (me.debounceTimer) {
      clearTimeout(me.debounceTimer);
    }
  },
  methods: {
    toggleBankDropdown() {
      if (!this.bankOpen) {
        // Đo ô control trước khi mở để flyout có điểm neo và bề rộng tối thiểu
        this.bankControlEl = this.$refs.bankControlRef;
        this.bankControlWidth =
          this.$refs.bankControlRef?.getBoundingClientRect().width || 0;
      }
      this.bankOpen = !this.bankOpen;
    },
    closeBankDropdown(event) {
      // Dropdown bị Teleport ra body nên không nằm trong .bank-select,
      // phải tự loại nó ra để click trong danh sách không đóng popup
      if (event?.target?.closest?.(".bank-dropdown")) return;
      this.bankOpen = false;
    },
    selectBank(bin) {
      this.bankBin = bin;
      this.bankOpen = false;
    },
    /**
     * Cuộn ngân hàng đang chọn vào vùng nhìn thấy. Tự set scrollTop thay vì
     * scrollIntoView vì scrollIntoView cuộn cả vùng scroll cha
     */
    scrollSelectedBankToVisible() {
      const listEl = this.$refs.bankListEl;
      if (!listEl) return;
      const selectedEl = listEl.querySelector(".bank-item.selected");
      if (!selectedEl) return;
      listEl.scrollTop = Math.max(
        0,
        selectedEl.offsetTop - listEl.clientHeight + selectedEl.offsetHeight,
      );
    },
    pickLogo() {
      this.$refs.logoInputRef?.click();
    },
    onLogoChange(event) {
      const file = event.target.files?.[0];
      // reset value để chọn lại cùng 1 file vẫn trigger change
      event.target.value = "";
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.customLogoDataUrl = reader.result;
      };
      reader.readAsDataURL(file);
    },
    removeLogo() {
      this.customLogoDataUrl = null;
    },
    onInputChange() {
      let me = this;
      if (me.debounceTimer) {
        clearTimeout(me.debounceTimer);
      }
      // Sinh lại preview sau khi user ngừng gõ 400ms
      me.debounceTimer = setTimeout(() => me.generateQR(), 400);
    },
    /**
     * Dựng payload VietQR rồi vẽ ảnh thẻ theo mẫu đang chọn (compact/qr_only/
     * print) trên canvas main thread — ma trận QR nhỏ, vẽ nhanh không cần worker.
     * Có số tiền → QR động (010212), không → QR tĩnh (010211) theo NAPAS247.
     */
    async generateQR() {
      let me = this;
      if (!me.bankBin || !me.accountNumber) {
        me.qrPayload = null;
        me.qrSrc = null;
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
        const src = await renderVietQrImage({
          payload,
          template: me.template,
          format: me.format,
          bankLogoUrl: bankLogoMap[me.bankBin] || null,
          bankName: me.selectedBank?.shortName || null,
          bankFullName: me.selectedBank?.name || null,
          accountNumber: me.accountNumber,
          accountName: me.accountName,
          amount: amountValue,
          description: me.description,
          isCard: me.isCard,
          customLogoDataUrl: me.customLogoDataUrl,
        });
        if (me.generateToken !== genToken) return;
        me.qrPayload = payload;
        me.qrSrc = src;
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
      const ext = me.format === "jpeg" ? "jpg" : me.format;
      me.$tmUtility.createDownloadFileFromBlob(
        new Blob([u8arr], { type: mime }),
        `vietqr-${me.bankBin}-${me.accountNumber}.${ext}`,
      );
    },
  },
  computed: {
    // Options API không expose import cho template nên phải đưa qua computed
    bankLogoUrls() {
      return bankLogoMap;
    },
    selectedBank() {
      return banks.find((bank) => bank.bin === this.bankBin) || null;
    },
    filteredBanks() {
      const keyword = normalizeSearch(this.bankSearch).trim();
      if (!keyword) {
        return banks;
      }
      return banks.filter((bank) =>
        [bank.shortName, bank.code, bank.bin, bank.name].some((field) =>
          normalizeSearch(field).includes(keyword),
        ),
      );
    },
    transferMethodOptions() {
      return [
        { value: false, label: this.$t("i18nCommon.vietQR.toAccount") },
        { value: true, label: this.$t("i18nCommon.vietQR.toCard") },
      ];
    },
    templateOptions() {
      return [
        {
          value: "compact",
          label: this.$t("i18nCommon.vietQR.templateCompact"),
        },
        {
          value: "qr_only",
          label: this.$t("i18nCommon.vietQR.templateQrOnly"),
        },
        { value: "print", label: this.$t("i18nCommon.vietQR.templatePrint") },
      ];
    },
    formatOptions() {
      return [
        { value: "png", label: "PNG (Lossless)" },
        { value: "jpeg", label: "JPEG (Nén)" },
        { value: "webp", label: "WebP (Tối ưu web)" },
        { value: "svg", label: "SVG (Vector)" },
      ];
    },
  },
  data() {
    return {
      bankBin: null,
      bankOpen: false,
      bankSearch: "",
      bankControlEl: null,
      bankControlWidth: 0,
      accountNumber: null,
      accountName: null,
      amount: null,
      description: null,
      isCard: false,
      template: "compact",
      format: "png",
      customLogoDataUrl: null,
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
.vietqr-container {
  width: 100%;
  height: 100%;
  position: relative;
  padding: var(--padding);
  box-sizing: border-box;
  align-items: stretch;
  justify-content: flex-start;
}
.vietqr-main {
  flex: 1;
  gap: var(--padding);
  align-items: stretch;
  justify-content: flex-start;
  min-height: 0;
}
.card {
  display: flex;
  flex-direction: column;
  background: var(--bg-layer-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  box-sizing: border-box;
  overflow: auto;
  min-height: 0;
}
.card-header {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding) / 2);
  padding: var(--padding) calc(var(--padding) * 1.5);
  border-bottom: 1px solid var(--border-color);
  .card-title {
    font-size: var(--font-size-medium-rare);
    font-weight: 600;
  }
  .card-hint {
    font-size: var(--font-size-small);
    color: var(--text-secondary-color);
  }
  .preview-title {
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary-color);
  }
}
.form-card {
  flex: 0 0 420px;
}
.form-area {
  width: 100%;
  padding: calc(var(--padding) * 1.5);
  box-sizing: border-box;
  gap: var(--padding);
  justify-content: flex-start;
  align-items: stretch;
}
.field-label {
  padding-bottom: var(--padding);
  font-size: var(--font-size-l-medium);
  white-space: nowrap;
  &.no-pad {
    padding-bottom: 0;
  }
}
.form-row {
  display: flex;
  gap: var(--padding);
  > * {
    flex: 1;
  }
}
.form-buttons {
  gap: var(--padding);
  margin-top: calc(var(--padding) / 2);
  justify-content: flex-start;
}
.bank-select {
  position: relative;
  width: 100%;
}
.bank-logo {
  height: 20px;
  max-width: 60px;
  object-fit: contain;
  flex-shrink: 0;
}
.bank-control {
  height: var(--base-component-height);
  display: flex;
  align-items: center;
  padding: var(--padding);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  cursor: pointer;
  background: var(--bg-thirt-color);
  gap: calc(var(--padding) / 2);

  &:hover,
  &.open {
    border-color: var(--focus-color);
  }

  .bank-control-short {
    font-weight: 600;
    white-space: nowrap;
  }
  .bank-control-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-secondary-color);
  }
  .bank-control-placeholder {
    flex: 1;
    color: var(--text-secondary-color);
    opacity: var(--placeholder-opacity);
  }
}
.custom-logo-row {
  display: flex;
  flex-direction: column;
  gap: var(--padding);
  .custom-logo-controls {
    gap: var(--padding);
    justify-content: flex-start;
  }
  .custom-logo-preview {
    height: 28px;
    max-width: 60px;
    object-fit: contain;
  }
  .logo-file-input {
    display: none;
  }
}
.preview-card {
  flex: 1;
}
.qr-preview {
  flex: 1;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: var(--padding);
  min-height: 0;
}
.qr-container {
  cursor: pointer;
  background: #ffffff;
  padding: var(--padding);
  border-radius: var(--border-radius-component);
  img {
    display: block;
    max-width: 100%;
    max-height: 100%;
    width: 360px;
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
  padding: var(--padding-large);
  text-align: center;
}
.payload-section {
  width: 100%;
  gap: calc(var(--padding) / 2);
  padding: var(--padding) calc(var(--padding) * 1.5) calc(var(--padding) * 1.5);
  box-sizing: border-box;
  .payload-title {
    color: var(--text-secondary-color);
    font-size: 12px;
  }
  .payload-text {
    width: 100%;
    padding: var(--padding);
    box-sizing: border-box;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-component);
    background: var(--bg-thirt-color);
    font-family: monospace;
    font-size: 12px;
    word-break: break-all;
    cursor: pointer;
    user-select: all;
  }
}
.credit-line {
  padding-top: var(--padding);
  font-size: 11px;
  color: var(--text-secondary-color);
  text-align: right;
  a {
    color: var(--focus-color);
  }
}
</style>
<style lang="scss">
/* Dropdown ngân hàng bị Teleport ra body (TMFlyoutPanel) so style phải
   đặt ngoài scoped để áp dụng được */
.vietqr-bank-flyout {
  /* Giống .tm-combobox-flyout: bỏ padding mặc định của panel để viền khớp
     danh sách, giữ nền/viền theo theme */
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  background: var(--bg-main-color);
  .bank-dropdown {
    display: flex;
    flex-direction: column;
    min-width: 100%;
  }
  .bank-search {
    border: none;
    border-bottom: 1px solid var(--border-color);
    height: var(--base-component-height);
    padding: 0 var(--padding);
    background: transparent;
    color: var(--text-primary-color);
    font-size: var(--font-size-medium);
    outline: none;

    &::placeholder {
      color: var(--text-secondary-color);
      opacity: var(--placeholder-opacity);
    }
  }
  .bank-list {
    max-height: 320px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .bank-item {
    display: flex;
    align-items: center;
    gap: var(--padding);
    padding: calc(var(--padding) / 2) var(--padding);
    cursor: pointer;

    &:hover {
      background: var(--bg-hover-color);
    }
    &.selected {
      background: var(--bg-layer-color);
    }
    .bank-logo {
      height: 22px;
      width: 60px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .bank-item-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .bank-item-top {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--padding);
    }
    .bank-item-short {
      font-weight: 600;
      white-space: nowrap;
    }
    .bank-item-code {
      font-size: var(--font-size-small);
      color: var(--text-secondary-color);
      white-space: nowrap;
    }
    .bank-item-name {
      font-size: var(--font-size-small);
      color: var(--text-secondary-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .bank-empty {
    padding: var(--padding);
    color: var(--text-secondary-color);
    text-align: center;
  }
}
</style>
