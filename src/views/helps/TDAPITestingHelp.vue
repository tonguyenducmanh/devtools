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
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.apiTesting.modes.normal") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.apiTesting.modes.proMode") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiTesting.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.apiTesting.features.collection") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.apiTesting.features.history") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.apiTesting.features.import") }}
          </div>
        </div>
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
        <div class="flex flex-col section-list">
          <div class="section-item section-code">
            <code>{{ $t("i18nHelp.apiTesting.proModeHelp.requestCURL") }}</code>
          </div>
          <div class="section-item section-code">
            <code>{{ $t("i18nHelp.apiTesting.proModeHelp.request") }}</code>
          </div>
          <div class="section-item section-code">
            <code>{{ $t("i18nHelp.apiTesting.proModeHelp.parseResponse") }}</code>
          </div>
          <div class="section-item section-code">
            <code>{{ $t("i18nHelp.apiTesting.proModeHelp.requestMulti") }}</code>
          </div>
          <div class="section-item section-code">
            <code>{{ $t("i18nHelp.apiTesting.proModeHelp.requestMultiCURL") }}</code>
          </div>
        </div>
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
        (s) =>
          s.labelKey === "i18nCommon.shortKeyAction.showIntelliSense",
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

