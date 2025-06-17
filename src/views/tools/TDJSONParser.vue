<template>
  <div class="container">
    <div class="title">{{ $t("i18nCommon.jsonParser.title") }}</div>
    <div class="flex">
      <div>
        <div>
          <TDTextarea
            :placeHolder="$t('i18nCommon.jsonParser.inputPlaceholder')"
            v-model="jsonSource"
            resizeable
          ></TDTextarea>
        </div>
        <div class="">
          <div class="flex" v-if="isShowConfigLib">
            <TDCheckbox
              v-model="isRecusive"
              :label="$t('i18nCommon.jsonParser.recursiveParser')"
              @input="handleJSONToObject"
            ></TDCheckbox>
            <TDCheckbox
              v-model="showCollapseButton"
              :label="$t('i18nCommon.jsonParser.showCollapseIcon')"
            ></TDCheckbox>
            <TDCheckbox
              v-model="showLineNumber"
              :label="$t('i18nCommon.jsonParser.showLineNumber')"
            ></TDCheckbox>
            <TDCheckbox
              v-model="showLengthWhenCollapsed"
              :label="$t('i18nCommon.jsonParser.showLength')"
            ></TDCheckbox>
            <TDCheckbox
              v-model="showVirtualScroll"
              :label="$t('i18nCommon.jsonParser.showScroll')"
            ></TDCheckbox>

            <TDCheckbox
              v-model="isShowSelectedPath"
              :label="$t('i18nCommon.jsonParser.showFullPath')"
            ></TDCheckbox>
          </div>
          <div class="flex">
            <TDCheckbox
              v-model="isShowSelectedNode"
              :label="$t('i18nCommon.jsonParser.showSelectedNode')"
            ></TDCheckbox>
            <TDButton
              @click="handleJSONToObject"
              :label="$t('i18nCommon.jsonParser.convertButton')"
            ></TDButton>
            <TDButton
              @click="applyMock"
              :type="$tdEnum.buttonType.secondary"
              :label="$t('i18nCommon.jsonParser.example')"
            ></TDButton>
            <TDButton
              @click="handleCopyEvent(jsonSelected)"
              :type="$tdEnum.buttonType.secondary"
              :label="$t('i18nCommon.jsonParser.copySelected')"
            ></TDButton>
            <TDButton
              @click="handleCopyEvent(JSON.stringify(jsonSource))"
              :type="$tdEnum.buttonType.secondary"
              :label="$t('i18nCommon.jsonParser.copyStringify')"
            ></TDButton>
            <TDButton
              @click="toggleAllNode"
              :type="$tdEnum.buttonType.secondary"
              :label="$t('i18nCommon.jsonParser.toggleNode')"
            ></TDButton>
          </div>
        </div>
      </div>
    </div>
    <div ref="resultBox" class="flex td-result">
      <div class="td-pretty-box">
        <VueJsonPretty
          v-if="objectSource"
          :theme="currentTheme"
          v-model:selectedValue="selectedValue"
          :showLineNumber="showLineNumber"
          :virtual="showVirtualScroll"
          :showLength="showLengthWhenCollapsed"
          :deep="nodeLevelMax"
          :showIcon="showCollapseButton"
          :data="objectSource"
          selectableType="single"
          :height="computedHeightPrettyBox"
          @nodeClick="changeNodeItem"
        />
      </div>
      <TDTextarea
        v-if="isShowSelectedNode && objectSource"
        :placeHolder="$t('i18nCommon.jsonParser.selectedNode')"
        v-model="jsonSelected"
        :readOnly="true"
        width="500px"
      ></TDTextarea>
    </div>
    <div v-if="isShowSelectedPath">
      <div class="td-fullpath" v-if="isShowSelectedPath && fullPath">
        {{ $t("i18nCommon.jsonParser.selectedNode") }}: {{ fullPath }}
      </div>
      <div class="td-fullpath" v-else>
        {{ $t("i18nCommon.jsonParser.noSelection") }}
      </div>
    </div>
  </div>
