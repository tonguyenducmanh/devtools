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
import {
  registerAllMonacoThemes,
  getMonacoSyntaxRules,
} from "@/components/monarch/TDMonacoTheme.js";
import { IQuickInputService } from "monaco-editor/esm/vs/platform/quickinput/common/quickInput.js";
import { StandaloneServices } from "monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js";
import _ from "@/common/TDCommonFunction.js";

export default {
  name: "TDTextarea",
  mixins: [TDStylePremitiveMixin],

  created() {
    // để hạn chế làm đơ trình duyệt, thêm debounce để xử lý update model value sau khi người dùng delay nhập
    // monacoeditor và v-model hoạt động song song với nhau
    this.debounceUpdateEditorVal = _.debounce(this.updateEditorVal, 100);
    this.debounceUpdateValToEditor = _.debounce(this.updateValToEditor, 100);
  },
  beforeUnmount() {
    if (this.debounceUpdateEditorVal?.cancel) {
      this.debounceUpdateEditorVal.cancel();
    }
    if (this.debounceUpdateValToEditor?.cancel) {
      this.debounceUpdateValToEditor.cancel();
    }
  },
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
    monacoOptions: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      value: null,
      monacoThemeName: null,
    };
  },
  watch: {
    modelValue(newVal, oldVal) {
      this.debounceUpdateEditorVal();
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
        monaco.editor.setModelLanguage(this.editorModel, value);
      }
    },
  },
  methods: {
    focus() {
      let me = this;
      if (me.$refs[me.inputId]) {
        me.$refs[me.inputId].focus();
      }
    },
    changeInputValue(e) {
      let me = this;
      me.$emit("update:modelValue", e.target.value);
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

    /**
     * Lấy ra rule theme custom theo 1 số loại ngôn ngữ
     */
    getRuleThemeMonacoEditorByLanguage() {
      let me = this;
      let rules = [];
      if (me.language === "pgsql" && me.monacoThemeName) {
        rules = getMonacoSyntaxRules(me.monacoThemeName);
      }
      return rules;
    },

    /**
     * lấy theme mặc định dựa theo app theme
     */
    getDefaultMonacoTheme() {
      return this.currentTheme == this.$tdEnum.theme.dark ? "vs-dark" : "vs";
    },

    /**
     * áp dụng theme monaco và lưu vào cache
     */
    async selectMonacoTheme(themeName) {
      let me = this;
      me.monacoThemeName = themeName;
      if (me.editor) {
        monaco.editor.setTheme(themeName);
      }
      await me.$tdUtility.setMonacoTheme(themeName);
    },

    /**
     * Bật chế độ highlight synctax (chuyển sang sử dụng monaco editor)
     * Thì sẽ gọi 1 số api của thư viện để update syntax, theme, ...
     */
    async updateHighlight() {
      let me = this;
      if (me.enableHighlight) {
        me.currentTheme = await me.$tdUtility.getUserSettings("theme");
        monaco.languages.register({ id: me.language });

        // đăng ký toàn bộ theme monaco một lần
        registerAllMonacoThemes(monaco);

        // load theme từ cache, nếu null thì dùng default theo app theme
        let cachedTheme = await me.$tdUtility.getMonacoTheme();
        me.monacoThemeName = cachedTheme || me.getDefaultMonacoTheme();
        monaco.editor.setTheme(me.monacoThemeName);

        me.editorModel = monaco.editor.createModel(
          me.getDefaultModelValueForEditor(),
          me.language,
        );
        let configObject = {
          model: me.editorModel,
          language: me.language,
          theme: me.monacoThemeName,
          fontSize: 16,
          fontFamily:
            'ui-monospace, "Fira Code", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          readOnly: me.readOnly,
          automaticLayout: true,
          "semanticHighlighting.enabled": true,
        };
        if (me.wrapText) {
          configObject.wordWrap = "on";
          configObject.wordWrapColumn = 0;
          configObject.wrappingIndent = "none";
        }
        me.editor = monaco.editor.create(me.$refs.textareaWrap, configObject);

        // đăng ký command đổi theme (context menu + keyboard)
        me.editor.addAction({
          id: "td-change-monaco-theme",
          label: me.$t("i18nCommon.changeMonacoTheme"),
          contextMenuGroupId: "change_theme",
          contextMenuOrder: 1,
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
          run: function () {
            try {
              var quickInputService =
                StandaloneServices.get(IQuickInputService);
              var quickPick = quickInputService.createQuickPick();
              quickPick.items = me.$tdEnum.monacoThemeList.map(function (t) {
                return { label: t.label, id: t.value };
              });
              quickPick.activeItems = quickPick.items.filter(function (i) {
                return i.id === me.monacoThemeName;
              });
              quickPick.canSelectMany = false;
              quickPick.onDidAccept(function () {
                var selected = quickPick.selectedItems[0];
                if (selected) {
                  me.selectMonacoTheme(selected.id);
                }
                quickPick.dispose();
              });
              quickPick.onDidHide(function () {
                quickPick.dispose();
              });
              quickPick.show();
            } catch (_e) {
              var input = window.prompt(
                "Enter theme name\n" +
                  me.$tdEnum.monacoThemeList
                    .map(function (t) {
                      return t.value;
                    })
                    .join(", "),
                me.monacoThemeName,
              );
              if (input && input.trim()) {
                me.selectMonacoTheme(input.trim());
              }
            }
          },
        });

        // Lắng nghe sự kiện phím tắt từ cấu hình cha truyền xuống
        if (me.monacoOptions && typeof me.monacoOptions.onInit === "function") {
          me.monacoOptions.onInit(me.editor, monaco);
        }
        me.editor.onDidBlurEditorWidget(function () {
          me.debounceUpdateValToEditor();
        });
      } else {
        me.unmountEditor();
      }
    },
    updateEditorVal() {
      if (this.editor) {
        const newVal = this.modelValue ? this.modelValue : "";
        if (this.editor.getValue() !== newVal) {
          this.editor.setValue(newVal);
        }
      }
    },
    updateValToEditor() {
      this.updateValueFromEditor(true);
    },

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
    background-color: var(--bg-layer-color);
    padding: var(--padding-medium);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-component);
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
