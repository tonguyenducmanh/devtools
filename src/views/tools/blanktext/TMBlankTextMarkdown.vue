<template>
  <div class="flex container">
    <div class="flex flex-col main-tool">
      <!-- thanh công cụ trên đầu: upload giữ dạng có nhãn, các thao tác còn lại dùng icon -->
      <div class="flex tool-header">
        <TMUpload
          :label="$t('i18nCommon.markdownText.uploadLabel')"
          :isShowSelect="false"
          :isSmallButton="true"
          @selected="handleFileUpload"
        />
        <TMButton
          :noMargin="true"
          :isSmallButton="true"
          :type="$tmEnum.buttonType.secondary"
          iconClass="tm-copy-icon"
          v-tooltip="$t('i18nCommon.copy')"
          @click="handleCopy"
        ></TMButton>
        <TMButton
          :noMargin="true"
          :isSmallButton="true"
          :type="$tmEnum.buttonType.secondary"
          iconClass="tm-download-icon"
          v-tooltip="$t('i18nCommon.blanktext.download')"
          @click="handleDownload"
        ></TMButton>
        <!-- nút thực hiện: render lại preview, cùng mẫu tm-send-icon với nút Run Query -->
        <TMButton
          :noMargin="true"
          :isSmallButton="true"
          iconClass="tm-send-icon"
          v-tooltip="$t('i18nCommon.markdownText.run')"
          @click="handleRunRender"
        ></TMButton>
      </div>
      <div
        class="flex main-area"
        :class="{ 'flex-col': currentConfigLayout.splitHorizontal }"
      >
        <div class="flex flex-col editor-area" :style="editorSectionSizeStyle">
          <TMTextEditor
            :placeHolder="$t('i18nCommon.markdownText.placeholder')"
            v-model="content"
            height="100%"
            width="100%"
            :enableHighlight="currentConfigLayout.enableHighlight"
            language="markdown"
            :monacoOptions="monacoOptions"
            @change="handleEditorChange"
          ></TMTextEditor>
        </div>

        <TMResizer
          :direction="
            currentConfigLayout.splitHorizontal ? 'vertical' : 'horizontal'
          "
          @resize="handleResize"
        />

        <div class="flex flex-col preview-area" :style="previewSectionSizeStyle">
          <TMBlankTextMarkdownPreview
            :source="content"
            :renderNonce="renderNonce"
          />
        </div>
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
          class="flex flex-col tm-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.History
          "
        >
          <TMHistorySidebar
            ref="history"
            :applyFunction="handleApplyHistory"
            titleKey="content"
            :noMargin="true"
            :maxHistoryLength="1000"
            :cacheKey="$tmEnum.cacheConfig.BlankTextMarkdownHistory"
          />
        </div>
        <div
          class="flex flex-col tm-sub-sidebar tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Setting
          "
        >
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
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMBlankTextShared from "@/views/tools/blanktext/TMBlankTextShared.js";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMSlideOption from "@/components/TMSlideOption.vue";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";
import TMBlankTextMarkdownPreview from "@/views/tools/blanktext/TMBlankTextMarkdownPreview.vue";

export default {
  extends: TMToolBase,
  mixins: [TMBlankTextShared],
  name: "TMBlankTextMarkdown",
  components: {
    TMSubSidebar,
    TMSlideOption,
    TMHistorySidebar,
    TMBlankTextMarkdownPreview,
  },
  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.BlankTextMarkdownConfigLayout,
      renderNonce: 0,
      uploadFilePattern: /\.(md|markdown|txt)$/i,
      uploadFileErrorKey: "i18nCommon.markdownText.onlyMarkdownSupported",
      currentConfigLayout: {
        enableHighlight: true,
        wrapText: true,
        language: "markdown",
        isShowSidebar: true,
        currentSidebarOption: this.$tmEnum.ToolSidebarOption.History,
        splitHorizontal: true,
        editorSectionSize: 50,
        previewSectionSize: 50,
      },
    };
  },
  computed: {
    editorSectionSizeStyle() {
      let size = this.currentConfigLayout.editorSectionSize || 50;
      return this.currentConfigLayout.splitHorizontal
        ? { height: `${size}%` }
        : { width: `${size}%` };
    },
    previewSectionSizeStyle() {
      let size = this.currentConfigLayout.previewSectionSize || 50;
      return this.currentConfigLayout.splitHorizontal
        ? { height: `${size}%` }
        : { width: `${size}%` };
    },
    sidebarOptions() {
      return [
        {
          value: this.$tmEnum.ToolSidebarOption.History,
          label: this.$t("i18nCommon.history.title"),
          icon: "tm-history-icon",
        },
        {
          value: this.$tmEnum.ToolSidebarOption.Setting,
          label: this.$t("i18nCommon.sidebarOption.setting"),
          icon: "tm-setting-icon",
        },
      ];
    },
  },
  methods: {
    handleResize(sizes) {
      let me = this;
      me.currentConfigLayout.editorSectionSize = sizes.leftSize;
      me.currentConfigLayout.previewSectionSize = sizes.rightSize;
    },
    /**
     * Nút "Thực hiện": đẩy giá trị mới nhất từ editor vào content rồi bắt
     * preview render lại (kể cả khi nội dung không đổi), giống nút Run Query.
     */
    handleRunRender() {
      let me = this;
      me.content = me._latestEditorValue ?? me.content;
      me.renderNonce += 1;
      me.saveToHistory();
    },
  },
};
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
  display: flex;
}
.main-tool {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.main-area {
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
.editor-area,
.preview-area {
  flex: 0 0 auto;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
.tool-header {
  width: 100%;
  align-items: center;
  gap: var(--padding);
  margin-bottom: var(--padding);
}
.tm-sub-sidebar {
  height: 100%;
  justify-content: flex-start;
  width: 100%;
  overflow: auto;
}
</style>
