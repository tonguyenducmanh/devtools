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
        <p class="section-text">
          {{ $t("i18nHelp.qrCodeToText.howToUse.upload") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.qrCodeToText.howToUse.scan") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.qrCodeToText.howToUse.copy") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.qrCodeToText.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.qrCodeToText.features.compress") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.qrCodeToText.features.header") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDQRCodeToTextHelp",
};
</script>
