<template>
  <div
    class="td-textarea"
    :class="{ 'flex-col': isLabelTop, 'td-textarea-read-only': readOnly }"
    :style="styleComputed"
  >
    <div
      class="td-label"
      :class="{
        'td-label-top': isLabelTop,
      }"
      v-if="label && !enableHighlight"
    >
      {{ label.capitalize() }}
    </div>
    <div
      class="textarea-wrapper"
      :class="{ 'td-textarea-hightlight-wrap-text': wrapText }"
    >
      <!-- Editor area -->
      <div v-show="enableHighlight" class="highlight-layer">
        <!-- Header — sibling phía trên editor wrap -->
        <div v-if="isShowHeader" class="td-monaco-header">
          <span class="td-monaco-header__group">
            <slot name="header-main" />
          </span>
        </div>
        <!-- Monaco mount point -->
        <div ref="textareaWrap" class="td-monaco-editor-wrap"></div>
        <!-- Footer — sibling của editor wrap, nằm bên dưới -->
        <div v-if="isShowFooter" class="td-monaco-footer">
          <span class="td-monaco-footer__group">
            <span v-if="label" class="td-monaco-footer__label">
              {{ label.capitalize ? label.capitalize() : label }}
            </span>
            <slot name="footer-main" />
          </span>
          <span class="td-monaco-footer__group">
            <span class="td-monaco-footer__language">{{ language }}</span>
            <span
              v-if="showCursorTextFooter"
              class="td-monaco-footer__cursor"
              >{{ footerCursorText }}</span
            >
          </span>
        </div>
      </div>
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
  monacoThemeColorMap,
} from "@/components/monarch/TDMonacoTheme.js";
import { IQuickInputService } from "monaco-editor/esm/vs/platform/quickinput/common/quickInput.js";
import { StandaloneServices } from "monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js";
import _ from "@/common/TDCommonFunction.js";

export default {
  name: "TDTextEditor",
  mixins: [TDStylePremitiveMixin],

  created() {
    // để hạn chế làm đơ trình duyệt, thêm debounce để xử lý update model value sau khi người dùng delay nhập
    // monacoeditor và v-model hoạt động song song với nhau
    this.debounceUpdateEditorVal = _.debounce(this.updateEditorVal, 100);
    this.debounceUpdateValToEditor = _.debounce(this.updateValToEditor, 100);
  },
  mounted() {
    this.updateHighlight();
  },
  activated() {
    // Khi tab được reactivate (KeepAlive), layout Monaco cần được refresh
    this.$nextTick(() => {
      if (this.editor) this.editor.layout();
    });
  },
  beforeUnmount() {
    if (this.debounceUpdateEditorVal?.cancel) {
      this.debounceUpdateEditorVal.cancel();
    }
    if (this.debounceUpdateValToEditor?.cancel) {
      this.debounceUpdateValToEditor.cancel();
    }
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
    isShowFooter: {
      type: Boolean,
      default: true,
    },
    isShowHeader: {
      type: Boolean,
      default: false,
    },
    showCursorTextFooter: {
      type: Boolean,
      default: false,
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
      footerCursorText: "Ln 1, Col 1",
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
      return this.currentTheme == this.$tdEnum.theme.dark
        ? "catppuccin-dark"
        : "catppuccin-light";
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
      me._applyMonacoThemeCssVars(themeName);
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
        me._applyMonacoThemeCssVars(me.monacoThemeName);

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
        // Tạo inner div để Monaco mount vào — footer sẽ là sibling bên ngoài
        if (!me.$refs.textareaWrap) {
          return;
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

        // cập nhật cursor position trên footer mỗi khi con trỏ di chuyển
        me.editor.onDidChangeCursorPosition(function (e) {
          me.updateFooterCursorPosition(e.position);
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
    updateFooterCursorPosition(position) {
      if (position) {
        this.footerCursorText = `Ln ${position.lineNumber}, Col ${position.column}`;
      }
    },

    /**
     * Set CSS vars --td-monaco-footer-bg / --td-monaco-footer-fg lên :root
     * theo theme đang được chọn — tất cả instance footer đều cập nhật theo
     */
    _applyMonacoThemeCssVars(themeName) {
      const colors = monacoThemeColorMap[themeName];
      if (!colors) return;
      const root = document.documentElement;
      root.style.setProperty("--td-monaco-footer-bg", colors.bg);
      root.style.setProperty("--td-monaco-footer-fg", colors.fg);
    },

    unmountEditor() {
      let me = this;
      if (me.editor) {
        // Gỡ bỏ layout listener
        if (me._layoutChangeDisposable) {
          me._layoutChangeDisposable.dispose();
          me._layoutChangeDisposable = null;
        }
        // Gỡ bỏ footer widget trước khi dispose editor
        if (me._footerWidget) {
          try {
            me.editor.removeOverlayWidget(me._footerWidget);
          } catch (_) {}
          me._footerWidget = null;
        }
        me.updateValueFromEditor();
        me.editor.dispose();
      }
      // Gỡ editor mount el
      if (me.editorModel) {
        me.editorModel.dispose();
      }
      me.editor = null;
      me.editorModel = null;
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
    display: flex;
    flex-direction: column;

    // Monaco mount point — chiếm hết chiều cao còn lại
    .td-monaco-editor-wrap {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      position: relative;
    }

    // Header — sibling phía trên editor wrap
    .td-monaco-header {
      flex-shrink: 0;
      height: 22px;
      display: flex;
      align-items: center;
      padding: 0 10px;
      gap: 12px;
      font-size: 12px;
      font-family: "Consolas", "Monaco", monospace;
      user-select: none;
      box-sizing: border-box;
      width: 100%;
      background-color: var(--td-monaco-footer-bg);
      color: var(--td-monaco-footer-fg);
      border-bottom: 1px solid
        color-mix(
          in srgb,
          var(--td-monaco-footer-bg) 70%,
          var(--td-monaco-footer-fg) 30%
        );
    }
    .td-monaco-header,
    .td-monaco-header__group {
      pointer-events: auto !important;
    }
    .td-monaco-header * {
      pointer-events: auto !important;
    }
    .td-monaco-header__group {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }

    // Footer — sibling bên dưới editor wrap
    .td-monaco-footer {
      flex-shrink: 0;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 10px;
      gap: 12px;
      font-size: 12px;
      font-family: "Consolas", "Monaco", monospace;
      user-select: none;
      pointer-events: none;
      box-sizing: border-box;
      background-color: var(--td-monaco-footer-bg);
      color: var(--td-monaco-footer-fg);
      border-top: 1px solid
        color-mix(
          in srgb,
          var(--td-monaco-footer-bg) 70%,
          var(--td-monaco-footer-fg) 30%
        );
    }
    .td-monaco-footer,
    .td-monaco-footer__group {
      pointer-events: auto !important;
    }
    .td-monaco-footer * {
      pointer-events: auto !important; /* Đảm bảo mọi phần tử con bên trong slot đều nhận chuột */
    }
    .td-monaco-footer__group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .td-monaco-footer__label {
      opacity: 0.6;
      letter-spacing: 0.02em;
    }

    .td-monaco-footer__language {
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 11px;
    }

    .td-monaco-footer__cursor {
      opacity: 0.9;
    }
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
