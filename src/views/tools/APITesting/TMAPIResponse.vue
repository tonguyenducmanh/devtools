<template>
  <div class="flex flex-col response-loading" v-if="isLoading">
    <TMLoading />
  </div>
  <div v-else class="tm-text-area-wrap">
    <TMTextEditor
      v-if="responsePanelOption == $tmEnum.APIInfoOption.body"
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
        <TMAPIPanelSwitcher
          :currentOption="responsePanelOption"
          :headerOption="$tmEnum.APIInfoOption.header"
          :bodyOption="$tmEnum.APIInfoOption.body"
          :isResponse="true"
          @change="changeToViewResponsePanel"
        >
          <template v-slot:right>
            <TMAPIResponseStatus
              class="flex"
              :statusCode="statusCode"
              :responseTime="responseTime"
            />
          </template>
        </TMAPIPanelSwitcher>
      </template>
    </TMTextEditor>
    <TMTextEditor
      v-if="responsePanelOption == $tmEnum.APIInfoOption.header"
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
        <TMAPIPanelSwitcher
          :currentOption="responsePanelOption"
          :headerOption="$tmEnum.APIInfoOption.header"
          :bodyOption="$tmEnum.APIInfoOption.body"
          :isResponse="true"
          @change="changeToViewResponsePanel"
        >
          <template v-slot:right>
            <TMAPIResponseStatus
              class="flex"
              :statusCode="statusCode"
              :responseTime="responseTime"
            />
          </template>
        </TMAPIPanelSwitcher>
      </template>
    </TMTextEditor>
  </div>
</template>
<script>
import TMAPIResponseStatus from "./TMAPIResponseStatus.vue";
import TMAPIPanelSwitcher from "@/views/tools/APITesting/TMAPIPanelSwitcher.vue";
export default {
  name: "TMAPIResponse",
  data() {
    return {};
  },
  components: { TMAPIResponseStatus, TMAPIPanelSwitcher },
  // Không tự sửa currentConfigLayout của cha, chỉ báo lên để cha ghi cache layout
  emits: ["change"],
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
    /**
     * Panel response đang mở.
     * Cache cũ hoặc config bị thiếu field này thì mặc định xem body,
     * tránh trường hợp không panel nào render được.
     */
    responsePanelOption() {
      let me = this;
      let option = me.currentConfigLayout?.currentAPIResponseInfoOption;
      let isValid = [
        me.$tmEnum.APIInfoOption.header,
        me.$tmEnum.APIInfoOption.body,
      ].includes(option);
      return isValid ? option : me.$tmEnum.APIInfoOption.body;
    },
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
      this.$emit("change", option);
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
.tm-text-area-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
