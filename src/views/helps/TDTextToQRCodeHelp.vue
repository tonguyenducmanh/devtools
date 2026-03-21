<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textToQRCode.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.textToQRCode.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textToQRCode.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.textToQRCode.howToUse.input") }}</div>
          <div class="section-item">{{ $t("i18nHelp.textToQRCode.howToUse.generate") }}</div>
          <div class="section-item">{{ $t("i18nHelp.textToQRCode.howToUse.copyDownload") }}</div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textToQRCode.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.textToQRCode.features.compress") }}</div>
          <div class="section-item">{{ $t("i18nHelp.textToQRCode.features.header") }}</div>
          <div class="section-item">{{ $t("i18nHelp.textToQRCode.features.batch") }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDTextToQRCodeHelp",
};
</script>

<style lang="scss">
@import "@/styles/help.scss";
</style>
