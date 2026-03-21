<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.compareCode.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.compareCode.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.compareCode.supportedFormats.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.compareCode.supportedFormats.list") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.compareCode.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.compareCode.features.highlight") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.compareCode.features.wrapText") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDCompareCodeHelp",
};
</script>

<style lang="scss">
@use "@/styles/help.scss";
</style>
