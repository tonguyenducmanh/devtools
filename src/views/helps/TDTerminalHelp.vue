<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.terminal.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.terminal.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.terminal.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.terminal.howToUse.selectShell") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.terminal.howToUse.createSession") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.terminal.howToUse.interact") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.terminal.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.terminal.features.background") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.terminal.features.resize") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.terminal.features.multiple") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDTerminalHelp",
};
</script>

<style lang="scss">
@use "@/styles/help.scss";
</style>
