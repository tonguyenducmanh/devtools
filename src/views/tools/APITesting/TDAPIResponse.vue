<template>
  <div class="flex flex-col response-loading" v-if="isLoading">
    <div class="loader"></div>
  </div>
  <div v-else class="td-text-area-wrap">
    <TDTextarea
      :isLabelTop="true"
      :modelValue="responseText"
      :enableHighlight="APIConfigLayout.enableHighlight"
      language="json"
      :placeHolder="$t('i18nCommon.apiTesting.responsePlaceholder')"
      :readOnly="true"
      :wrapText="APIConfigLayout.wrapText"
    ></TDTextarea>
    <span
      v-if="!APIConfigLayout.enableHighlight"
      class="no-select td-top-right-btn"
    >
      <div
        class="td-icon td-copy-icon"
        @click="handleCopyResponse"
        v-tooltip="$t('i18nCommon.apiTesting.copyResponse')"
      ></div>
    </span>
  </div>
</template>
<script>
export default {
  name: "TDAPIResponse",
  data() {
    return {};
  },
  props: {
    isLoading: {
      type: Boolean,
      default: false,
    },
    responseText: {
      type: String,
      default: null,
    },
    APIConfigLayout: {
      type: Object,
      default: {},
    },
  },
  computed: {},
  methods: {
    handleCopyResponse() {
      if (this.responseText) {
        this.$tdUtility.copyToClipboard(this.responseText);
      }
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
</style>
