<template>
  <div class="flex flex-col response-loading" v-if="isLoading">
    <div class="loader"></div>
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
      label="Response"
      :readOnly="true"
      :wrapText="currentConfigLayout.wrapText"
    >
      <template v-slot:header-main>
        <div class="flex td-header-options">
          <span
            v-if="responseHeadersText"
            class="td-header-option"
            @click="changeToViewHeaderResponse"
            >{{ $t("i18nCommon.apiTesting.changeToViewHeaderResponse") }}</span
          >
          <span class="td-header-option active">{{
            $t("i18nCommon.apiTesting.changeToViewBodyResponse")
          }}</span>
        </div>
      </template>
      <template v-slot:footer-main>
        <TDAPIResponseStatus
          class="flex"
          :statusCode="statusCode"
          :responseTime="responseTime"
        />
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
      label="Response"
      :readOnly="true"
      :wrapText="currentConfigLayout.wrapText"
    >
      <template v-slot:header-main>
        <div class="flex td-header-options">
          <span class="td-header-option active">{{
            $t("i18nCommon.apiTesting.changeToViewHeaderResponse")
          }}</span>
          <span class="td-header-option" @click="changeToViewBodyResponse">{{
            $t("i18nCommon.apiTesting.changeToViewBodyResponse")
          }}</span>
        </div>
      </template>
      <template v-slot:footer-main>
        <TDAPIResponseStatus
          class="flex"
          :statusCode="statusCode"
          :responseTime="responseTime"
        />
      </template>
    </TDTextEditor>
  </div>
</template>
<script>
import TDAPIResponseStatus from "./TDAPIResponseStatus.vue";
export default {
  name: "TDAPIResponse",
  data() {
    return {};
  },
  components: { TDAPIResponseStatus },
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
    changeToViewHeaderResponse() {
      this.currentConfigLayout.currentAPIResponseInfoOption =
        this.$tdEnum.APIInfoOption.header;
    },
    changeToViewBodyResponse() {
      this.currentConfigLayout.currentAPIResponseInfoOption =
        this.$tdEnum.APIInfoOption.body;
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
  .td-top-right-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    border: 1px solid var(--bg-layer-color);
    padding: var(--padding);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    background-color: rgba(255, 255, 255, 0.206);
  }
  .td-top-right-btn:hover {
    cursor: pointer;
    background-color: var(--bg-main-color);
    color: var(--focus-color);
  }
}
body[data-theme="dark"] {
  .td-top-right-btn:hover {
    cursor: pointer;
    background-color: var(--bg-layer-color);
  }
  .td-top-right-btn {
    border: 1px solid var(--bg-main-color);
  }
  .td-top-right-btn div {
    filter: invert(100);
  }
}
.td-header-options {
  gap: var(--padding);
}
.td-header-option {
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.15s;
}
.td-header-option.active {
  opacity: 1;
  font-weight: 600;
}
</style>
