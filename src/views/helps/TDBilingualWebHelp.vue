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
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.bilingualWeb.howToUse.input") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.bilingualWeb.howToUse.fetch") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.bilingualWeb.howToUse.wait") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.bilingualWeb.options.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.bilingualWeb.options.delay") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.bilingualWeb.options.tags") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.bilingualWeb.options.classes") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.bilingualWeb.options.ids") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDBilingualWebHelp",
};
</script>

