<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.ocr.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.ocr.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.ocr.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.ocr.howToUse.upload") }}</div>
          <div class="section-item">{{ $t("i18nHelp.ocr.howToUse.process") }}</div>
          <div class="section-item">{{ $t("i18nHelp.ocr.howToUse.copy") }}</div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.ocr.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.ocr.features.language") }}</div>
          <div class="section-item">{{ $t("i18nHelp.ocr.features.psm") }}</div>
          <div class="section-item">{{ $t("i18nHelp.ocr.features.whitelist") }}</div>
          <div class="section-item">{{ $t("i18nHelp.ocr.features.preprocessing") }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDOpticalCharacterRecognitionHelp",
};
</script>

<style lang="scss">
@import "@/styles/help.scss";
</style>
