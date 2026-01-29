<template>
  <div class="flex td-mocking-container">
    <!-- phần thao tác chính của tool -->
    <div class="flex flex-col td-mockding-main">
      <div class="flex td-mocking-header-first">
        <TDInput
          v-model="requestName"
          :placeHolder="$t('i18nCommon.APIMocking.requestName')"
          :noMargin="true"
        ></TDInput>
        <TDInput
          v-model="groupName"
          :placeHolder="$t('i18nCommon.APIMocking.groupName')"
          :noMargin="true"
        ></TDInput>
        <TDButton
          :noMargin="true"
          @click="saveRequest"
          :label="$t('i18nCommon.APIMocking.save')"
        />
        <TDButton
          v-if="!currentMockId"
          :noMargin="true"
          @click="saveRequest"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.APIMocking.addNew')"
        />
      </div>
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
          :placeHolder="$t('i18nCommon.APIMocking.endpoint')"
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
          :placeHolder="$t('i18nCommon.APIMocking.bodyPlaceholder')"
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
          :placeHolder="$t('i18nCommon.APIMocking.responsePlaceholder')"
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
        >
          <!-- danh sách các mock API được nhóm theo group_name -->
          <div class="td-collection">
            <div class="td-collection-body">
              <div
                v-for="(group, groupName) in groupedMockAPIs"
                class="flex flex-col no-select td-collection-item"
                :key="groupName"
              >
                <!-- phần tên nhóm -->
                <div
                  class="flex td-collection-header"
                  @click="toggleGroup(groupName)"
                >
                  <div
                    class="flex text-nowrap-collection td-collection-header-left"
                  >
                    <TDArrow
                      :openProp="openGroups[groupName]"
                      :arrowOpenDirection="$tdEnum.Direction.bottom"
                      :arrowDirection="$tdEnum.Direction.right"
                    />
                    <div class="" v-tooltip="groupName || 'Ungrouped'">
                      {{ groupName || "Ungrouped" }}
                    </div>
                  </div>
                </div>
                <!-- danh sách các mock API trong nhóm -->
                <div
                  v-if="openGroups[groupName] && group && group.length > 0"
                  class="flex flex-col td-collection-content"
                >
                  <div
                    v-for="(mock, index) in group"
                    :key="index"
                    class="flex td-collection-request-item"
                    :class="{
                      'td-collection-request-item-selected':
                        mock && currentMockId == mock.id,
                    }"
                    @click="loadMockAPI(mock)"
                  >
                    <span class="text-nowrap">
                      <div v-tooltip="mock.request_name">
                        {{ mock.request_name }}
                      </div>
                    </span>
                    <span class="text-nowrap">
                      <div
                        class="td-icon td-close-icon"
                        v-tooltip="$t('i18nCommon.APIMocking.delete')"
                        @click.stop="deleteMockAPI(mock.id)"
                      ></div>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- nút tạo mới và làm mới danh sách -->
          <div class="flex">
            <TDButton
              @click="createNewMock"
              :type="$tdEnum.buttonType.secondary"
              :noMargin="true"
              :label="$t('i18nCommon.APIMocking.createNew')"
              :borderRadiusPosition="[
                $tdEnum.BorderRadiusPosition.TopLeft,
                $tdEnum.BorderRadiusPosition.BottomLeft,
              ]"
            ></TDButton>
            <TDButton
              @click="loadAllMockAPIs"
              :type="$tdEnum.buttonType.secondary"
              :noMargin="true"
              :label="$t('i18nCommon.APIMocking.refresh')"
              :borderRadiusPosition="[
                $tdEnum.BorderRadiusPosition.TopRight,
                $tdEnum.BorderRadiusPosition.BottomRight,
              ]"
            ></TDButton>
          </div>
        </div>
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
            :label="$t('i18nCommon.APIMocking.wrapText')"
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
import TDArrow from "@/components/TDArrow.vue";
import TDLayoutConfigMixin from "@/mixins/TDLayoutConfigMixin.js";
import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

