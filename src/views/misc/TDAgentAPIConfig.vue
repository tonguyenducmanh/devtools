<template>
  <div class="flex td-agent-download">
    <TDButton
      v-tooltip="$t('i18nCommon.apiTesting.toolTipDownloadAgent')"
      :noMargin="true"
      @click="downloadAgent"
      :type="$tdEnum.buttonType.secondary"
      :label="$t('i18nCommon.apiTesting.downloadAgent')"
    ></TDButton>
    <TDInput
      v-model="agentURL"
      v-tooltip="$t('i18nCommon.apiTesting.tooltipUrlAgent')"
      :noMargin="true"
      :placeHolder="$t('i18nCommon.apiTesting.agentUrl')"
    />
    <TDButton
      :noMargin="true"
      @click="heathCheck"
      :type="$tdEnum.buttonType.secondary"
      :label="$t('i18nCommon.ping')"
    ></TDButton>
  </div>
</template>

<script>
import TDCURLUtil from "@/common/api/CURLHandle/TDCURLUtil.js";
import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";
export default {
  name: "TDAgentAPIConfig",
  components: {},
  computed: {},
  created() {
    let me = this;
    me.handleChangeAgentURL();
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
    async heathCheck() {
      let me = this;
      me.handleChangeAgentURL();
      try {
        let res = await new TDAgentAPI().heathCheck();
        if (res && res.success && res.data) {
          me.$tdToast.success(res.data);
        } else {
          me.$tdToast.success(res);
        }
      } catch (ex) {
        me.$tdUtility.showErrorNotFoundAgentServer();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.td-agent-download {
  gap: var(--padding);
}
</style>
