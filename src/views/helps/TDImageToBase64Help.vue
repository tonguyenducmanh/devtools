<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.imageToBase64.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.imageToBase64.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.imageToBase64.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.imageToBase64.howToUse.select") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.imageToBase64.howToUse.preview") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.imageToBase64.howToUse.copy") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.imageToBase64.note.title") }}
        </h3>
        <p class="section-note">
          {{ $t("i18nHelp.imageToBase64.note.content") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDImageToBase64Help",
};
</script>