</template>
<script>
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
export default {
  name: "TDJSONParser",
  components: { VueJsonPretty },
  computed: {
    nodeLevelMax() {
      let me = this;
      if (me.isShowLevelMax) {
        return 99999;
      } else {
        // không show mọi level mặc định chỉ show level 1
        return 1;
      }
    },
    isShowConfigLib() {
      let me = this;
      let result = false;
      if (window.__env && window.__env.jsonParser) {
        result = window.__env.jsonParser.showConfigLib;
      }
      return result;
    },
    computedHeightPrettyBox() {
      let me = this;
      let result = 600;
      if (me.$refs && me.$refs.resultBox) {
        let boucing = me.$refs.resultBox.getBoundingClientRect();
        console.log(boucing);
        if (boucing && boucing.height) {
          result = boucing.height - 10;
        }
      }
      return result;
    },
  },
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
    this.$tdEventBus.off(
      this.$tdEnum.eventGlobal.changeTheme,
      this.changeThemeEvent
    );
  },
  mounted() {
    let me = this;
    me.processWhenMounted();
  },
  methods: {
    async processWhenMounted() {
      let me = this;
      me.currentTheme =
        (await me.$tdCache.get(me.$tdEnum.cacheConfig.Theme)) ?? "light";
      this.$tdEventBus.on(
        this.$tdEnum.eventGlobal.changeTheme,
        this.changeThemeEvent
      );
    },
    changeThemeEvent(data, options) {
      let me = this;
      if (data) {
        me.currentTheme = data;
      }
    },
    toggleAllNode() {
      let me = this;
      me.isShowLevelMax = !me.isShowLevelMax;
    },
    handleCopyEvent(value) {
      let me = this;
      me.$tdUtility.copyToClipboard(value);
    },
    async applyMock() {
      // Lazy-load module
      const { TDMockJSONParser } = await import(
        /* webpackChunkName: "mock-json-parser" */
        "@/common/mock/TDMockJSONParser.js"
      );
      this.$tdUtility.applyMock(this, TDMockJSONParser);
    },
    handleJSONToObject() {
      let me = this;

      if (!me.isRecusive) {
        let temp = JSON.parse(me.jsonSource);
        // trường hợp không muốn đệ quy, nhưng vẫn muốn parse ra object mà còn parse được 1 lần thì parse nốt
        try {
          me.objectSource = JSON.parse(temp);
        } catch (error) {
          me.objectSource = temp;
        }
      } else {
        me.objectSource = me.deepJSONParse(me.jsonSource);
      }
    },
    isJSON(str) {
      if (typeof str !== "string") return false;
      try {
        JSON.parse(str);
        return true;
      } catch {
        return false;
      }
    },
    deepJSONParse(value) {
      let me = this;
      let result = value;

      // Nếu là string, thử parse liên tục đến khi không parse được nữa
      while (typeof result === "string" && me.isJSON(result)) {
        result = JSON.parse(result);
      }

      // Nếu là mảng thì duyệt từng phần tử
      if (Array.isArray(result)) {
        result = result.map(me.deepJSONParse);
      }
      // Nếu là object thì đệ quy từng key
      else if (typeof result === "object" && result !== null) {
        for (const key in result) {
          result[key] = me.deepJSONParse(result[key]);
        }
      }

      return result;
    },
    changeNodeItem(val) {
      let me = this;
      if (val && val.path && val.path.startsWith("root")) {
        me.fullPath = val.path;
        if (me.fullPath == "root" || !me.fullPath) {
          me.jsonSelected = JSON.stringify(me.objectSource);
        } else {
          let subPath = me.fullPath.replace("root.", "");
          if (subPath && subPath.startsWith("root")) {
            subPath = me.fullPath.replace("root", "");
          }
          let valueCurrent = me.$tdUtility.getValueByPath(
            me.objectSource,
            subPath
          );
          if (valueCurrent) {
            me.jsonSelected = JSON.stringify(valueCurrent);
          } else {
            me.jsonSelected = valueCurrent;
          }
        }
      }
    },
  },
  data() {
    return {
      jsonSource: null,
      jsonSelected: null,
      objectSource: null,
      isRecusive: true,
      isShowSelectedNode: true,
      isShowLevelMax: false,
      selectedValue: null,
      showCollapseButton: true,
      showLineNumber: true,
      showLengthWhenCollapsed: true,
      showVirtualScroll: true,
      isShowSelectedPath: true,
      fullPath: null,
      currentTheme: "light", // library support "dark", "light"
    };
  },
};
</script>
<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;
  padding: 2rem;
  border-radius: 0;

  box-shadow: none;
  display: flex;
  flex-direction: column;
}
.paste-box {
  column-gap: 20px;
  padding: var(--padding);
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}
.io-section {
  column-gap: 20px;
}
.drop-zone {
  min-width: 500px;
  max-width: 500px;
  min-height: 400px;
  max-height: 400px;
  border: 1px dashed var(--bg-active-color);
  padding: 1.5rem;
  text-align: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-zone:hover {
  border-color: var(--focus-color);
  background-color: var(--bg-hover-color);
}

.drop-zone p {
  color: #666;
}

.preview {
  width: 500px;
  height: auto;
  padding: var(--padding);
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.result-container {
  display: flex;
}
.td-fullpath {
  padding: var(--padding);
}
.td-result {
  width: 100%;
  height: 100%;
  .td-pretty-box {
    flex: 1;
  }
}
</style>
