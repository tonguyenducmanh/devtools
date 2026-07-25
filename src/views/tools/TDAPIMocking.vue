<template>
  <div class="flex td-mocking-container">
    <!-- phần thao tác chính của tool -->
    <div class="flex flex-col td-mockding-main">
      <div class="flex td-mocking-header">
        <div class="flex flex-one">
          <TDComboBox
            v-model="groupId"
            :placeHolder="$t('i18nCommon.APIMocking.groupName')"
            :options="allGroupOptions"
            :noMargin="true"
            :width="120"
            :isEditable="false"
            :borderRadiusPosition="[
              $tdEnum.BorderRadiusPosition.TopLeft,
              $tdEnum.BorderRadiusPosition.BottomLeft,
            ]"
          ></TDComboBox>
          <TDInput
            v-model="requestName"
            :placeHolder="$t('i18nCommon.APIMocking.requestName')"
            :noMargin="true"
            :borderRadiusPosition="[
              $tdEnum.BorderRadiusPosition.TopRight,
              $tdEnum.BorderRadiusPosition.BottomRight,
            ]"
          ></TDInput>
        </div>
        <TDButton
          v-if="currentMockId"
          :noMargin="true"
          @click="saveRequest"
          iconClass="td-save-icon"
          v-tooltip="$t('i18nCommon.APIMocking.save')"
        />
        <TDButton
          v-else
          :noMargin="true"
          @click="saveRequest"
          iconClass="td-save-icon"
          v-tooltip="$t('i18nCommon.APIMocking.addNew')"
        />
        <TDButton
          v-if="currentMockId"
          @click="createNewMock"
          :type="$tdEnum.buttonType.secondary"
          :noMargin="true"
          iconClass="td-new-file-icon"
          v-tooltip="$t('i18nCommon.APIMocking.createNew')"
        ></TDButton>
        <TDButton
          v-if="currentMockId"
          @click="copyCURL"
          :type="$tdEnum.buttonType.secondary"
          :noMargin="true"
          iconClass="td-copy-icon"
          v-tooltip="$t('i18nCommon.APIMocking.copyCURL')"
        ></TDButton>
      </div>
      <div class="flex td-mocking-header">
        <div class="flex flex-one">
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
          <!-- base url -->
          <div
            class="flex td-base-url"
            @click="copyBaseURL"
            v-tooltip="$t('i18nCommon.APIMocking.APIMockBaseURL')"
          >
            <span>{{ mockBaseUrl }}</span>
          </div>
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
        <TDButton
          :noMargin="true"
          :type="$tdEnum.buttonType.secondary"
          @click="importMock"
          iconClass="td-import-icon"
          v-tooltip="$t('i18nCommon.APIMocking.tooltipImportMock')"
        ></TDButton>
        <TDButton
          @click="restartMockServer"
          :type="$tdEnum.buttonType.secondary"
          :noMargin="true"
          iconClass="td-reload-icon"
          v-tooltip="$t('i18nCommon.APIMocking.restartMock')"
        ></TDButton>
      </div>
      <div
        class="flex td-mocking-content"
        :class="{ 'flex-col': currentConfigLayout.splitHorizontal }"
      >
        <div
          class="flex flex-col td-mock-request-section"
          :style="requestSectionSizeStyle"
        >
          <TDTextEditor
            v-if="
              currentConfigLayout.currentAPIInfoOption ==
              $tdEnum.APIInfoOption.header
            "
            :isShowHeader="true"
            v-model="headersText"
            :wrapText="currentConfigLayout.wrapText"
            :enableHighlight="true"
            language="text/plan"
            :placeHolder="$t('i18nCommon.apiTesting.headersPlaceholder')"
            :label="$t('i18nCommon.APIMocking.request')"
          >
            <template v-slot:header-main>
              <div class="flex td-header-options">
                <div class="flex td-header-options-left">
                  <span class="td-header-option active">{{
                    $t("i18nCommon.apiTesting.changeToViewHeader")
                  }}</span>
                  <span
                    class="td-header-option"
                    @click="changeToViewBodyRequest"
                    v-tooltip="$t('i18nCommon.apiTesting.clickToViewBody')"
                    >{{ $t("i18nCommon.apiTesting.changeToViewBody") }}</span
                  >
                </div>
              </div>
            </template>
          </TDTextEditor>
          <TDTextEditor
            v-if="
              currentConfigLayout.currentAPIInfoOption ==
              $tdEnum.APIInfoOption.body
            "
            :isShowHeader="true"
            v-model="bodyText"
            :wrapText="currentConfigLayout.wrapText"
            :enableHighlight="true"
            language="json"
            :placeHolder="$t('i18nCommon.APIMocking.bodyPlaceholder')"
            :label="$t('i18nCommon.APIMocking.request')"
          >
            <template v-slot:header-main>
              <div class="flex td-header-options">
                <div class="flex td-header-options-left">
                  <span
                    class="td-header-option"
                    @click="changeToViewHeaderRequest"
                    v-tooltip="$t('i18nCommon.apiTesting.clickToViewHeader')"
                    >{{ $t("i18nCommon.apiTesting.changeToViewHeader") }}</span
                  >
                  <span class="td-header-option active">{{
                    $t("i18nCommon.apiTesting.changeToViewBody")
                  }}</span>
                </div>
              </div>
            </template>
          </TDTextEditor>
        </div>
        <TDResizer
          :direction="
            currentConfigLayout.splitHorizontal ? 'vertical' : 'horizontal'
          "
          @resize="handleResize"
        />
        <div
          class="flex flex-col td-mock-response-section"
          :style="responseSectionSizeStyle"
        >
          <TDTextEditor
            v-if="
              currentConfigLayout.currentAPIResponseInfoOption ==
              $tdEnum.APIInfoOption.header
            "
            :isShowHeader="true"
            v-model="responseHeadersText"
            :wrapText="currentConfigLayout.wrapText"
            :enableHighlight="true"
            language="text/plan"
            :placeHolder="
              $t('i18nCommon.apiTesting.responseHeadersPlaceholder')
            "
            :label="$t('i18nCommon.APIMocking.response')"
          >
            <template v-slot:header-main>
              <div class="flex td-header-options">
                <div class="flex td-header-options-left">
                  <span class="td-header-option active">{{
                    $t("i18nCommon.apiTesting.changeToViewHeaderResponse")
                  }}</span>
                  <span
                    class="td-header-option"
                    @click="changeToViewBodyResponse"
                    v-tooltip="
                      $t('i18nCommon.apiTesting.clickToViewBodyResponse')
                    "
                    >{{
                      $t("i18nCommon.apiTesting.changeToViewBodyResponse")
                    }}</span
                  >
                </div>
                <div class="flex td-header-options-right">
                  <span class="td-response-status-label">{{
                    $t("i18nCommon.APIMocking.status")
                  }}</span>
                  <input
                    class="td-response-status-input"
                    type="number"
                    v-model.number="statusCode"
                    v-tooltip="$t('i18nCommon.apiTesting.statusCodeTooltip')"
                  />
                </div>
              </div>
            </template>
          </TDTextEditor>
          <TDTextEditor
            v-if="
              currentConfigLayout.currentAPIResponseInfoOption ==
              $tdEnum.APIInfoOption.body
            "
            :isShowHeader="true"
            v-model="responseText"
            :wrapText="currentConfigLayout.wrapText"
            :enableHighlight="true"
            language="json"
            :placeHolder="$t('i18nCommon.APIMocking.responsePlaceholder')"
            :label="$t('i18nCommon.APIMocking.response')"
          >
            <template v-slot:header-main>
              <div class="flex td-header-options">
                <div class="flex td-header-options-left">
                  <span
                    class="td-header-option"
                    @click="changeToViewHeaderResponse"
                    v-tooltip="
                      $t('i18nCommon.apiTesting.clickToViewHeaderResponse')
                    "
                    >{{
                      $t("i18nCommon.apiTesting.changeToViewHeaderResponse")
                    }}</span
                  >
                  <span class="td-header-option active">{{
                    $t("i18nCommon.apiTesting.changeToViewBodyResponse")
                  }}</span>
                </div>
                <div class="flex td-header-options-right">
                  <span class="td-response-status-label">{{
                    $t("i18nCommon.APIMocking.status")
                  }}</span>
                  <input
                    class="td-response-status-input"
                    type="number"
                    v-model.number="statusCode"
                    v-tooltip="$t('i18nCommon.apiTesting.statusCodeTooltip')"
                  />
                </div>
              </div>
            </template>
          </TDTextEditor>
        </div>
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
        <!-- phần help -->
        <div
          class="td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.APISidebarOption.Help
          "
        >
          <TDAPIMockingHelp />
        </div>
        <!-- phần bộ sưu tập các request -->
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.APISidebarOption.Collection
          "
        >
          <!-- phần header của bộ sưu tập request (Quản lý nhóm) -->
          <div class="flex td-header-collection">
            <div class="td-new-collection">
              <TDInput
                v-model="newGroupName"
                :noMargin="true"
                :placeHolder="$t('i18nCommon.APIMocking.groupName')"
              />
            </div>
            <TDButton
              :noMargin="true"
              @click="addNewGroup"
              :type="$tdEnum.buttonType.secondary"
              iconClass="td-plus-icon"
              v-tooltip="$t('i18nCommon.apiTesting.add')"
            />
            <TDButton
              :noMargin="true"
              @click="loadAllMockAPIs"
              :type="$tdEnum.buttonType.secondary"
              iconClass="td-reload-icon"
              v-tooltip="$t('i18nCommon.APIMocking.refresh')"
            />
          </div>
          <!-- danh sách các mock API được nhóm theo group_name -->
          <div class="td-collection">
            <div class="flex flex-col response-loading" v-if="isLoading">
              <div class="loader"></div>
            </div>
            <div class="td-collection-body" v-else>
              <div
                v-for="(group, index) in groupedMockAPIs"
                class="flex flex-col no-select td-collection-item"
                :key="index"
              >
                <!-- phần tên nhóm -->
                <div
                  class="flex td-collection-header"
                  @click="toggleGroup(group.name)"
                >
                  <div class="flex text-nowrap td-collection-header-left">
                    <TDArrow
                      :openProp="openGroups[group.name]"
                      :arrowOpenDirection="$tdEnum.Direction.bottom"
                      :arrowDirection="$tdEnum.Direction.right"
                    />
                    <div class="" v-tooltip="group.name || 'Ungrouped'">
                      {{ group.name || "Ungrouped" }}
                    </div>
                  </div>
                  <div class="flex td-collection-edit-btn" v-if="group.name">
                    <div
                      v-tooltip="$t('i18nCommon.APIMocking.delete')"
                      class="td-icon td-close-icon"
                      @click.stop="deleteGroupByName(group.name)"
                    ></div>
                  </div>
                </div>
                <!-- danh sách các mock API trong nhóm -->
                <div
                  v-if="
                    openGroups[group.name] &&
                    group.items &&
                    group.items.length > 0
                  "
                  class="flex flex-col td-collection-content"
                >
                  <div
                    v-for="(mock, index) in group.items"
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
                    <span class="td-collection-item-edit-btn">
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
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDArrow from "@/components/TDArrow.vue";
import TDServerMockAPI from "@/common/api/request/AgentAPI/TDServerMockAPI.js";
import TDAutomation from "@/common/automation/TDAutomation.js";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDAPIMockingHelp from "@/views/helps/TDAPIMockingHelp.vue";
export default {
  extends: TDToolBase,
  name: "TDAPIMocking",
  components: { TDSubSidebar, TDArrow, TDAPIMockingHelp },
  watch: {
    requestName(oldVal, newVal) {
      if (oldVal != newVal) {
        this.reBuildTabTitle(this.requestName);
      }
    },
  },
  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.APIMockConfigLayout,
      apiUrl: "",
      requestName: "",
      groupId: "",
      httpMethod: "GET",
      headersText: "",
      bodyText: "",
      responseText: "",
      responseHeadersText: "",
      statusCode: null,
      currentMockId: null,
      allMockAPIs: [],
      openGroups: {},
      mockBaseUrl: null,
      methodOptions: [
        { value: "GET", label: "GET" },
        { value: "POST", label: "POST" },
        { value: "PUT", label: "PUT" },
        { value: "PATCH", label: "PATCH" },
        { value: "DELETE", label: "DELETE" },
        { value: "HEAD", label: "HEAD" },
        {
          value: "OPTIONS",
          label: "OPTIONS",
        },
      ],
      currentConfigLayout: {
        wrapText: true,
        splitHorizontal: false,
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.APISidebarOption.Collection,
        currentAPIInfoOption: this.$tdEnum.APIInfoOption.body,
        currentAPIResponseInfoOption: this.$tdEnum.APIInfoOption.body,
      },
      newGroupName: "",
      allGroups: [],
      requestSectionSize: 50,
      responseSectionSize: 50,
      agentAPI: null,
      isLoading: false,
    };
  },
  async mounted() {
    this.agentAPI = new TDServerMockAPI();
    await this.loadAllMockAPIs();
  },
  computed: {
    sidebarOptions() {
      let me = this;
      let options = [];
      options.push({
        value: this.$tdEnum.APISidebarOption.Help,
        label: this.$t("i18nCommon.apiMocking.sidebarOption.help"),
        icon: "td-help-icon",
      });
      options.push({
        value: this.$tdEnum.APISidebarOption.Collection,
        label: this.$t("i18nCommon.APIMocking.sidebarOption.collection"),
        icon: "td-folder-icon",
      });
      options.push({
        value: this.$tdEnum.APISidebarOption.Setting,
        label: this.$t("i18nCommon.APIMocking.sidebarOption.setting"),
        icon: "td-setting-icon",
      });
      return options;
    },
    allGroupOptions() {
      return this.allGroups.map((g) => ({
        value: g.id,
        label: g.name,
      }));
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
      let groups = me.allGroups.map((g) => ({
        ...g,
        items: [],
      }));
      // Add 'Ungrouped'
      groups.push({ id: "", name: "", items: [] });

      if (Array.isArray(me.allMockAPIs)) {
        me.allMockAPIs.forEach((mock) => {
          let group = groups.find((g) => g.id === mock.group_id);
          if (group) {
            group.items.push(mock);
          } else {
            // Fallback to ungrouped if ID not found
            let ungrouped = groups.find((g) => g.id === "");
            if (ungrouped) ungrouped.items.push(mock);
          }
        });
      }
      // Filter out empty groups if desired, or keep them.
      // For now, let's keep groups that have items or are real groups (not ungrouped fallback if empty)
      return groups.filter((g) => g.id !== "" || g.items.length > 0);
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
    changeToViewBodyRequest() {
      this.currentConfigLayout.currentAPIInfoOption =
        this.$tdEnum.APIInfoOption.body;
    },
    changeToViewHeaderRequest() {
      this.currentConfigLayout.currentAPIInfoOption =
        this.$tdEnum.APIInfoOption.header;
    },
    changeToViewBodyResponse() {
      this.currentConfigLayout.currentAPIResponseInfoOption =
        this.$tdEnum.APIInfoOption.body;
    },
    changeToViewHeaderResponse() {
      this.currentConfigLayout.currentAPIResponseInfoOption =
        this.$tdEnum.APIInfoOption.header;
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
      me.isLoading = true;
      try {
        // Tải cả danh sách nhóm và danh sách mock
        await Promise.all([
          me.loadAllGroups(),
          me.loadMockData(),
          me.loadMockServerBaseUrl(),
        ]);
      } catch (error) {
        console.error("Lỗi tải mock APIs:", error);
        me.$tdUtility.showErrorNotFoundAgentServer();
      } finally {
        me.isLoading = false;
      }
    },
    async loadMockServerBaseUrl() {
      let me = this;
      let response = await me.agentAPI.getMockBaseURL();
      me.mockBaseUrl = response?.data?.data;
    },
    async loadMockData() {
      let me = this;
      let response = await me.agentAPI.mockItem.getAll();
      let mockData = response?.data?.data ?? [];
      if (response && response.success && Array.isArray(mockData)) {
        me.allMockAPIs.splice(0, me.allMockAPIs.length, ...mockData);
      } else {
        me.allMockAPIs.splice(0, me.allMockAPIs.length);
      }
    },
    async loadAllGroups() {
      let me = this;
      try {
        let response = await me.agentAPI.mockGroup.getAll();
        let groupData = response?.data?.data ?? [];
        if (response && response.success && Array.isArray(groupData)) {
          me.allGroups.splice(0, me.allGroups.length, ...groupData);
        }
      } catch (error) {
        console.error("Lỗi tải nhóm:", error);
      }
    },
    /**
     * Thêm nhóm mới
     */
    async addNewGroup() {
      let me = this;
      if (!me.newGroupName) return;

      try {
        let response = await me.agentAPI.mockGroup.create({
          name: me.newGroupName,
        });
        if (response && response.success && response.data?.success) {
          me.$tdToast.success(
            me.$t("i18nCommon.APIMocking.createGroupSuccess"),
          );
          me.newGroupName = "";
          await me.loadAllGroups();
        }
      } catch (error) {
        me.$tdToast.error(me.$t("i18nCommon.APIMocking.createGroupErr"));
      }
    },
    /**
     * Xóa nhóm theo tên
     */
    async deleteGroupByName(groupName) {
      let me = this;
      let group = me.allGroups.find((g) => g.name === groupName);
      if (!group) return;

      try {
        let response = await me.agentAPI.mockGroup.deleteById(group.id);
        if (response && response.success && response.data?.success) {
          me.$tdToast.success(
            me.$t("i18nCommon.APIMocking.deleteGroupSuccess"),
          );
          await me.loadAllMockAPIs();
        }
      } catch (error) {
        me.$tdToast.error(me.$t("i18nCommon.APIMocking.deleteGroupErr"));
      }
    },
    /**
     * Tải thông tin mock API vào form
     */
    loadMockAPI(mock) {
      let me = this;
      me.currentMockId = mock.id;
      me.requestName = mock.request_name;
      me.groupId = mock.group_id;
      me.httpMethod = mock.method;
      me.apiUrl = mock.end_point;
      me.headersText = mock.headers_text || "";
      me.bodyText = mock.body_text || "";
      me.responseText = mock.response_text || "";
      me.responseHeadersText = mock.response_headers_text || "";
      me.statusCode = mock.status_code || null;
    },
    /**
     * Tạo mới mock API
     */
    createNewMock() {
      let me = this;
      me.currentMockId = null;
      me.requestName = "";
      me.groupId = "";
      me.httpMethod = "GET";
      me.apiUrl = "";
      me.headersText = "";
      me.bodyText = "";
      me.responseText = "";
      me.responseHeadersText = "";
      me.statusCode = null;
    },
    async restartMockServer() {
      let me = this;
      try {
        await me.agentAPI.restartMockServerFromClient();
        me.$tdToast.success(me.$t("i18nCommon.APIMocking.restartedMock"));
      } catch (error) {
        me.$tdUtility.showErrorNotFoundAgentServer();
      }
    },
    /**
     * Lưu hoặc cập nhật mock API
     */
    async saveRequest() {
      let me = this;

      if (!me.requestName || !me.apiUrl || !me.groupId) {
        me.$tdToast.warning(
          me.$t("i18nCommon.APIMocking.requestNameAndApiUrlRequired"),
        );
        return;
      }

      let mockData = {
        request_name: me.requestName,
        group_id: me.groupId,
        method: me.httpMethod,
        end_point: me.apiUrl,
        headers_text: me.headersText,
        body_text: me.bodyText,
        response_text: me.responseText,
        response_headers_text: me.responseHeadersText,
        status_code: me.statusCode,
      };

      try {
        if (me.currentMockId) {
          // Cập nhật
          mockData.id = me.currentMockId;
          let response = await me.agentAPI.mockItem.update(mockData);
          if (response && response.success && response.data?.success) {
            me.$tdToast.success(
              me.$t("i18nCommon.APIMocking.updateMockSuccess"),
            );
            await me.loadAllMockAPIs();
          }
        } else {
          // Tạo mới
          let response = await me.agentAPI.mockItem.create(mockData);
          if (response && response.success && response.data?.success) {
            me.$tdToast.success(
              me.$t("i18nCommon.APIMocking.createMockSuccess"),
            );
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
     * copy curl mock api
     */
    copyCURL() {
      let me = this;
      if (me.currentMockId) {
        let me = this;
        let curlContent = TDAutomation.stringifyCURL(me.getRequestObj());
        me.$tdUtility.copyToClipboard(curlContent);
      }
    },
    copyBaseURL() {
      let me = this;
      if (me.mockBaseUrl) {
        let me = this;
        me.$tdUtility.copyToClipboard(me.mockBaseUrl);
      }
    },
    getRequestObj() {
      let me = this;
      let apiUrl = me.mockBaseUrl + me.apiUrl;
      return {
        apiUrl: apiUrl,
        httpMethod: me.httpMethod,
        headersText: me.headersText,
        bodyText: me.bodyText,
      };
    },
    /**
     * mở popup nhập mock
     */
    importMock() {
      let me = this;
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDAPIMokingImportPopup,
        ownerForm: this,
        props: {
          currentConfigLayout: me.currentConfigLayout,
        },
      });
    },
    /**
     * Xóa mock API
     */
    async deleteMockAPI(id) {
      let me = this;
      try {
        let response = await me.agentAPI.mockItem.deleteById(id);
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
@use "@/styles/collection-sub-sidebar.scss";

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
      gap: var(--padding);
    }
    .td-mocking-content {
      flex: 1;
      width: 100%;
      min-height: 0;
      gap: 0;
    }
    .td-mock-request-section,
    .td-mock-response-section {
      width: 100%;
      height: 100%;
      min-height: 0;
      min-width: 0;
    }
  }
}
.response-loading {
  width: 100%;
  height: 100%;
  background-color: var(--bg-layer-color);
  border: 1px solid transparent;
  border-radius: var(--border-radius);
}
.td-sidebar-content {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.td-header-collection {
  gap: var(--padding);
  width: 100%;
  margin-top: var(--padding);
  .td-new-collection {
    flex: 1;
  }
}

.td-plus-icon {
  cursor: pointer;
}
.collection-group-footer {
  gap: var(--padding);
}
.td-base-url {
  background-color: var(--bg-thirt-color);
  height: var(--base-component-height);
  box-sizing: border-box;
  width: fit-content;
  cursor: pointer;
  padding: var(--padding);
  border: 1px solid var(--border-color);
  outline: none;
  font-size: var(--font-size-medium);
}
.td-base-url:hover {
  border: 1px solid var(--focus-color);
}
.td-request-footer-btn {
  cursor: pointer;
}
.td-header-options {
  width: 100%;
  justify-content: space-between;
  gap: var(--padding);
}
.td-header-options-left,
.td-header-options-right {
  align-items: center;
  gap: var(--padding);
}
.td-header-option {
  cursor: pointer;
  color: var(--td-monaco-text-inactive);
  transition: color 0.15s;
}
.td-header-option.active {
  color: var(--td-monaco-text-active);
  font-weight: 600;
}
.td-response-status-label {
  font-size: 12px;
  font-family: "Consolas", "Monaco", monospace;
  opacity: 0.6;
}
.td-response-status-input {
  width: 50px;
  border: none;
  background: transparent;
  color: var(--td-monaco-footer-fg);
  font-size: 12px;
  font-family: "Consolas", "Monaco", monospace;
  font-weight: 600;
  outline: none;
  padding: 0;
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
