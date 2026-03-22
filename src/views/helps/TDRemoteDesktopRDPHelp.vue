<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.remoteDesktop.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.remoteDesktop.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.remoteDesktop.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.remoteDesktop.howToUse.inputHost") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.remoteDesktop.howToUse.inputCredentials") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.remoteDesktop.howToUse.connect") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.remoteDesktop.howToUse.fullscreen") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.remoteDesktop.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.remoteDesktop.features.keyboard") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.remoteDesktop.features.mouse") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.remoteDesktop.features.clipboard") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.remoteDesktop.features.agent") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.remoteDesktop.troubleshooting.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.remoteDesktop.troubleshooting.connection") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.remoteDesktop.troubleshooting.credentials") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.remoteDesktop.troubleshooting.agent") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDRemoteDesktopRDPHelp",
};
</script>

<style lang="scss">
@use "@/styles/help.scss";
</style>
