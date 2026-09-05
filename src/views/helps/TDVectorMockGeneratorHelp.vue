<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.vectorMockGenerator.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.vectorMockGenerator.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.vectorMockGenerator.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.vectorMockGenerator.howToUse.setDimensions") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.vectorMockGenerator.howToUse.enterText") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.vectorMockGenerator.howToUse.generate") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.vectorMockGenerator.algorithm.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.vectorMockGenerator.algorithm.content") }}
        </p>
        <p class="section-note">
          {{ $t("i18nHelp.vectorMockGenerator.algorithm.note") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDVectorMockGeneratorHelp",
};
</script>
