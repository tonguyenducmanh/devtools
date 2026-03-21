<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.codeFormatter.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.codeFormatter.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.codeFormatter.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.codeFormatter.howToUse.select") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.codeFormatter.howToUse.paste") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.codeFormatter.howToUse.format") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.codeFormatter.supported.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.codeFormatter.supported.content") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDCodeFormatterHelp",
};
</script>

<style lang="scss">
@use "@/styles/help.scss";
</style>
