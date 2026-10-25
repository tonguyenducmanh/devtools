<template>
  <div class="tm-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.cimbarEncode.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarEncode.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.cimbarEncode.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarEncode.howToUse.source") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarEncode.howToUse.mode") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarEncode.howToUse.start") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarEncode.howToUse.capture") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.cimbarEncode.notes.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarEncode.notes.photosensitivity") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarEncode.notes.sizeLimit") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarEncode.notes.fileName") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.cimbarEncode.notes.md5") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TMCimbarEncodeHelp",
};
</script>
