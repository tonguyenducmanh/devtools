<template>
  <div class="flex td-mocking-container">
    <!-- phần thao tác chính của tool -->
    <div class="flex flex-col td-mockding-main">
      <div class="flex td-mocking-header">
        <div class="flex flex-one">
          <!-- chọn kiểu body: json hay form data, đổi kiểu thì mở luôn panel tương ứng -->
          <TDComboBox
            :width="100"
            :modelValue="currentBodyType"
            :options="bodyTypeOptions"
            :noMargin="true"
            :isCapitalizeText="false"
            :borderRadiusPosition="[
              $tdEnum.BorderRadiusPosition.TopLeft,
              $tdEnum.BorderRadiusPosition.BottomLeft,
            ]"
            @update:modelValue="changeBodyType"
            v-tooltip="$t('i18nCommon.apiTesting.bodyTypeTooltip')"
          />
          <TDComboBox
            v-model="groupId"
            :placeHolder="$t('i18nCommon.APIMocking.groupName')"
            :options="collectionGroupOptions"
            :noMargin="true"
            :width="120"
            :isEditable="false"
            :noSetBorderRadius="true"
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
            :width="100"
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
              <TDAPIPanelSwitcher
                :currentOption="currentRequestPanelOption"
                :headerOption="$tdEnum.APIInfoOption.header"
                :bodyOption="$tdEnum.APIInfoOption.body"
                @change="changeToViewRequestPanel"
              />
            </template>
          </TDTextEditor>
          <TDTextEditor
            v-else-if="
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
              <TDAPIPanelSwitcher
                :currentOption="currentRequestPanelOption"
                :headerOption="$tdEnum.APIInfoOption.header"
                :bodyOption="$tdEnum.APIInfoOption.body"
                @change="changeToViewRequestPanel"
              />
            </template>
          </TDTextEditor>
          <TDAPIFormDataEditor v-else v-model="formData">
            <template v-slot:header>
              <TDAPIPanelSwitcher
                :currentOption="currentRequestPanelOption"
                :headerOption="$tdEnum.APIInfoOption.header"
                :bodyOption="$tdEnum.APIInfoOption.body"
                @change="changeToViewRequestPanel"
              />
            </template>
          </TDAPIFormDataEditor>
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
              <TDAPIPanelSwitcher
                :currentOption="
                  currentConfigLayout.currentAPIResponseInfoOption
                "
                :headerOption="$tdEnum.APIInfoOption.header"
                :bodyOption="$tdEnum.APIInfoOption.body"
                :isResponse="true"
                @change="changeToViewResponsePanel"
              >
                <template v-slot:right>
                  <span class="td-response-status-label">{{
                    $t("i18nCommon.APIMocking.status")
                  }}</span>
                  <input
                    class="td-response-status-input"
                    type="number"
                    v-model.number="statusCode"
                    v-tooltip="$t('i18nCommon.apiTesting.statusCodeTooltip')"
                  />
                </template>
              </TDAPIPanelSwitcher>
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
              <TDAPIPanelSwitcher
                :currentOption="
                  currentConfigLayout.currentAPIResponseInfoOption
                "
                :headerOption="$tdEnum.APIInfoOption.header"
                :bodyOption="$tdEnum.APIInfoOption.body"
                :isResponse="true"
                @change="changeToViewResponsePanel"
              >
                <template v-slot:right>
                  <span class="td-response-status-label">{{
                    $t("i18nCommon.APIMocking.status")
                  }}</span>
                  <input
                    class="td-response-status-input"
                    type="number"
                    v-model.number="statusCode"
                    v-tooltip="$t('i18nCommon.apiTesting.statusCodeTooltip')"
                  />
                </template>
              </TDAPIPanelSwitcher>
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
        <!-- phần bộ sưu tập các mock API.
             Dùng chung component collection, backend trả về cây group + item đã gom sẵn -->
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.APISidebarOption.Collection
          "
        >
          <TDCollectionList
            :groups="collectionGroups"
            :selectedItemId="currentMockId"
            :isLoading="isLoadingCollection"
            itemNameKey="request_name"
            :allowEditItem="false"
            :defaultOpen="false"
            @refresh="loadAllMockAPIs"
            @add-group="handleAddCollectionGroup"
            @rename-group="renameCollectionGroup"
            @delete-group="deleteCollectionGroup"
            @add-item="addMockInGroup"
            @select-item="loadMockAPI"
            @delete-item="handleDeleteMockAPI"
          />
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
import TDCollectionList from "@/components/TDCollectionList.vue";
import TDCollectionMixin from "@/mixins/TDCollectionMixin.js";
import TDServerMockAPI from "@/common/api/request/AgentAPI/TDServerMockAPI.js";
import TDAutomation from "@/common/automation/TDAutomation.js";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDAPIMockingHelp from "@/views/helps/TDAPIMockingHelp.vue";
import TDAPIFormDataEditor from "@/views/tools/APITesting/TDAPIFormDataEditor.vue";
import TDAPIPanelSwitcher from "@/views/tools/APITesting/TDAPIPanelSwitcher.vue";
import TDAPIFormDataMixin from "@/mixins/TDAPIFormDataMixin.js";
export default {
  extends: TDToolBase,
  mixins: [TDCollectionMixin, TDAPIFormDataMixin],
  name: "TDAPIMocking",
  components: {
    TDSubSidebar,
    TDCollectionList,
    TDAPIMockingHelp,
    TDAPIFormDataEditor,
    TDAPIPanelSwitcher,
  },
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
        // kiểu body đang dùng, độc lập với việc đang xem header hay body
        currentBodyType: this.$tdEnum.APIBodyType.json,
      },
      requestSectionSize: 50,
      responseSectionSize: 50,
      agentAPI: null,
    };
  },
  async mounted() {
    let me = this;
    me.agentAPI = new TDServerMockAPI();
    // Trỏ 2 API vào mixin để nó gọi get_tree / create / update / delete
    me.collectionItemAPI = me.agentAPI.mockItem;
    me.collectionGroupAPI = me.agentAPI.mockGroup;
    // Đọc xong cache layout rồi mới chuẩn hoá được kiểu body
    await me.configLayoutLoaded;
    me.syncBodyTypeFromPanel();
    await me.loadAllMockAPIs();
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
    /**
     * Đổi kiểu body từ combo box ở header, đồng thời mở panel tương ứng
     */
    changeBodyType(bodyType) {
      this.applyBodyTypeOption(bodyType);
    },
    /**
     * Quay lại panel body, giữ nguyên kiểu body đang dùng
     */
    changeToViewRequestPanel(option) {
      let me = this;
      // sang panel body thì giữ nguyên kiểu body đang dùng, json hay form data
      let bodyOption = me.isFormDataRequest
        ? me.$tdEnum.APIInfoOption.bodyFormData
        : me.$tdEnum.APIInfoOption.body;
      me.currentConfigLayout.currentAPIInfoOption =
        option == me.$tdEnum.APIInfoOption.body ? bodyOption : option;
      me.updateConfigLayout();
    },
    changeToViewResponsePanel(option) {
      let me = this;
      me.currentConfigLayout.currentAPIResponseInfoOption = option;
      me.updateConfigLayout();
    },
    /**
     * Tải cây group + mock và base url của mock server.
     * Cây do TDCollectionMixin gọi 1 request get_tree, không còn gọi 2 API rồi ghép tay.
     */
    async loadAllMockAPIs() {
      let me = this;
      await Promise.all([
        me.loadCollection(),
        me.loadMockServerBaseUrl(),
      ]);
    },
    async loadMockServerBaseUrl() {
      let me = this;
      let response = await me.agentAPI.getMockBaseURL();
      me.mockBaseUrl = response?.data?.data;
    },
    /**
     * Nút "+" trên 1 group: tạo mock mới và gán thẳng vào group đó.
     *
     * Nhóm ảo "Ungrouped" không có group_id thật, mà mock bắt buộc phải thuộc 1
     * group thật nên bấm "+" ở đây sẽ hỏi chọn/tạo group thay vì để trống.
     */
    addMockInGroup(group) {
      let me = this;
      if (!group?.groupId) {
        me.openPickGroupForNewMock();
        return;
      }
      me.groupId = group.groupId;
      me.currentMockId = null;
      me.requestName = "";
    },

    /**
     * Popup chọn / tạo group cho mock mới
     */
    openPickGroupForNewMock() {
      let me = this;
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDCollectionPickerPopup,
        ownerForm: me,
        props: {
          groups: me.collectionGroups,
          showItemCount: false,
        },
        param: {
          createLabelTemplate: me.$t("i18nCommon.collection.createGroupNamed"),
        },
        callback: async (payload) => {
          if (payload?.groupId) {
            me.applyPickedGroup(payload.groupId);
          } else if (payload?.newGroupName) {
            let group = await me.createCollectionGroup(payload.newGroupName);
            if (group) me.applyPickedGroup(group.groupId);
          }
        },
      });
    },

    /**
     * Gán group vừa chọn và bắt đầu tạo mock mới
     */
    applyPickedGroup(groupId) {
      let me = this;
      me.groupId = groupId;
      me.currentMockId = null;
      me.requestName = "";
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
      // mock dạng form data lưu body_text = null, gán rỗng cho editor
      me.bodyText = mock.body_text || "";
      me.formData = me.parseFormDataFromText(mock.form_data_text);
      me.applyBodyTypeOption(mock.body_type);
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
      me.formData = [];
      me.applyBodyTypeOption(me.$tdEnum.APIBodyType.json);
      me.responseText = "";
      me.responseHeadersText = "";
      me.statusCode = null;
    },
    /**
     * Mở đúng chế độ xem theo kiểu body của mock vừa nạp vào
     */
    applyBodyTypeOption(bodyType) {
      let me = this;
      let isFormData = bodyType == me.$tdEnum.APIBodyType.formData;
      me.currentConfigLayout.currentBodyType = isFormData
        ? me.$tdEnum.APIBodyType.formData
        : me.$tdEnum.APIBodyType.json;
      me.currentConfigLayout.currentAPIInfoOption = isFormData
        ? me.$tdEnum.APIInfoOption.bodyFormData
        : me.$tdEnum.APIInfoOption.body;
      me.updateConfigLayout();
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
        ...me.buildBodyDataForSave(),
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
        // body dạng form data thì không dùng bodyText, giống hệt lưu xuống database
        bodyText: me.isFormDataRequest ? null : me.bodyText,
        formData: me.isFormDataRequest ? me.buildFormDataForSave() : null,
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
     * Xóa mock API.
     * Việc hỏi xác nhận + xóa + reload cây do TDCollectionMixin lo.
     */
    async handleDeleteMockAPI(mock) {
      await this.deleteCollectionItem(mock);
    },

    /**
     * Xóa xong mới reset form, và chỉ khi form đang mở đúng mock vừa xóa.
     * Reset trước khi xác nhận sẽ mất dữ liệu người dùng dù họ bấm Cancel.
     */
    onCollectionItemDeleted(mock) {
      let me = this;
      if (me.currentMockId === mock.id) {
        me.createNewMock();
      }
    },

    /**
     * Xóa nhóm sẽ xóa luôn các mock bên trong. Nếu mock đang mở nằm trong nhóm
     * vừa xóa thì phải reset form, không thì Save sẽ lưu nhầm / im lặng không làm gì.
     */
    onCollectionGroupDeleted() {
      let me = this;
      if (!me.currentMockId) return;
      if (!me.findCollectionGroupByItemId(me.currentMockId)) {
        me.createNewMock();
      }
    },

    /**
     * Tên hiển thị của mock, dùng cho toast xác nhận xoá
     */
    getCollectionItemName(mock) {
      return mock?.request_name ?? "";
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
.td-sidebar-content {
  flex: 1;
  width: 100%;
  min-height: 0;
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
