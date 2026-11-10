<template>
  <div
    class="tm-textarea"
    :class="{ 'flex-col': isLabelTop, 'tm-textarea-read-only': effectiveReadOnly }"
    :style="styleComputed"
  >
    <div
      class="tm-label"
      :class="{
        'tm-label-top': isLabelTop,
      }"
      v-if="label && !enableHighlight"
    >
      {{ label.capitalize() }}
    </div>
    <div
      class="textarea-wrapper"
      :class="{ 'tm-textarea-hightlight-wrap-text': wrapText }"
    >
      <!-- Editor area -->
      <div v-show="enableHighlight" class="highlight-layer">
        <!-- Header — sibling phía trên editor wrap -->
        <div v-if="isShowHeader" class="tm-monaco-header">
          <span class="tm-monaco-header__group">
            <slot name="header-main" />
          </span>
        </div>
        <!-- Monaco mount point -->
        <div ref="textareaWrap" class="tm-monaco-editor-wrap"></div>
        <!-- Footer — sibling của editor wrap, nằm bên dưới -->
        <div v-if="isShowFooter" class="tm-monaco-footer">
          <span class="tm-monaco-footer__group">
            <span v-if="label" class="tm-monaco-footer__label">
              {{ label.capitalize ? label.capitalize() : label }}
            </span>
            <slot name="footer-main" />
            <span
              class="tm-monaco-footer__wrap-wrap"
              v-tooltip="$t('i18nCommon.TMTextEditor.wrapTooltip')"
            >
              <TMCheckbox
                v-model="wrapText"
                :label="$t('i18nCommon.wrapText')"
                :no-margin="true"
              />
            </span>
            <span
              v-if="jsonEditorEnabled"
              class="tm-monaco-footer__preview-wrap"
              v-tooltip="$t('i18nCommon.TMTextEditor.previewTooltip')"
            >
              <TMCheckbox
                v-model="jsonDeserialize"
                :label="$t('i18nCommon.TMTextEditor.deserializeLabel')"
                :no-margin="true"
              />
            </span>
          </span>
          <span class="tm-monaco-footer__group">
            <span class="tm-monaco-footer__language">{{ language }}</span>
            <span
              v-if="showCursorTextFooter"
              class="tm-monaco-footer__cursor"
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
        :disabled="effectiveReadOnly"
        :style="borderRadiusStyle"
        @input="changeInputValue"
        @scroll="handleScroll"
        :class="{
          'fix-size': !resizeable,
          'tm-textarea-nowrap-text': !wrapText,
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
import TMStylePremitiveMixin from "@/mixins/TMStylePremitiveMixin.js";
import * as monaco from "monaco-editor";
import {
  registerAllMonacoThemes,
  getMonacoSyntaxRules,
} from "@/monarch/TMMonacoTheme.js";
import { getMonacoActionsByLanguage } from "@/monarch/TMMonacoActionConfig.js";
import _ from "@/common/TMCommonFunction.js";
import eventBus from "@/common/event/TMEventBus.js";
import { TMEnumEventBus } from "@/common/event/TMEnumEventBus.js";

