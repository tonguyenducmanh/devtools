<template>
  <div class="tm-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.cimbarDecode.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarDecode.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.cimbarDecode.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarDecode.howToUse.record") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarDecode.howToUse.upload") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarDecode.howToUse.mode") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarDecode.howToUse.start") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.cimbarDecode.notes.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarDecode.notes.quality") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarDecode.notes.sampleFps") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarDecode.notes.duration") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarDecode.notes.md5") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TMCimbarDecodeHelp",
};
</script>
