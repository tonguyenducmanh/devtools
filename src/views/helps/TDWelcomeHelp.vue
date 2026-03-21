<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.welcome.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.welcome.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.welcome.quickStart.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.welcome.quickStart.selectTool") }}</div>
          <div class="section-item">{{ $t("i18nHelp.welcome.quickStart.searchTool") }}</div>
        </div>
        <p class="section-note">{{ $t("i18nHelp.welcome.quickStart.note") }}</p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.welcome.multiTab.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.welcome.multiTab.description") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.welcome.multiTab.rightClick") }}
        </p>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.welcome.multiTab.duplicateTab") }}</div>
          <div class="section-item">{{ $t("i18nHelp.welcome.multiTab.closeTab") }}</div>
          <div class="section-item">{{ $t("i18nHelp.welcome.multiTab.closeAllTabs") }}</div>
        </div>
        <p class="section-text">
          {{ $t("i18nHelp.welcome.multiTab.dragReorder") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.welcome.agent.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.welcome.agent.webOnly") }}</div>
          <div class="section-item">{{ $t("i18nHelp.welcome.agent.needAgent") }}</div>
        </div>
        <p class="section-text">
          {{ $t("i18nHelp.welcome.agent.downloadAgent") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDWelcomeHelp",
  data() {
    return {};
  },
  created() {},
  methods: {},
  mounted() {},
};
</script>

<style lang="scss" scoped>
@import "@/styles/help.scss";
</style>
