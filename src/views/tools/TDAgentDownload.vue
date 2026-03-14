<template>
  <div class="td-agent-download">
    <div class="redirect-message">
      <p>{{ $t("i18nCommon.feature.agentDownload.title") }} - {{ $t("i18nCommon.feature.agentDownload.redirecting") }}</p>
      <a :href="agentUrl" target="_blank" class="redirect-link">
        {{ $t("i18nCommon.feature.agentDownload.clickHere") }}
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDAgentDownload",
  computed: {
    agentUrl() {
      return window.__env?.githubSource?.url || "https://github.com/tonguyenducmanh/devtools";
    },
  },
  mounted() {
    window.open(this.agentUrl, "_blank").focus();
  },
};
</script>

<style lang="scss" scoped>
.td-agent-download {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .redirect-message {
    text-align: center;
    color: var(--text-secondary-color);
    display: flex;
    flex-direction: column;
    gap: var(--padding);
    
    .redirect-link {
      color: var(--primary-color);
      text-decoration: underline;
      cursor: pointer;
      
      &:hover {
        color: var(--primary-color-hover);
      }
    }
  }
}
</style>
