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
        <p class="section-text">
          {{ $t("i18nHelp.codeFormatter.howToUse.select") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.codeFormatter.howToUse.paste") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.codeFormatter.howToUse.format") }}
        </p>
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
