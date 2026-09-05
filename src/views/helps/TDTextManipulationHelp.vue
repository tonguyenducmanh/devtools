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
        <p class="section-text">
          {{ $t("i18nHelp.textManipulation.howToUse.input") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textManipulation.howToUse.expression") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textManipulation.howToUse.execute") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textManipulation.expressions.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.textManipulation.expressions.variable") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textManipulation.expressions.upper") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textManipulation.expressions.lower") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textManipulation.expressions.snake") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textManipulation.expressions.trim") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDTextManipulationHelp",
};
</script>