export default {
  name: "TMTextEditor",
  mixins: [TMStylePremitiveMixin],

  created() {
    // để hạn chế làm đơ trình duyệt, thêm debounce để xử lý update model value sau khi người dùng delay nhập
    // monacoeditor và v-model hoạt động song song với nhau
    this.debounceUpdateEditorVal = _.debounce(this.updateEditorVal, 100);
    this.debounceUpdateValToEditor = _.debounce(this.updateValToEditor, 100);
    // Đọc tùy chọn wrap text mặc định từ user setting
    this.$tmUtility.getUserSettings().then(settings => {
      if (settings && settings.wrapText !== undefined) {
        this.wrapText = settings.wrapText;
      }
    });
  },
  mounted() {
    this.updateHighlight();
    this._unsubscribeTheme = eventBus.on(TMEnumEventBus.themeChanged, (themeName) => {
      this.monacoThemeName = themeName;
      if (this.editor) {
        monaco.editor.setTheme(themeName);
      }
    });
  },
  activated() {
    // Khi tab được reactivate (KeepAlive), layout Monaco cần được refresh
    this.$nextTick(() => {
      if (this.editor) this.editor.layout();
    });
  },
  beforeUnmount() {
    if (this._unsubscribeTheme) {
      this._unsubscribeTheme();
    }
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
      return `tm-text-area-${this.$.uid}`;
    },
    /**
     * Editor có phải là JSON hay không.
     * Nếu không truyền props isJsonEditor thì tự nhận diện qua language.
     */
    jsonEditorEnabled() {
      if (this.isJsonEditor !== null && this.isJsonEditor !== undefined) {
        return this.isJsonEditor;
      }
      return this.language === "json";
    },
    /**
     * ReadOnly thực tế: khi đang deserialize thì ép readonly dù ban đầu ở edit mode.
     */
    effectiveReadOnly() {
      return this.jsonDeserialize ? true : this.readOnly;
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
    isJsonEditor: {
      type: Boolean,
      default: null,
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
      monacoActionDisposables: [],
      jsonDeserialize: false,
      originalReadOnly: false,
      originalValue: null,
      isPreviewing: false,
      wrapText: true,
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
        // language đổi dynamic: gỡ action cũ và đăng ký lại action theo language mới
        this.applyMonacoActions();
      }
    },
    jsonDeserialize(value, oldVal) {
      // Khi bật preview: lưu trạng thái readonly ban đầu + giá trị gốc, rồi in đẹp để xem
      // Không emit update:modelValue vì đây chỉ là chế độ xem, không đổi dữ liệu gốc.
      if (value && !oldVal) {
        this.originalReadOnly = this.readOnly;
        this.originalValue = this.editor ? this.editor.getValue() : this.modelValue;
        this.isPreviewing = true;
        this.deserializeCurrent();
        if (this.editor) {
          this.editor.updateOptions({ readOnly: true });
        }
      }
      // Khi tắt preview: khôi phục nội dung gốc vào editor và readonly ban đầu
      // Không emit update:modelValue vì dữ liệu gốc không đổi.
      else if (!value && oldVal) {
        if (
          this.originalValue !== null &&
          this.originalValue !== undefined
        ) {
          this.isPreviewing = true;
          if (this.editor) {
            this.editor.setValue(this.originalValue);
          }
          this.originalValue = null;
          this.isPreviewing = false;
        }
        if (this.editor) {
          this.editor.updateOptions({ readOnly: this.originalReadOnly });
        }
        this.originalReadOnly = false;
        this.isPreviewing = false;
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
     * Bật chế độ highlight synctax (chuyển sang sử dụng monaco editor)
     * Thì sẽ gọi 1 số api của thư viện để update syntax, theme, ...
     */
    async updateHighlight() {
      let me = this;
      if (me.enableHighlight) {
        me.currentTheme = await me.$tmUtility.getUserSettings("theme");
        monaco.languages.register({ id: me.language });

        // đăng ký toàn bộ theme monaco một lần
        registerAllMonacoThemes(monaco);

        // dùng theme hiện tại từ user settings
        me.monacoThemeName = me.currentTheme;
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
          readOnly: me.effectiveReadOnly,
          automaticLayout: true,
          "semanticHighlighting.enabled": true,
          fixedOverflowWidgets: true,
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

        // Đăng ký custom action theo language (context menu, keybinding, ...)
        me.applyMonacoActions();

        // Lắng nghe sự kiện phím tắt từ cấu hình cha truyền xuống
        if (me.monacoOptions && typeof me.monacoOptions.onInit === "function") {
          me.monacoOptions.onInit(me.editor, monaco);
        }
        me.editor.onDidBlurEditorWidget(function () {
          me.debounceUpdateValToEditor();
        });

        // Lắng nghe sự kiện thay đổi nội dung để notify cha biết khi đang gõ
        // (chỉ emit event change, không ghi ngược lại v-model để tránh làm nhảy con trỏ)
        // Khi đang preview (setValue để in đẹp/khôi phục) thì không emit để tránh
        // Lan truyền sự kiện Monaco vào lưu history (gây DataCloneError IndexedDB).
        me.editor.onDidChangeModelContent(function () {
          if (me.isPreviewing) {
            return;
          }
          me.$emit("change", me.editor.getValue());
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
     * Đệ quy parse object hiện tại rồi in đẹp lại JSON để mọi object dễ nhìn hơn.
     * Ngoài parse gốc, hàm còn đệ quy vào các chuỗi con trông như JSON
     * (vd: trường "data" là string chứa JSON escape) để biến thành object thật,
     * giúp cấu trúc lồng nhau hiển thị rõ ràng hơn.
     * Chỉ chạy khi editor là JSON và đang ở chế độ deserialize.
     */
    deserializeCurrent() {
      let me = this;
      // Lấy giá trị trực tiếp từ editor nếu đã mount (để không bị bỏ lỡ dữ liệu user
      // vừa nhập nhưng chưa đồng bộ về prop modelValue qua blur/change)
      let val = me.editor ? me.editor.getValue() : me.modelValue;
      if (!val || !val.trim()) {
        return;
      }
      try {
        const parsed = JSON.parse(val);
        const deepDeserialize = (obj) => {
          if (Array.isArray(obj)) {
            return obj.map(deepDeserialize);
          }
          if (obj !== null && typeof obj === "object") {
            const result = {};
            for (const key of Object.keys(obj)) {
              result[key] = deepDeserialize(obj[key]);
            }
            return result;
          }
          if (typeof obj === "string") {
            const trimmed = obj.trim();
            if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && trimmed.length > 1) {
              try {
                return deepDeserialize(JSON.parse(trimmed));
              } catch (_) {
                return obj;
              }
            }
          }
          return obj;
        };
        const deserialized = deepDeserialize(parsed);
        const formatted = JSON.stringify(deserialized, null, 2);
        if (formatted !== val && me.editor) {
          me.editor.setValue(formatted);
        }
      } catch (_) {
        me.$tmToast?.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    /**
     * Gỡ bỏ toàn bộ custom action đã đăng ký trên editor hiện tại
     */
    disposeMonacoActions() {
      let me = this;
      if (me.monacoActionDisposables && me.monacoActionDisposables.length) {
        me.monacoActionDisposables.forEach((disposable) => {
          try {
            disposable.dispose();
          } catch (_) {}
        });
      }
      me.monacoActionDisposables = [];
    },

    /**
     * Đăng ký lại custom action theo language hiện tại
     * (luôn gỡ action cũ trước để tránh trùng khi đổi language dynamic)
     */
    applyMonacoActions() {
      let me = this;
      me.disposeMonacoActions();
      if (!me.editor) return;

      const actions = getMonacoActionsByLanguage(me.language, {
        onSuccess: (sortedText) => {
          me.$emit("update:modelValue", sortedText);
          me.$tmToast?.success(me.$t("i18nCommon.toastMessage.success"));
        },
        onError: () => {
          me.$tmToast?.error(me.$t("i18nCommon.toastMessage.error"));
        },
      });
      me.monacoActionDisposables = actions.map((action) => {
        const descriptor = { ...action, label: me.$t(action.labelKey) };
        return me.editor.addAction(descriptor);
      });
    },

    unmountEditor() {
      let me = this;
      me.disposeMonacoActions();
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
.tm-textarea {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;

  .tm-label {
    overflow-wrap: normal;
    word-break: keep-all;
    white-space: nowrap;
    padding-right: var(--padding);
  }

  .tm-label-top {
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
    border-radius: var(--border-radius-component);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &:hover {
      border-color: var(--focus-color);
    }

    // Monaco mount point — chiếm hết chiều cao còn lại
    .tm-monaco-editor-wrap {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      position: relative;
    }

    // Header — sibling phía trên editor wrap
    .tm-monaco-header {
      flex-shrink: 0;
      height: 22px;
      display: flex;
      align-items: center;
      padding: 0 var(--padding);
      gap: var(--padding);
      font-size: var(--font-size-medium-rare);
      font-family: "Consolas", "Monaco", monospace;
      user-select: none;
      box-sizing: border-box;
      width: 100%;
      background-color: var(--tm-monaco-footer-bg);
      color: var(--tm-monaco-footer-fg);
      border-bottom: 1px solid
        color-mix(
          in srgb,
          var(--tm-monaco-footer-bg) 70%,
          var(--tm-monaco-footer-fg) 30%
        );
    }
    .tm-monaco-header,
    .tm-monaco-header__group {
      pointer-events: auto !important;
    }
    .tm-monaco-header * {
      pointer-events: auto !important;
    }
    .tm-monaco-header__group {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }

    // Footer — sibling bên dưới editor wrap
    .tm-monaco-footer {
      flex-shrink: 0;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--padding);
      gap: var(--padding);
      font-size: var(--font-size-medium-rare);
      font-family: "Consolas", "Monaco", monospace;
      user-select: none;
      pointer-events: none;
      box-sizing: border-box;
      background-color: var(--tm-monaco-footer-bg);
      color: var(--tm-monaco-footer-fg);
      border-top: 1px solid
        color-mix(
          in srgb,
          var(--tm-monaco-footer-bg) 70%,
          var(--tm-monaco-footer-fg) 30%
        );
    }
    .tm-monaco-footer,
    .tm-monaco-footer__group {
      pointer-events: auto !important;
    }
    .tm-monaco-footer * {
      pointer-events: auto !important; /* Đảm bảo mọi phần tử con bên trong slot đều nhận chuột */
    }
    .tm-monaco-footer__group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .tm-monaco-footer__label {
      color: var(--tm-monaco-text-active);
      letter-spacing: 0.02em;
    }

    .tm-monaco-footer__language {
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: var(--font-size-medium-rare);
    }

    .tm-monaco-footer__cursor {
      opacity: 0.9;
    }

    // Tooltip wrapper cho nút preview
    .tm-monaco-footer__preview-wrap {
      display: inline-flex;
      align-items: center;
      cursor: default;
    }

    // Tooltip wrapper cho nút wrap text (xuống dòng)
    .tm-monaco-footer__wrap-wrap {
      display: inline-flex;
      align-items: center;
      cursor: default;
      margin-right: var(--padding);
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
    opacity: var(--placeholder-opacity);
  }

  .tm-textarea-nowrap-text {
    white-space: pre;
    overflow-x: auto;
    overflow-y: auto;
  }

  textarea:hover {
    border: 1px solid var(--focus-color);
  }

  textarea:focus {
    outline: none;
    border: 1px solid var(--focus-color);
  }

  .fix-size {
    resize: none;
  }
}

.tm-textarea-read-only textarea {
  background-color: var(--bg-layer-color);
  border: 1px solid transparent;
}
.tm-textarea-read-only {
  .highlight-layer {
    background-color: var(--bg-layer-color);
    border: 1px solid transparent;
  }
}
</style>
