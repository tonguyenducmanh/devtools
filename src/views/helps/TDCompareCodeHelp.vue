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
        <p class="section-text">
          {{ $t("i18nHelp.compareCode.supportedFormats.list") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.compareCode.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.compareCode.features.highlight") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.compareCode.features.wrapText") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDCompareCodeHelp",
};
</script>
