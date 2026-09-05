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
        <p class="section-text">
          {{ $t("i18nHelp.textToQRCode.howToUse.input") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textToQRCode.howToUse.generate") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textToQRCode.howToUse.copyDownload") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textToQRCode.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.textToQRCode.features.compress") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textToQRCode.features.header") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textToQRCode.features.batch") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDTextToQRCodeHelp",
};
</script>
