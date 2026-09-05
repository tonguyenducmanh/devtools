<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.base64ToImage.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.base64ToImage.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.base64ToImage.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.base64ToImage.howToUse.paste") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.base64ToImage.howToUse.convert") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.base64ToImage.howToUse.download") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.base64ToImage.note.title") }}
        </h3>
        <p class="section-note">
          {{ $t("i18nHelp.base64ToImage.note.content") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDBase64ToImageHelp",
};
</script>
