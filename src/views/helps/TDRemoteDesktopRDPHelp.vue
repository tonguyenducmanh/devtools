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
        <p class="section-text">
          {{ $t("i18nHelp.remoteDesktop.howToUse.inputHost") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.remoteDesktop.howToUse.inputCredentials") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.remoteDesktop.howToUse.connect") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.remoteDesktop.howToUse.fullscreen") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.remoteDesktop.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.remoteDesktop.features.keyboard") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.remoteDesktop.features.mouse") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.remoteDesktop.features.clipboard") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.remoteDesktop.features.agent") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.remoteDesktop.troubleshooting.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.remoteDesktop.troubleshooting.connection") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.remoteDesktop.troubleshooting.credentials") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.remoteDesktop.troubleshooting.agent") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDRemoteDesktopRDPHelp",
};
</script>
