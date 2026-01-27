<template>
  <div class="flex td-agent-download">
    <TDInput
      v-model="agentURL"
      v-tooltip="$t('i18nCommon.apiTesting.tooltipUrlAgent')"
      :noMargin="true"
      :placeHolder="$t('i18nCommon.apiTesting.agentUrl')"
    />
    <TDButton
      v-tooltip="$t('i18nCommon.apiTesting.toolTipDownloadAgent')"
      :noMargin="true"
      @click="downloadAgent"
      :type="$tdEnum.buttonType.secondary"
      :label="$t('i18nCommon.apiTesting.downloadAgent')"
    ></TDButton>
  </div>
</template>

<script>
import TDCURLUtil from "@/common/api/TDCURLUtil";

export default {
  name: "TDAgentAPIConfig",
  components: {},
  computed: {},
  created() {
    let me = this;
  },
  mounted() {},
  beforeUnmount() {},
  props: {},
  data() {
    let me = this;
    return {
      agentURL: window.__env?.APITesting?.agentServer,
    };
  },
  watch: {
    agentURL(oldURL, newURL) {
      let me = this;
      if (oldURL != newURL) {
        me.handleChangeAgentURL();
      }
    },
  },
  methods: {
    handleChangeAgentURL() {
      let me = this;
      TDCURLUtil.setGlobalInfoBeforeRequest({
        agentURL: me.agentURL,
      });
    },
    downloadAgent() {
      let me = this;
      me.$tdUtility.goToSource("releases");
    },
  },
};
</script>

<style lang="scss" scoped>
.td-agent-download {
  gap: var(--padding);
}
</style>
