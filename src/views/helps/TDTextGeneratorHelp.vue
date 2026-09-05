<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textGenerator.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.textGenerator.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textGenerator.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.textGenerator.howToUse.selectType") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textGenerator.howToUse.enterCount") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textGenerator.howToUse.generate") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textGenerator.generationTypes.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.textGenerator.generationTypes.word") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textGenerator.generationTypes.paragraph") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDTextGeneratorHelp",
};
</script>
