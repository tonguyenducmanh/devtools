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
        // cập nhật label ngôn ngữ trên footer
        this.updateFooterLanguage(value);
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
        // đồng bộ màu footer sau khi theme thay đổi
        me.$nextTick(() => me._applyFooterTheme());
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
        // Tạo inner div để Monaco mount vào — footer sẽ là sibling bên ngoài
        const editorMountEl = document.createElement("div");
        editorMountEl.className = "td-monaco-editor-inner";
        me.$refs.textareaWrap.appendChild(editorMountEl);
        me._editorMountEl = editorMountEl;

        me.editor = monaco.editor.create(editorMountEl, configObject);

        // Tạo footer nằm ngoài Monaco, trải dài toàn chiều rộng giống VS Code status bar
        me.createFooterWidget();

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
    /**
     * Tạo footer nằm BÊN NGOÀI Monaco editor (sibling của editorMountEl).
     *
     * Kiến trúc giống VS Code:
     *   .highlight-layer  (flex column)
     *     ├── .td-monaco-editor-inner  (flex: 1) ← Monaco mount ở đây
     *     └── .td-monaco-footer         (22px)   ← footer trải dài toàn chiều rộng
     *
     * Màu lấy từ getComputedStyle của .monaco-editor DOM sau mỗi theme change.
     */
    createFooterWidget() {
      let me = this;
      if (!me.editor || !me.label) return;

      // Tạo DOM gốc cho footer
      const footerDom = document.createElement("div");
      footerDom.className = "td-monaco-footer";

      // --- Nhóm trái: label ---
      const leftGroup = document.createElement("span");
      leftGroup.className = "td-monaco-footer__group";
      const labelEl = document.createElement("span");
      labelEl.className = "td-monaco-footer__label";
      labelEl.textContent = me.label.capitalize
        ? me.label.capitalize()
        : me.label;
      leftGroup.appendChild(labelEl);
      footerDom.appendChild(leftGroup);

      // --- Nhóm phải: language + cursor position ---
      const rightGroup = document.createElement("span");
      rightGroup.className = "td-monaco-footer__group";
      const langEl = document.createElement("span");
      langEl.className = "td-monaco-footer__language";
      langEl.textContent = me.language || "";
      rightGroup.appendChild(langEl);
      const cursorEl = document.createElement("span");
      cursorEl.className = "td-monaco-footer__cursor";
      const pos = me.editor.getPosition();
      cursorEl.textContent = pos
        ? `Ln ${pos.lineNumber}, Col ${pos.column}`
        : "Ln 1, Col 1";
      rightGroup.appendChild(cursorEl);
      footerDom.appendChild(rightGroup);

      // Lưu tham chiếu để update realtime
      me._footerDom = footerDom;
      me._footerCursorEl = cursorEl;
      me._footerLanguageEl = langEl;

      // Đưa footer vào .highlight-layer (sibling của editorMountEl, không nằm trong Monaco)
      me.$refs.textareaWrap.appendChild(footerDom);

      // Áp màu theme sau khi Monaco render xong
      me.$nextTick(() => me._applyFooterTheme());
    },

    /**
     * Đồng bộ màu footer theo computed style của Monaco editor.
     * Gọn gàng hơn CSS vars vì hoạt động bất kể Monaco mount ở đâu.
     */
    _applyFooterTheme() {
      const me = this;
      if (!me.editor || !me._footerDom) return;
      const editorDom = me.editor.getDomNode();
      if (!editorDom) return;
      const computed = window.getComputedStyle(editorDom);
      me._footerDom.style.backgroundColor = computed.backgroundColor;
      me._footerDom.style.color = computed.color;
      // border top: dùng màu sā́ng/tối hơn nền một chút
      me._footerDom.style.borderTopColor = `color-mix(in srgb, ${computed.backgroundColor} 70%, ${computed.color} 30%)`;
    },

    /**
     * Cập nhật thông tin vị trí cursor trên footer
     */
    updateFooterCursorPosition(position) {
      if (this._footerCursorEl && position) {
        this._footerCursorEl.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
      }
    },

    /**
     * Cập nhật nhãn ngôn ngữ trên footer
     */
    updateFooterLanguage(lang) {
      if (this._footerLanguageEl) {
        this._footerLanguageEl.textContent = lang || "";
      }
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
      // Gỡ footer DOM
      if (me._footerDom && me._footerDom.parentElement) {
        me._footerDom.parentElement.removeChild(me._footerDom);
      }
      me._footerDom = null;
      me._footerCursorEl = null;
      me._footerLanguageEl = null;
      // Gỡ editor mount el
      if (me._editorMountEl && me._editorMountEl.parentElement) {
        me._editorMountEl.parentElement.removeChild(me._editorMountEl);
      }
      me._editorMountEl = null;
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
    // Footer là sibling của editor — dùng flex-column để editor + footer xếp dọc
    display: flex;
    flex-direction: column;

    // Inner wrapper chứa Monaco editor, chiếm hết chiều cao còn lại sau footer
    :deep(.td-monaco-editor-inner) {
      flex: 1;
      min-height: 0; // quan trọng để flex child không vượt ra ngoài
      overflow: hidden;
      position: relative;
    }

    // Footer trải dài toàn chiều rộng, nằm ngoài Monaco
    // Màu được set bằng JS qua _applyFooterTheme() để khớp theme hiện tại
    :deep(.td-monaco-footer) {
      flex-shrink: 0;
      height: 22px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 10px;
      gap: 12px;
      font-size: 12px;
      font-family: "Consolas", "Monaco", monospace;
      border-top-width: 1px;
      border-top-style: solid;
      user-select: none;
      pointer-events: none;
      box-sizing: border-box;
    }

    :deep(.td-monaco-footer__group) {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    :deep(.td-monaco-footer__label) {
      opacity: 0.6;
      letter-spacing: 0.02em;
    }

    :deep(.td-monaco-footer__language) {
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 11px;
    }

    :deep(.td-monaco-footer__cursor) {
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
