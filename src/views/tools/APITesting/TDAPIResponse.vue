<template>
  <div class="flex flex-col response-loading" v-if="isLoading">
    <TDLoading />
  </div>
  <div v-else class="td-text-area-wrap">
    <TDTextEditor
      v-if="
        currentConfigLayout.currentAPIResponseInfoOption ==
        $tdEnum.APIInfoOption.body
      "
      :isShowHeader="true"
      :modelValue="responseText"
      :enableHighlight="true"
      language="json"
      :placeHolder="$t('i18nCommon.apiTesting.responsePlaceholder')"
      :label="$t('i18nCommon.APIMocking.response')"
      :readOnly="true"
      :wrapText="currentConfigLayout.wrapText"
    >
      <template v-slot:header-main>
        <TDAPIPanelSwitcher
          :currentOption="currentConfigLayout.currentAPIResponseInfoOption"
          :headerOption="$tdEnum.APIInfoOption.header"
          :bodyOption="$tdEnum.APIInfoOption.body"
          :isResponse="true"
          @change="changeToViewResponsePanel"
        >
          <template v-slot:right>
            <TDAPIResponseStatus
              class="flex"
              :statusCode="statusCode"
              :responseTime="responseTime"
            />
          </template>
        </TDAPIPanelSwitcher>
      </template>
    </TDTextEditor>
    <TDTextEditor
      v-if="
        currentConfigLayout.currentAPIResponseInfoOption ==
        $tdEnum.APIInfoOption.header
      "
      :isShowHeader="true"
      :modelValue="responseHeadersTextDisplay"
      :enableHighlight="true"
      language="text/plan"
      :placeHolder="$t('i18nCommon.apiTesting.responseHeadersPlaceholder')"
      :label="$t('i18nCommon.APIMocking.response')"
      :readOnly="true"
      :wrapText="currentConfigLayout.wrapText"
    >
      <template v-slot:header-main>
        <TDAPIPanelSwitcher
          :currentOption="currentConfigLayout.currentAPIResponseInfoOption"
          :headerOption="$tdEnum.APIInfoOption.header"
          :bodyOption="$tdEnum.APIInfoOption.body"
          :isResponse="true"
          @change="changeToViewResponsePanel"
        >
          <template v-slot:right>
            <TDAPIResponseStatus
              class="flex"
              :statusCode="statusCode"
              :responseTime="responseTime"
            />
          </template>
        </TDAPIPanelSwitcher>
      </template>
    </TDTextEditor>
  </div>
</template>
<script>
import TDAPIResponseStatus from "./TDAPIResponseStatus.vue";
import TDAPIPanelSwitcher from "@/views/tools/APITesting/TDAPIPanelSwitcher.vue";
export default {
  name: "TDAPIResponse",
  data() {
    return {};
  },
  components: { TDAPIResponseStatus, TDAPIPanelSwitcher },
  props: {
    responseTime: {
      type: Number,
      default: null,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    responseText: {
      type: String,
      default: null,
    },
    responseHeadersText: {
      type: String,
      default: null,
    },
    currentConfigLayout: {
      type: Object,
      default: {},
    },
  },
  computed: {
    responseHeadersTextDisplay() {
      let me = this;
      if (!me.responseHeadersText) return "";
      try {
        let parsed = JSON.parse(me.responseHeadersText);
        let lines = [];
        for (let key in parsed) {
          let values = Array.isArray(parsed[key]) ? parsed[key] : [parsed[key]];
          values.forEach((val) => {
            lines.push(`${key}: ${val}`);
          });
        }
        return lines.join("\n");
      } catch {
        return me.responseHeadersText;
      }
    },
  },
  methods: {
    changeToViewResponsePanel(option) {
      this.currentConfigLayout.currentAPIResponseInfoOption = option;
    },
  },
};
</script>

<style scoped lang="scss">
.response-loading {
  width: 100%;
  height: 100%;
  background-color: var(--bg-layer-color);
  border: 1px solid transparent;
  border-radius: var(--border-radius);
}
.td-text-area-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
