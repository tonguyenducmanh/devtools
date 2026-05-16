<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.ImageToTextDecrypt.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.ImageToTextDecrypt.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.ImageToTextDecrypt.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.ImageToTextDecrypt.howToUse.upload") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.ImageToTextDecrypt.howToUse.convert") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.ImageToTextDecrypt.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.ImageToTextDecrypt.features.autoDetect") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDImageToTextDecryptHelp",
};
</script>

<style lang="scss">
@use "@/styles/help.scss";
</style>
