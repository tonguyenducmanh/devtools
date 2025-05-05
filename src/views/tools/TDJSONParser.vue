<template>
  <div class="container">
    <div class="title">Convert JSON sang object đệ quy!</div>
    <div class="flex flex-wrap io-section">
      <TDTextarea
        placeHolder="JSON muốn chuyển sang Object"
        v-model="jsonSource"
        height="400px"
        width="500px"
      ></TDTextarea>
      <TDTextarea
        v-if="isShowSelectedNode"
        placeHolder="Node đang chọn"
        v-model="jsonSelected"
        height="400px"
        :readOnly="true"
        width="500px"
      ></TDTextarea>
      <div class="flex">
        <div>
          <TDCheckbox
            v-model="isRecusive"
            label="Xử lý JSON parse đệ quy object"
            @input="handleJSONToObject"
          ></TDCheckbox>
          <TDCheckbox
            v-model="showCollapseButton"
            label="hiển thị icon thu gọn object"
          ></TDCheckbox>
          <TDCheckbox
            v-model="showLineNumber"
            label="hiển thị số dòng"
          ></TDCheckbox>
          <TDCheckbox
            v-model="showLengthWhenCollapsed"
            label="hiển thị số key/phần tử"
          ></TDCheckbox>
          <TDCheckbox
            v-model="showVirtualScroll"
            label="hiển thị thanh cuộn"
          ></TDCheckbox>
          <TDCheckbox
            v-model="isShowSelectedNode"
            label="hiển thị node đang chọn"
          ></TDCheckbox>
          <TDCheckbox
            v-model="isShowSelectedPath"
            label="hiển thị fullpath node đang chọn"
          ></TDCheckbox>
        </div>
        <div>
          <TDButton
            @click="handleJSONToObject"
            label="JSON to Object"
          ></TDButton>
          <TDButton
            @click="applyMock"
            :type="$tdEnum.buttonType.secondary"
            label="Example"
          ></TDButton>
          <TDButton
            @click="handleCopyEvent(jsonSelected)"
            :type="$tdEnum.buttonType.secondary"
            label="Copy selected node"
          ></TDButton>
          <TDButton
            @click="handleCopyEvent(JSON.stringify(jsonSource))"
            :type="$tdEnum.buttonType.secondary"
            label="Copy source stringify"
          ></TDButton>
          <TDButton
            @click="toggleAllNode"
            :type="$tdEnum.buttonType.secondary"
            label="Toggle all node"
          ></TDButton>
        </div>
      </div>
    </div>
    <div v-if="isShowSelectedPath">
      <div class="td-fullpath" v-if="isShowSelectedPath && fullPath">
        Node đang chọn: {{ fullPath }}
      </div>
      <div class="td-fullpath" v-else>Chưa chọn node nào</div>
    </div>
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
        @nodeClick="changeNodeItem"
      />
    </div>
  </div>
</template>
<script>
import VueJsonPretty from "vue-json-pretty";
import { TDJSONParserMock } from "@/mock/mock.js";
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
  },
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {
    let me = this;
    me.currentTheme = me.$tdCache.get(me.$tdEnum.cacheConfig.theme) ?? "light";
  },
  methods: {
    toggleAllNode() {
      let me = this;
      me.isShowLevelMax = !me.isShowLevelMax;
    },
    handleCopyEvent(value) {
      let me = this;
      me.$tdUtility.copyToClipboard(value);
    },
    applyMock() {
      let me = this;
      me.$tdUtility.applyMock(me, TDJSONParserMock);
    },
    handleJSONToObject() {
      let me = this;

      if (!me.isRecusive) {
        me.objectSource = JSON.parse(me.jsonSource);
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
  min-height: 100vh;
  box-shadow: none;
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
  border: 2px dashed var(--bg-active-color);
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
</style>
