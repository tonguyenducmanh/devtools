<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.qrCodeToText.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.qrCodeToText.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.qrCodeToText.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.qrCodeToText.howToUse.upload") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.qrCodeToText.howToUse.scan") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.qrCodeToText.howToUse.copy") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.qrCodeToText.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.qrCodeToText.features.compress") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.qrCodeToText.features.header") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDQRCodeToTextHelp",
};
</script>

<style lang="scss">
@use "@/styles/help.scss";
</style>