export default {
  name: "TDAPIMocking",
  components: { TDResizer, TDSubSidebar, TDArrow },
  mixins: [TDLayoutConfigMixin],

  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.APIMockConfigLayout,
      apiUrl: "",
      requestName: "",
      groupName: "",
      httpMethod: "GET",
      bodyText: "",
      responseText: "",
      currentMockId: null,
      allMockAPIs: [],
      openGroups: {},
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
        wrapText: true,
        splitHorizontal: true,
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.APISidebarOption.Collection,
      },
      requestSectionSize: 50,
      responseSectionSize: 50,
      agentAPI: null,
    };
  },
  async mounted() {
    this.agentAPI = new TDAgentAPI();
    await this.loadAllMockAPIs();
  },
  computed: {
    sidebarOptions() {
      let me = this;
      let options = [];
      options.push({
        value: this.$tdEnum.APISidebarOption.Setting,
        label: this.$t("i18nCommon.APIMocking.sidebarOption.setting"),
        icon: "td-setting-icon",
      });
      options.push({
        value: this.$tdEnum.APISidebarOption.Collection,
        label: this.$t("i18nCommon.APIMocking.sidebarOption.collection"),
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
     * Nhóm các mock API theo group_name
     */
    groupedMockAPIs() {
      let me = this;
      let grouped = {};
      // Đảm bảo allMockAPIs là array
      if (!Array.isArray(me.allMockAPIs)) {
        return grouped;
      }
      me.allMockAPIs.forEach((mock) => {
        let groupName = mock.group_name || "";
        if (!grouped[groupName]) {
          grouped[groupName] = [];
          // Tự động mở nhóm (Vue 3 không cần $set)
          me.openGroups[groupName] = true;
        }
        grouped[groupName].push(mock);
      });
      return grouped;
    },
    /**
     * Tính toán style động cho request area
     */
    requestSectionSizeStyle() {
      let me = this;
      let style = {};
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
    /**
     * Toggle mở/đóng nhóm
     */
    toggleGroup(groupName) {
      let me = this;
      me.openGroups[groupName] = !me.openGroups[groupName];
    },
    /**
     * Tải tất cả mock APIs từ server
     */
    async loadAllMockAPIs() {
      let me = this;
      try {
        let response = await me.agentAPI.getAllMockAPIs();
        
        // Response có cấu trúc: { success, status, data: { success, data: [...] } }
        let mockData = response?.data?.data;
        
        if (response && response.success && Array.isArray(mockData)) {
          // Sử dụng splice để trigger reactivity
          me.allMockAPIs.splice(0, me.allMockAPIs.length, ...mockData);
        } else {
          me.allMockAPIs.splice(0, me.allMockAPIs.length);
        }
      } catch (error) {
        console.error("Lỗi tải mock APIs:", error);
        me.allMockAPIs.splice(0, me.allMockAPIs.length);
        me.$tdToast.error(me.$t("i18nCommon.APIMocking.loadMockErr"));
      }
    },
    /**
     * Tải thông tin mock API vào form
     */
    loadMockAPI(mock) {
      let me = this;
      me.currentMockId = mock.id;
      me.requestName = mock.request_name;
      me.groupName = mock.group_name;
      me.httpMethod = mock.method;
      me.apiUrl = mock.end_point;
      me.bodyText = mock.body_text;
      me.responseText = mock.response_text;
    },
    /**
     * Tạo mới mock API
     */
    createNewMock() {
      let me = this;
      me.currentMockId = null;
      me.requestName = "";
      me.groupName = "";
      me.httpMethod = "GET";
      me.apiUrl = "";
      me.bodyText = "";
      me.responseText = "";
    },
    /**
     * Lưu hoặc cập nhật mock API
     */
    async saveRequest() {
      let me = this;
      
      if (!me.requestName || !me.apiUrl) {
        me.$tdToast.warning(me.$t("i18nCommon.APIMocking.requestNameAndApiUrlRequired"));
        return;
      }

      let mockData = {
        request_name: me.requestName,
        group_name: me.groupName,
        method: me.httpMethod,
        end_point: me.apiUrl,
        body_text: me.bodyText,
        response_text: me.responseText,
      };

      try {
        if (me.currentMockId) {
          // Cập nhật
          mockData.id = me.currentMockId;
          let response = await me.agentAPI.updateMockAPI(mockData);
          if (response && response.success && response.data?.success) {
            me.$tdToast.success(me.$t("i18nCommon.APIMocking.updateMockSuccess"));
            await me.loadAllMockAPIs();
          }
        } else {
          // Tạo mới
          let response = await me.agentAPI.createMockAPI(mockData);
          if (response && response.success && response.data?.success) {
            me.$tdToast.success(me.$t("i18nCommon.APIMocking.createMockSuccess"));
            me.currentMockId = response.data?.data?.id;
            await me.loadAllMockAPIs();
          }
        }
      } catch (error) {
        console.error(me.$t("i18nCommon.APIMocking.saveMockErr"), error);
        me.$tdToast.error(me.$t("i18nCommon.APIMocking.saveMockErr"));
      }
    },
    /**
     * Xóa mock API
     */
    async deleteMockAPI(id) {
      let me = this;
      try {
        let response = await me.agentAPI.deleteMockAPI(id);
        if (response && response.success && response.data?.success) {
          me.$tdToast.success(me.$t("i18nCommon.APIMocking.deleteMockSuccess"));
          if (me.currentMockId === id) {
            me.createNewMock();
          }
          await me.loadAllMockAPIs();
        }
      } catch (error) {
        console.error(me.$t("i18nCommon.APIMocking.deleteMockErr"), error);
        me.$tdToast.error(me.$t("i18nCommon.APIMocking.deleteMockErr"));
      }
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
    .td-mocking-header-first {
      width: 100%;
      gap: var(--padding);
    }
    .td-mocking-header {
      width: 100%;
    }
    .td-mocking-content {
      flex: 1;
      width: 100%;
    }
  }
}
.td-collection {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
  .td-collection-body {
    margin-top: var(--padding);
    position: relative;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    .td-collection-item {
      cursor: pointer;
      justify-content: flex-start;
      gap: var(--padding);
      width: 100%;
      min-height: 40px;
      margin-bottom: var(--padding);

      .td-collection-header {
        gap: var(--padding);
        padding: var(--padding);
        height: 40px;
        justify-content: space-between;
        width: 100%;
        background-color: var(--bg-thirt-color);
        border-radius: var(--border-radius);
        .td-collection-header-left {
          gap: var(--padding);
        }
      }
      .td-collection-header:hover {
        background-color: var(--bg-layer-color);
      }
      .td-collection-content {
        justify-content: flex-start;
        gap: var(--padding);
        width: 100%;
        .td-collection-request-item {
          height: 40px;
          justify-content: space-between;
          width: 100%;
          padding: var(--padding);
          border-radius: var(--border-radius);
        }
        .td-collection-request-item:hover {
          background-color: var(--bg-layer-color);
        }
        .td-collection-request-item-selected {
          background-color: var(--bg-layer-color);
          font-weight: 600;
        }
      }
    }
  }
}
.td-sidebar-content {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.text-nowrap-collection {
  max-width: 215px !important;
  div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
