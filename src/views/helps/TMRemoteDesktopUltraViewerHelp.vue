<template>
  <div class="tm-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.ultraViewer.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.ultraViewer.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.howToUse.inputHost") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.howToUse.inputCredentials") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.howToUse.connect") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.howToUse.fullscreen") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.ultraViewer.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.features.keyboard") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.features.mouse") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.features.clipboard") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.features.chat") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.features.agent") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.ultraViewer.troubleshooting.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.troubleshooting.connection") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.troubleshooting.credentials") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.ultraViewer.troubleshooting.agent") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TMRemoteDesktopUltraViewerHelp",
};
</script>
