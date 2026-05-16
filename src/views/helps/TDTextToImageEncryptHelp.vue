<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.TextToImageEncrypt.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.TextToImageEncrypt.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.TextToImageEncrypt.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.TextToImageEncrypt.howToUse.input") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.TextToImageEncrypt.howToUse.generate") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.TextToImageEncrypt.howToUse.copyDownload") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDTextToImageEncryptHelp",
};
</script>

<style lang="scss">
@use "@/styles/help.scss";
</style>
