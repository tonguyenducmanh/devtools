<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiTesting.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiTesting.modes.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.modes.normal") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.modes.proMode") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiTesting.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.features.collection") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.features.history") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.features.import") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiTesting.requirement.title") }}
        </h3>
        <p class="section-note">
          {{ $t("i18nHelp.apiTesting.requirement.note") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiTesting.proModeHelp.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.proModeHelp.builtinFunctions") }}
        </p>
        <p class="section-text">
          <code>{{ $t("i18nHelp.apiTesting.proModeHelp.requestCURL") }}</code>
        </p>
        <p class="section-text">
          <code>{{ $t("i18nHelp.apiTesting.proModeHelp.request") }}</code>
        </p>
        <p class="section-text">
          <code>{{ $t("i18nHelp.apiTesting.proModeHelp.parseResponse") }}</code>
        </p>
        <p class="section-text">
          <code>{{ $t("i18nHelp.apiTesting.proModeHelp.requestMulti") }}</code>
        </p>
        <p class="section-text">
          <code>{{
            $t("i18nHelp.apiTesting.proModeHelp.requestMultiCURL")
          }}</code>
        </p>
        <p class="section-note">
          {{ triggerIntelliSenseText }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import TDShortcutAction, {
  TDShortcutActionEnum,
} from "@/common/TDShortcutAction.js";

export default {
  name: "TDAPITestingHelp",
  computed: {
    triggerIntelliSenseText() {
      let shortcuts = TDShortcutAction.getActiveShortcuts();
      let intelliSenseShortcut = shortcuts.find(
        (s) => s.labelKey === "i18nCommon.shortKeyAction.showIntelliSense",
      );
      let shortcutText = "";
      if (intelliSenseShortcut?.presentKey) {
        shortcutText = intelliSenseShortcut.presentKey.join(" + ");
      }
      return this.$t(
        "i18nHelp.apiTesting.proModeHelp.triggerIntelliSense",
      ).format(shortcutText);
    },
  },
};
</script>
