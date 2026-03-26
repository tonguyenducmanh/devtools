<template>
  <div
    class="td-textarea"
    :class="{ 'flex-col': isLabelTop, 'td-textarea-read-only': readOnly }"
    :style="styleComputed"
  >
    <div
      class="td-label"
      :class="{
        'td-label-top': isLabelTop && !enableHighlight,
        'td-label-editor': enableHighlight,
      }"
      v-if="label"
    >
      {{ label.capitalize() }}
    </div>
    <div
      class="textarea-wrapper"
      :class="{ 'td-textarea-hightlight-wrap-text': wrapText }"
    >
      <!-- Editor area (Monaco) -->
      <div
        v-show="enableHighlight"
        class="highlight-layer"
        ref="textareaWrap"
      ></div>
      <!-- Plain textarea -->
      <textarea
        v-if="!enableHighlight"
        :placeholder="placeHolder || $t('i18nCommon.typeInput')"
        :value="modelValue"
        :disabled="readOnly"
        :style="borderRadiusStyle"
        @input="changeInputValue"
        @scroll="handleScroll"
        :class="{
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
import _ from "@/common/TDCommonFunction.js";
import TDShortcutAction from "@/common/TDShortcutAction.js";

export default {
  name: "TDTextarea",
  mixins: [TDStylePremitiveMixin],

  created() {
    this.debounceUpdateEditorVal = _.debounce(this.updateEditorVal, 100);
    this.debounceUpdateValToEditor = _.debounce(this.updateValToEditor, 100);
  },

  mounted() {
    this.updateHighlight();
  },

  beforeUnmount() {
    if (this.debounceUpdateEditorVal?.cancel)
      this.debounceUpdateEditorVal.cancel();
    if (this.debounceUpdateValToEditor?.cancel)
      this.debounceUpdateValToEditor.cancel();

    // Đảm bảo xóa shortcuts khi component bị destroy
    // Dùng trực tiếp unregister (không cần blurGroup vì không còn focus event nào đến sau)
    this._getShortcutNames().forEach((name) =>
      TDShortcutAction.unregister(name),
    );

    this.unmountEditor();
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
    };
  },

  watch: {
    modelValue() {
      this.debounceUpdateEditorVal();
    },
    enableHighlight() {
      this.updateHighlight();
    },
    wrapText(value) {
      if (this.editor) {
        this.editor.updateOptions({ wordWrap: value ? "on" : "off" });
      }
    },
    language(value, oldVal) {
      if (this.editor && value && oldVal && value !== oldVal) {
        monaco.editor.setModelLanguage(this.editorModel, value);
      }
    },
  },

  methods: {
    // ─── Shortcut group helpers ───────────────────────────────────────────

    /**
     * Tên các shortcut thuộc về component này (dùng inputId để unique).
     */
    _getShortcutNames() {
      return [
        `monaco-command-palette-${this.inputId}`,
        `monaco-find-${this.inputId}`,
      ];
    },

    /**
     * Shortcut configs tương ứng.
     */
    _buildShortcuts() {
      return [
        {
          name: `monaco-command-palette-${this.inputId}`,
          config: {
            key: "F1",
            labelKey: this.$t("i18nCommon.shotKey.showCommandEditor"),
            requireCtrl: false,
            isVirtual: true,
            action: null,
          },
        },
        {
          name: `monaco-find-${this.inputId}`,
          config: {
            key: "f",
            labelKey: this.$t("i18nCommon.shotKey.findTextEditor"),
            requireCtrl: true,
            isVirtual: true,
            action: null,
          },
        },
      ];
    },

    _onEditorFocus() {
      TDShortcutAction.addEvent(this.inputId, this._buildShortcuts());
    },

    _onEditorBlur() {
      TDShortcutAction.removeEvent(this.inputId, this._getShortcutNames());
      this.debounceUpdateValToEditor();
    },

    // ─── Public API ───────────────────────────────────────────────────────

    focus() {
      if (this.$refs.textarea) this.$refs.textarea.focus();
    },

    changeInputValue(e) {
      this.$emit("update:modelValue", e.target.value);
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

    handleScroll() {},

    getDefaultModelValueForEditor() {
      return this.modelValue;
    },

    async updateHighlight() {
      if (this.enableHighlight) {
        this.currentTheme = await this.$tdUtility.getUserSettings("theme");
        monaco.languages.register({ id: this.language });
        const isDarkTheme = this.currentTheme === this.$tdEnum.theme.dark;
        const myThemeName = "my-theme";
        monaco.editor.defineTheme(myThemeName, {
          base: isDarkTheme ? "vs-dark" : "vs",
          inherit: true,
          rules: [],
          colors: {
            "editor.background": isDarkTheme ? "#252525" : "#f6f6f7",
          },
        });
        monaco.editor.setTheme(myThemeName);

        this.editorModel = monaco.editor.createModel(
          this.getDefaultModelValueForEditor(),
          this.language,
        );

        const configObject = {
          model: this.editorModel,
          language: this.language,
          theme: myThemeName,
          fontSize: 16,
          fontFamily:
            'ui-monospace, "Fira Code", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          readOnly: this.readOnly,
          automaticLayout: true,
        };
        if (this.wrapText) {
          configObject.wordWrap = "on";
          configObject.wordWrapColumn = 0;
          configObject.wrappingIndent = "none";
        }

        this.editor = monaco.editor.create(
          this.$refs.textareaWrap,
          configObject,
        );

        // ── Dùng _onEditorFocus / _onEditorBlur thay vì debounce riêng ──
        this.editor.onDidBlurEditorWidget(() => this._onEditorBlur());
        this.editor.onDidFocusEditorText(() => this._onEditorFocus());
      } else {
        this.unmountEditor();
      }
    },

    updateEditorVal() {
      if (this.editor) {
        this.editor.setValue(this.modelValue ?? "");
      }
    },

    updateValToEditor() {
      this.updateValueFromEditor(true);
    },

    updateValueFromEditor() {
      if (this.editor) {
        this.$emit("update:modelValue", this.editor.getValue());
      }
    },

    unmountEditor() {
      if (this.editor) {
        this.updateValueFromEditor();
        this.editor.dispose();
      }
      if (this.editorModel) {
        this.editorModel.dispose();
      }
      this.editor = null;
      this.editorModel = null;
    },
  },
};
</script>

<style lang="scss" scoped>
.td-textarea {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;

  .td-label {
    overflow-wrap: normal;
    word-break: keep-all;
    white-space: nowrap;
    padding-right: var(--padding);
  }

  .td-label-top {
    padding-bottom: var(--padding);
  }

  .td-label-editor {
    position: absolute;
    bottom: var(--padding);
    left: var(--padding);
    z-index: 1;
    font-size: var(--font-size-medium-rare);
    color: var(--text-secondary-color);
  }

  .td-label-editor:hover {
    opacity: 0.5;
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
  }

  textarea {
    position: relative;
    border: 1px solid var(--border-color);
    width: 100%;
    height: 100%;
    padding: var(--padding);
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
