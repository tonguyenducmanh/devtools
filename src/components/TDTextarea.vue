<template>
  <div
    class="td-textarea"
    :class="{ 'flex-col': isLabelTop, 'td-textarea-read-only': readOnly }"
    :style="styleComputed"
  >
    <div class="td-label" :class="{ 'td-label-top': isLabelTop }" v-if="label">
      {{ label.capitalize() }}
    </div>
    <div
      class="textarea-wrapper"
      :class="{ 'td-textarea-hightlight-wrap-text': wrapText }"
    >
      <!-- Editor area -->
      <div
        v-show="enableHighlight"
        class="highlight-layer"
        ref="textareaWrap"
      ></div>
      <!-- Actual textarea -->
      <textarea
        v-if="!enableHighlight"
        :placeholder="placeHolder || $t('i18nCommon.typeInput')"
        :value="modelValue"
        :disabled="readOnly"
        :style="borderRadiusStyle"
        @input="changeInputValue"
        @scroll="handleScroll"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        :class="{
          'drag-over': isDragOver,
          'fix-size': !resizeable,
          'td-textarea-nowrap-text': !wrapText,
          'with-highlight': enableHighlight,
        }"
        spellcheck="false"
        @keydown.tab.prevent="handleTab"
        :name="inputId"
        :ref="inputId"
        autocomplete="off"
        ref="textarea"
      />
    </div>
  </div>
</template>

<script>
import TDStylePremitiveMixin from "@/mixins/TDStylePremitiveMixin.js";
import * as monaco from "monaco-editor";
import TDUtility from "@/common/TDUtility.js";

export default {
  name: "TDTextarea",
  mixins: [TDStylePremitiveMixin],

  created() {},
  mounted() {
    let me = this;
    this.updateHighlight();
  },
  computed: {
    styleComputed() {
      let style = "";
      let me = this;
      if (me.width) {
        style += `width: ${me.width} !important; `;
      }
      if (me.height) {
        style += `height: ${me.height} !important; `;
      }
      return style;
    },
    inputId() {
      return `td-text-area-${this.$.uid}`;
    },
  },
  props: {
    placeHolder: {
      type: String,
      default: null,
    },
    modelValue: {
      type: String,
      default: null,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: null,
    },
    width: {
      type: String,
      default: null,
    },
    height: {
      type: String,
      default: null,
    },
    isLabelTop: {
      type: Boolean,
      default: false,
    },
    resizeable: {
      type: Boolean,
      default: false,
    },
    wrapText: {
      type: Boolean,
      default: true,
    },
    enableHighlight: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: "javascript",
    },
  },
  data() {
    return {
      value: null,
      isDragOver: false,
    };
  },
  watch: {
    modelValue(newVal, oldVal) {
      this.updateEditorVal();
    },
    enableHighlight(value, oldVal) {
      this.updateHighlight();
    },
    wrapText(value, oldVal) {
      if (this.editor) {
        this.editor.updateOptions({
          wordWrap: value ? "on" : "off",
        });
      }
    },
    language(value, oldVal) {
      if (this.editor && value && oldVal && value != oldVal) {
        this.editor.updateOptions({
          language: value,
        });
      }
    },
  },
  methods: {
    focus() {
      let me = this;
      me.$refs[me.inputId].focus();
    },
    changeInputValue(e) {
      let me = this;
      me.$emit("update:modelValue", e.target.value);
    },
    handleDragOver(e) {
      let me = this;
      e.preventDefault();
      me.isDragOver = true;
    },
    handleDragLeave(e) {
      let me = this;
      e.preventDefault();
      me.isDragOver = false;
    },
    handleDrop(e) {
      let me = this;
      e.preventDefault();
      me.isDragOver = false;
      me.$emit("dropValue", e);
    },
    handleTab(e) {
      const TAB_SIZE = "  ";
      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;

      const newValue =
        el.value.slice(0, start) + TAB_SIZE + el.value.slice(end);

      this.$emit("update:modelValue", newValue);

      this.$nextTick(() => {
        el.selectionStart = el.selectionEnd = start + TAB_SIZE.length;
      });
    },
    handleScroll(e) {},
    getDefaultModelValueForEditor() {
      let me = this;
      let editorVal = me.modelValue;
      return editorVal;
    },
    async updateHighlight() {
      let me = this;
      if (me.enableHighlight) {
        me.currentTheme = await me.$tdCache.get(me.$tdEnum.cacheConfig.Theme);
        monaco.languages.register({ id: me.language });
        me.editorModel = monaco.editor.createModel(
          me.getDefaultModelValueForEditor(),
          me.language
        );
        let configObject = {
          model: me.editorModel,
          language: me.language,
          theme: me.currentTheme == me.$tdEnum.theme.dark ? "vs-dark" : "vs",
          fontSize: 16,
          readOnly: me.readOnly,
          automaticLayout: true,
        };
        if (me.wrapText) {
          configObject.wordWrap = "on";
          configObject.wordWrapColumn = 0;
          configObject.wrappingIndent = "none";
        }
        me.editor = monaco.editor.create(me.$refs.textareaWrap, configObject);
        me.editor.onDidBlurEditorWidget((e) => {
          me.updateValToEditor();
        });
      } else {
        me.unmountEditor();
      }
    },
    updateEditorVal: TDUtility.debounce(function () {
      if (this.editor) {
        this.editor.setValue(this.modelValue ? this.modelValue : "");
      }
    }, 100),
    updateValToEditor: TDUtility.debounce(function () {
      this.updateValueFromEditor(true);
    }, 100),
    updateValueFromEditor(fromEditor = false) {
      let me = this;
      if (me.editor) {
        let editorVal = me.editor.getValue();
        me.$emit("update:modelValue", editorVal);
      }
    },
    unmountEditor() {
      let me = this;
      if (me.editor) {
        me.updateValueFromEditor();
        me.editor.dispose();
      }
      if (me.editorModel) {
        me.editorModel.dispose();
      }
      me.editor = null;
      me.editorModel = null;
    },
  },
  beforeUnmount() {
    this.unmountEditor();
  },
};
</script>

<style lang="scss" scoped>
.td-textarea {
  display: flex;
  height: 100%;
  width: 100%;

  .td-label {
    overflow-wrap: normal;
    word-break: keep-all;
    white-space: nowrap;
    padding-right: var(--padding);
    font-size: var(--font-size-l-medium);
  }

  .td-label-top {
    padding-bottom: var(--padding);
  }

  .textarea-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .highlight-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    overflow: hidden;
  }

  textarea {
    position: relative;
    border: 1px solid var(--border-color);
    width: 100%;
    height: 100%;
    padding: var(--padding);
    border-radius: var(--border-radius);
    background-color: var(--bg-thirt-color);
    color: var(--text-primary-color);
    font-size: var(--font-size-medium);
    font-family: "Consolas", "Monaco", "Courier New", monospace;
    line-height: 1.5;
  }

  textarea::placeholder {
    color: var(--text-secondary-color);
  }

  .td-textarea-nowrap-text {
    white-space: pre;
    overflow-x: auto;
    overflow-y: auto;
  }

  textarea:focus {
    outline: none;
    border: 1px solid var(--focus-color);
  }

  .drag-over {
    outline: 2px dashed black;
    background-color: rgba(100, 100, 100, 0.6);
  }

  .fix-size {
    resize: none;
  }
}

.td-textarea-read-only textarea {
  background-color: var(--bg-layer-color);
  border: 1px solid transparent;
}
.td-textarea-read-only {
  .highlight-layer {
    background-color: var(--bg-layer-color);
    border: 1px solid transparent;
  }
}
</style>
