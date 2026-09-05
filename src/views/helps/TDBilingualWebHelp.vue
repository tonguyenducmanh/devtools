<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.bilingualWeb.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.bilingualWeb.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.bilingualWeb.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.bilingualWeb.howToUse.input") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.bilingualWeb.howToUse.fetch") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.bilingualWeb.howToUse.wait") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.bilingualWeb.options.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.bilingualWeb.options.delay") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.bilingualWeb.options.tags") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.bilingualWeb.options.classes") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.bilingualWeb.options.ids") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDBilingualWebHelp",
};
</script>
