<template>
  <div class="flex td-mocking-container">
    <!-- phần thao tác chính của tool -->
    <div class="flex flex-col td-mockding-main">
      <div class="flex td-mocking-header">
        <!-- combo chọn method http -->
        <TDComboBox
          :width="120"
          v-model="httpMethod"
          :options="methodOptions"
          :customStyle="customStyleComboMethodAPI"
          :noMargin="true"
          :borderRadiusPosition="[
            $tdEnum.BorderRadiusPosition.TopLeft,
            $tdEnum.BorderRadiusPosition.BottomLeft,
          ]"
        />
        <!-- nhập url endpoint api -->
        <TDInput
          v-model="apiUrl"
          :placeHolder="$t('i18nCommon.apiTesting.urlPlaceholder')"
          :noMargin="true"
          :borderRadiusPosition="[
            $tdEnum.BorderRadiusPosition.TopRight,
            $tdEnum.BorderRadiusPosition.BottomRight,
          ]"
        ></TDInput>
      </div>
      <div
        class="flex td-mocking-content"
        :class="{ 'flex-col': currentConfigLayout.splitHorizontal }"
      >
        <TDTextarea
          :isLabelTop="true"
          v-model="bodyText"
          :wrapText="currentConfigLayout.wrapText"
          :enableHighlight="currentConfigLayout.enableHighlight"
          language="json"
          :placeHolder="$t('i18nCommon.apiTesting.bodyPlaceholder')"
          :style="requestSectionSizeStyle"
        ></TDTextarea>
        <TDResizer
          :direction="
            currentConfigLayout.splitHorizontal ? 'vertical' : 'horizontal'
          "
          @resize="handleResize"
        />
        <TDTextarea
          :isLabelTop="true"
          v-model="responseText"
          :wrapText="currentConfigLayout.wrapText"
          :enableHighlight="currentConfigLayout.enableHighlight"
          language="json"
          :placeHolder="$t('i18nCommon.apiTesting.bodyPlaceholder')"
          :style="responseSectionSizeStyle"
        ></TDTextarea>
      </div>
    </div>
    <!-- hết phần thao tác chính của tool -->
    <!-- phần nội dung sidebar -->
    <TDSubSidebar
      ref="subSidebar"
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <!-- slide tùy chọn như cài đặt hoặc collection -->
      <template v-slot:menu>
        <div class="td-sidebar-menu">
          <TDSlideOption
            :showIcon="true"
            v-if="sidebarOptions && sidebarOptions.length > 1"
            v-model="currentConfigLayout.currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
            @change="updateConfigLayout"
          />
        </div>
      </template>
      <template v-slot:main>
        <!-- phần bộ sưu tập các request -->
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.APISidebarOption.Collection
          "
        ></div>
        <!-- phần sidebar nếu đang tùy chọn thiết lập api -->
        <div
          class="td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.APISidebarOption.Setting
          "
        >
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.wrapText"
            :label="$t('i18nCommon.apiTesting.wrapText')"
            @change="updateConfigLayout"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.enableHighlight"
            :label="$t('i18nCommon.enableHighlight')"
            @change="updateConfigLayout"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.splitHorizontal"
            :label="$t('i18nCommon.splitHorizontal')"
            @change="updateConfigLayout"
          ></TDCheckbox>
        </div>
      </template>
    </TDSubSidebar>
    <!-- hết phần nội dung sidebar -->
  </div>
</template>

<script>
import TDResizer from "@/components/TDResizer.vue";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDLayoutConfigMixin from "@/mixins/TDLayoutConfigMixin.js";
export default {
  name: "TDAPIMocking",
  components: { TDResizer, TDSubSidebar },
  mixins: [TDLayoutConfigMixin],

  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.APIMockConfigLayout,
      apiUrl: "",
      requestName: "",
      httpMethod: "GET",
      bodyText: "",
      responseText: "",
      methodOptions: [
        { value: "GET", label: "GET", customStyle: { color: "#5EA572" } },
        { value: "POST", label: "POST", customStyle: { color: "#AE7D0D" } },
        { value: "PUT", label: "PUT", customStyle: { color: "#3676C7" } },
        { value: "PATCH", label: "PATCH", customStyle: { color: "#825DAC" } },
        { value: "DELETE", label: "DELETE", customStyle: { color: "#A64C43" } },
        { value: "HEAD", label: "HEAD", customStyle: { color: "#459B60" } },
        {
          value: "OPTIONS",
          label: "OPTIONS",
          customStyle: { color: "#C25E95" },
        },
      ],
      currentConfigLayout: {
        enableHighlight: true,
        wrapText: false,
        splitHorizontal: true,
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.APISidebarOption.Setting,
      },
      requestSectionSize: 50, // Phần request chiếm 50%
      responseSectionSize: 50, // Phần response chiếm 50%
    };
  },
  async created() {},
  computed: {
    sidebarOptions() {
      let me = this;
      let options = [];
      options.push({
        value: this.$tdEnum.APISidebarOption.Setting,
        label: this.$t("i18nCommon.apiTesting.sidebarOption.setting"),
        icon: "td-setting-icon",
      });
      options.push({
        value: this.$tdEnum.APISidebarOption.Collection,
        label: this.$t("i18nCommon.apiTesting.sidebarOption.collection"),
        icon: "td-folder-icon",
      });
      return options;
    },
    customStyleComboMethodAPI() {
      let me = this;
      let style = me.methodOptions.find((x) => x.value == me.httpMethod);
      if (style) {
        return style.customStyle;
      } else {
        return null;
      }
    },
    /**
     * Tính toán style động cho request area
     */
    requestSectionSizeStyle() {
      let me = this;
      let style = {};
      // nếu hiển thị response thì mới ưu tiên tính toán
      if (me.currentConfigLayout.splitHorizontal) {
        style = { height: `${me.requestSectionSize}%` };
      } else {
        style = { width: `${me.requestSectionSize}%` };
      }
      return style;
    },
    /**
     * Tính toán style động cho response area
     */
    responseSectionSizeStyle() {
      let me = this;
      let style = {};
      if (me.currentConfigLayout.splitHorizontal) {
        style = { height: `${me.responseSectionSize}%` };
      } else {
        style = { width: `${me.responseSectionSize}%` };
      }
      return style;
    },
  },
  beforeUnmount() {},
  methods: {
    handleResize(sizes) {
      this.requestSectionSize = sizes.leftSize;
      this.responseSectionSize = sizes.rightSize;
    },
    async toggleSidebar() {
      let me = this;
      await me.updateConfigLayout();
    },
  },
};
</script>

<style scoped lang="scss">
.td-mocking-container {
  width: 100%;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
  .td-mockding-main {
    width: 100%;
    height: 100%;
    gap: var(--padding);
    .td-mocking-header {
      width: 100%;
    }
    .td-mocking-content {
      flex: 1;
      width: 100%;
    }
  }
}
.td-sidebar-content {
  flex: 1;
  width: 100%;
  min-height: 0;
}
</style>
