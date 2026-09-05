<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.cosinSimilarity.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.cosinSimilarity.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.cosinSimilarity.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.cosinSimilarity.howToUse.enterFirst") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cosinSimilarity.howToUse.enterSecond") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cosinSimilarity.howToUse.calculate") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.cosinSimilarity.inputFormat.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.cosinSimilarity.inputFormat.content") }}
        </p>
        <p class="section-note">
          {{ $t("i18nHelp.cosinSimilarity.inputFormat.note") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDCosinSimilarityHelp",
};
</script>
