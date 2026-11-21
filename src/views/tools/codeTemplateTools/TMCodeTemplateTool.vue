<template>
  <div class="flex container">
    <div
      class="flex main-area"
      :class="{ 'flex-col': currentConfigLayout.splitHorizontal }"
    >
      <div class="flex flex-col editor-area" :style="editorSectionSizeStyle">
        <TMTextEditor
          :isLabelTop="true"
          :readOnly="true"
          :label="selectedTemplateName"
          :enableHighlight="currentConfigLayout.enableHighlight"
          :language="language"
          :placeHolder="''"
          v-model="currentCode"
        ></TMTextEditor>
      </div>

      <TMResizer
        v-if="$slots.preview"
        :direction="
          currentConfigLayout.splitHorizontal ? 'vertical' : 'horizontal'
        "
        @resize="handleResize"
      />

      <div
        v-if="$slots.preview"
        class="flex flex-col preview-area"
        :style="previewSectionSizeStyle"
      >
        <slot
          name="preview"
          :code="currentCode"
          :template="selectedTemplate"
        ></slot>
      </div>
    </div>

    <TMSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="tm-sidebar-menu">
          <TMSlideOption
            :showIcon="true"
            v-model="currentConfigLayout.currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
            @change="updateConfigLayout"
          />
        </div>
      </template>
      <template v-slot:main>
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.CodeTemplateSidebarOption.Template
          "
        >
          <div class="sidebar-input">
            <TMInput
              :noMargin="true"
              v-model="templateFilter"
              :placeHolder="$t(tKey('search_template'))"
            />
          </div>

          <div class="flex flex-col template-list">
            <div class="flex flex-col template-wrapper">
              <div
                v-for="template in filteredTemplates"
                :key="template.key"
                class="text-nowrap template-item"
                v-tooltip="getTemplateName(template)"
                :class="{
                  'template-item-selected':
                    selectedTemplateKey === template.key,
                }"
                @click="selectTemplate(template)"
              >
                {{ getTemplateName(template) }}
              </div>
            </div>
            <div v-if="filteredTemplates.length === 0" class="no-template">
              {{ $t(tKey("no_template_found")) }}
            </div>
          </div>
        </div>

        <div
          class="tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.CodeTemplateSidebarOption.Setting
          "
        >
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.enableHighlight"
            :label="$t('i18nCommon.enableHighlight')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.splitHorizontal"
            :label="$t('i18nCommon.splitHorizontal')"
            @change="updateConfigLayout"
          ></TMCheckbox>
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>

<script>
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";

export default {
  extends: TMToolBase,
  name: "TMCodeTemplateTool",
  components: { TMSubSidebar },
  props: {
    language: {
      type: String,
      default: "plaintext",
    },
    templatesFull: {
      type: Array,
      default: () => [],
    },
    // Namespace i18n chứa search_template / no_template_found / template.
    i18nNamespace: {
      type: String,
      required: true,
    },
    cacheLayoutKey: {
      default: null,
    },
  },
  created() {
    let me = this;
    me.loadTemplates();
  },
  computed: {
    sidebarOptions() {
      let options = [];
      options.push({
        value: this.$tmEnum.CodeTemplateSidebarOption.Template,
        label: this.$t(this.tKey("template")),
        icon: "tm-folder-icon",
      });
      options.push({
        value: this.$tmEnum.CodeTemplateSidebarOption.Setting,
        label: this.$t("i18nCommon.sidebarOption.setting"),
        icon: "tm-setting-icon",
      });
      return options;
    },
    editorSectionSizeStyle() {
      let me = this;
      if (!me.$slots.preview) return {};
      let size = me.currentConfigLayout.editorSectionSize || 50;
      return me.currentConfigLayout.splitHorizontal
        ? { height: `${size}%` }
        : { width: `${size}%` };
    },
    previewSectionSizeStyle() {
      let me = this;
      let size = me.currentConfigLayout.previewSectionSize || 50;
      return me.currentConfigLayout.splitHorizontal
        ? { height: `${size}%` }
        : { width: `${size}%` };
    },
    selectedTemplate() {
      return this.templates.find(
        (t) => t.key === this.selectedTemplateKey,
      );
    },
    filteredTemplates() {
      let me = this;
      if (!me.templateFilter || !me.templateFilter.trim()) {
        return me.templates;
      }
      let filterLower = me.templateFilter.toLowerCase().trim();
      return me.templates.filter((t) => {
        let label = me.$t(t.labelKey).toLowerCase();
        return label.includes(filterLower);
      });
    },
    selectedTemplateName() {
      if (!this.selectedTemplateKey) return "";
      let template = this.templates.find(
        (t) => t.key === this.selectedTemplateKey,
      );
      let me = this;
      let templateNeme = me.getTemplateName(template);
      return templateNeme;
    },
  },
  methods: {
    tKey(suffix) {
      return `${this.i18nNamespace}.${suffix}`;
    },
    getTemplateName(template) {
      let templateNeme = "";
      let me = this;
      if (template) {
        templateNeme = template.key;
        if (this.$te(template.labelKey)) {
          templateNeme = this.$t(template.labelKey);
        }
      }
      return templateNeme;
    },
    loadTemplates() {
      let me = this;
      me.templates = me.templatesFull || [];
      if (me.templates.length > 0) {
        me.selectedTemplateKey = me.templates[0].key;
        me.currentCode = me.templates[0].code || "";
      }
    },
    selectTemplate(template) {
      let me = this;
      me.selectedTemplateKey = template.key;
      me.currentCode = template.code || "";
    },
    handleResize(sizes) {
      this.currentConfigLayout.editorSectionSize = sizes.leftSize;
      this.currentConfigLayout.previewSectionSize = sizes.rightSize;
    },
  },
  data() {
    return {
      keyCacheLayout:
        this.cacheLayoutKey || this.$tmEnum.cacheConfig.CodeTemplateConfigLayout,
      templates: [],
      templateFilter: "",
      selectedTemplateKey: "",
      currentCode: "",
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption:
          this.$tmEnum.CodeTemplateSidebarOption.Template,
        enableHighlight: true,
        wrapText: true,
        splitHorizontal: true,
        editorSectionSize: 50,
        previewSectionSize: 50,
      },
    };
  },
};
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
}
.main-area {
  flex: 1;
  height: 100%;
  min-width: 0;
}
.editor-area,
.preview-area {
  flex: 0 0 auto;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
.tm-sidebar-content {
  width: 100%;
  height: 100%;
  justify-content: flex-start;
  overflow: hidden;
}
.sidebar-input {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  margin: var(--padding);
}
.template-list {
  width: 100%;
  gap: var(--padding);
  flex: 1;
  justify-content: flex-start;
  overflow-y: auto;
  min-height: 0;
  .template-wrapper {
    width: 100%;
    align-items: flex-start;
    justify-content: flex-start;
  }
}
.template-item {
  width: 100%;
  max-width: 100%;
  padding: var(--padding);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s;
}
.template-item:hover {
  background-color: var(--focus-color);
  color: var(--selected-item-text-color);
}
.template-item-selected {
  font-weight: 600;
  background-color: var(--focus-color);
  color: var(--selected-item-text-color);
}
.no-template {
  padding: var(--padding);
  color: var(--text-secondary-color);
  text-align: center;
}
</style>
