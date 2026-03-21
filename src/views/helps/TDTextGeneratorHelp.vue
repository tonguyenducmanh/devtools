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
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.textGenerator.howToUse.selectType") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.textGenerator.howToUse.enterCount") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.textGenerator.howToUse.generate") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textGenerator.generationTypes.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.textGenerator.generationTypes.word") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.textGenerator.generationTypes.paragraph") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDTextGeneratorHelp",
};
</script>

<style lang="scss">
@use "@/styles/help.scss";
</style>
