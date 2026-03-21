<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textManipulation.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.textManipulation.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textManipulation.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.textManipulation.howToUse.input") }}</div>
          <div class="section-item">{{ $t("i18nHelp.textManipulation.howToUse.expression") }}</div>
          <div class="section-item">{{ $t("i18nHelp.textManipulation.howToUse.execute") }}</div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textManipulation.expressions.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.textManipulation.expressions.variable") }}</div>
          <div class="section-item">{{ $t("i18nHelp.textManipulation.expressions.upper") }}</div>
          <div class="section-item">{{ $t("i18nHelp.textManipulation.expressions.lower") }}</div>
          <div class="section-item">{{ $t("i18nHelp.textManipulation.expressions.snake") }}</div>
          <div class="section-item">{{ $t("i18nHelp.textManipulation.expressions.trim") }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDTextManipulationHelp",
};
</script>

<style lang="scss">
@import "@/styles/help.scss";
</style>
