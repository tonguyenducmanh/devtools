<template>
  <div class="flex container">
    <div class="flex flex-col main-area">
      <TMTextEditor
        :isLabelTop="true"
        :readOnly="true"
        :label="selectedTemplateName"
        :enableHighlight="currentConfigLayout.enableHighlight"
        :language="language"
        :placeHolder="''"
        v-model="currentCode"
        :wrapText="currentConfigLayout.wrapText"
      ></TMTextEditor>
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
            $tmEnum.PostgreSQLTemplateSidebarOption.Template
          "
        >
          <div class="sidebar-input">
            <TMInput
              :noMargin="true"
              v-model="templateFilter"
              :placeHolder="
                $t('i18nTemplate.postgreSQLTemplate.search_template')
              "
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
              {{ $t("i18nTemplate.postgreSQLTemplate.no_template_found") }}
            </div>
          </div>
        </div>

        <div
          class="tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.PostgreSQLTemplateSidebarOption.Setting
          "
        >
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.wrapText"
            :label="$t('i18nCommon.wrapText')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.enableHighlight"
            :label="$t('i18nCommon.enableHighlight')"
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
  },
  created() {
    let me = this;
    me.loadTemplates();
  },
  computed: {
    sidebarOptions() {
      let options = [];
      options.push({
        value: this.$tmEnum.PostgreSQLTemplateSidebarOption.Template,
        label: this.$t("i18nTemplate.postgreSQLTemplate.template"),
        icon: "tm-folder-icon",
      });
      options.push({
        value: this.$tmEnum.PostgreSQLTemplateSidebarOption.Setting,
        label: this.$t("i18nCommon.sidebarOption.setting"),
        icon: "tm-setting-icon",
      });
      return options;
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
  },
  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.PostgreSQLTemplateConfigLayout,
      templates: [],
      templateFilter: "",
      selectedTemplateKey: "",
      currentCode: "",
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption:
          this.$tmEnum.PostgreSQLTemplateSidebarOption.Template,
        enableHighlight: true,
        wrapText: true,
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
