<template>
  <div class="flex td-api-container">
    <div class="flex flex-col td-api-testing">
      <!-- Header -->
      <div class="flex td-api-header-group">
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
          <TDInput
            v-model="requestName"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.apiTesting.requestName')"
            :borderRadiusPosition="[
              $tdEnum.BorderRadiusPosition.TopRight,
              $tdEnum.BorderRadiusPosition.BottomRight,
            ]"
          ></TDInput>
        </div>
        <TDButton
          v-if="isLoading"
          :noMargin="true"
          @click="handleCancelRequest"
          :type="$tdEnum.buttonType.secondary"
          iconClass="td-cancel-icon"
          v-tooltip="$t('i18nCommon.apiTesting.cancel')"
        />
        <TDButton
          v-else
          :noMargin="true"
          @click="handleSend"
          iconClass="td-send-icon"
          v-tooltip="$t('i18nCommon.apiTesting.send')"
        ></TDButton>
        <TDButton
          :noMargin="true"
          @click="handleDownloadReponse"
          :type="$tdEnum.buttonType.secondary"
          iconClass="td-download-icon"
          v-tooltip="$t('i18nCommon.apiTesting.downloadReponse')"
        ></TDButton>
        <TDButton
          @click="copyCURLFromNormalMode"
          :type="$tdEnum.buttonType.secondary"
          :noMargin="true"
          :readOnly="!(apiUrl && httpMethod) || isLoading"
          iconClass="td-export-icon"
          v-tooltip="$t('i18nCommon.apiTesting.copyCURLFromAPI')"
        ></TDButton>
        <TDButton
          v-if="currentRequestId"
          :readOnly="isLoadingCollection"
          @click="createNewRequest"
          :type="$tdEnum.buttonType.secondary"
          :noMargin="true"
          iconClass="td-new-file-icon"
          v-tooltip="$t('i18nCommon.apiTesting.createNewRequest')"
        ></TDButton>
        <TDButton
          :readOnly="isLoadingCollection || !requestName"
          @click="saveRequest"
          :type="$tdEnum.buttonType.secondary"
          :noMargin="true"
          iconClass="td-save-icon"
          v-tooltip="$t('i18nCommon.apiTesting.save')"
        ></TDButton>
      </div>
      <!-- Content -->
      <div class="td-api-content">
        <div class="flex td-api-info-btn">
          <div class="flex flex-one">
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
            <TDInput
              v-model="apiUrl"
              :placeHolder="$t('i18nCommon.apiTesting.urlPlaceholder')"
              :noMargin="true"
              :borderRadiusPosition="[
                $tdEnum.BorderRadiusPosition.TopRight,
                $tdEnum.BorderRadiusPosition.BottomRight,
              ]"
            ></TDInput>
            <div class="flex td-import-request-group">
              <TDButton
                @click="openFormImportCURL"
                :type="$tdEnum.buttonType.secondary"
                :noMargin="true"
                :readOnly="isLoading"
                iconClass="td-import-icon"
                v-tooltip="$t('i18nCommon.apiTesting.CURL')"
              >
              </TDButton>
              <TDButton
                :noMargin="true"
                :readOnly="!responseText"
                @click="copyMockData"
                :type="$tdEnum.buttonType.secondary"
                iconClass="td-copy-icon"
                v-tooltip="$t('i18nCommon.apiTesting.copyMockData')"
              ></TDButton>
              <TDUpload
                v-tooltip="{
                  text: $t('i18nCommon.apiTesting.importCollectionZipTooltip'),
                  maxWidth: '500px',
                }"
                iconClass="td-upload-icon"
                :accept="'.zip'"
                @change="importCollectionZip"
                ref="uploadArea"
                :isShowSelect="false"
              />
              <TDUpload
                v-tooltip="{
                  text: $t(
                    'i18nCommon.apiTesting.importCollectionPostmanTooltip',
                  ),
                  maxWidth: '500px',
                }"
                :accept="'.json'"
                iconClass="td-postman-icon"
                @change="importCollectionPostman"
                ref="uploadAreaPostman"
                :isShowSelect="false"
                :multiple="true"
              />
            </div>
          </div>
        </div>
        <div
          class="flex td-api-input-area"
          :class="{ 'flex-col': currentConfigLayout.splitHorizontal }"
        >
          <div
            class="flex flex-col td-api-request"
            :style="requestSectionSizeStyle"
          >
            <TDTextEditor
              v-if="
                currentConfigLayout.currentAPIInfoOption ==
                $tdEnum.APIInfoOption.header
              "
              :isShowHeader="true"
              v-model="headersText"
              :enableHighlight="true"
              language="text/plan"
              :wrapText="currentConfigLayout.wrapText"
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
              :placeHolder="$t('i18nCommon.apiTesting.bodyPlaceholder')"
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
            <TDAPIFormDataEditor
              v-else
              v-model="formData"
              :isReadFileContent="true"
            >
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
            v-if="currentConfigLayout.showReponse"
            :direction="
              currentConfigLayout.splitHorizontal ? 'vertical' : 'horizontal'
            "
            @resize="handleResize"
          />
          <div
            v-if="currentConfigLayout.showReponse"
            class="flex flex-col td-api-response"
            :style="responseSectionSizeStyle"
          >
            <TDAPIResponse
              :statusCode="statusCode"
              :responseTime="responseTime"
              :isLoading="isLoading"
              :responseText="responseText"
              :responseHeadersText="responseHeadersText"
              :currentConfigLayout="currentConfigLayout"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- Sidebar -->
    <TDSubSidebar
      ref="subSidebar"
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
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
        <!-- Help -->
        <div
          class="td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.APISidebarOption.Help
          "
        >
          <TDAPITestingHelp />
        </div>
        <!-- Collection: danh sách nhóm + request.
             Dùng chung component collection, backend trả về cây đã gom sẵn -->
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.APISidebarOption.Collection
          "
        >
          <TDCollectionList
            :groups="collectionGroups"
            :selectedItemId="currentRequestId"
            :isLoading="isLoadingCollection"
            itemNameKey="request_name"
            :allowEditItem="false"
            :defaultOpen="false"
            @refresh="loadCollection"
            @add-group="handleAddCollectionGroup"
            @rename-group="renameCollectionGroup"
            @delete-group="deleteCollectionGroup"
            @add-item="createNewRequestInGroup"
            @select-item="applyRequest"
            @delete-item="deleteCollectionItem"
          />
        </div>
        <!-- Settings -->
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
            v-model="currentConfigLayout.showReponse"
            :label="$t('i18nCommon.apiTesting.showReponse')"
            @change="updateConfigLayout"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.splitHorizontal"
            :label="$t('i18nCommon.splitHorizontal')"
            @change="updateConfigLayout"
          ></TDCheckbox>
        </div>
        <!-- History -->
        <div
          class="td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.APISidebarOption.History
          "
        >
          <TDHistorySidebar
            ref="history"
            :applyFunction="handleSendRequestFromHistory"
            titleKey="requestName"
            :noMargin="true"
            :positionRelative="false"
            :cacheKey="$tdEnum.cacheConfig.APIHistory"
            :historyContainerStyleEnum="
              $tdEnum.AbsolutePositionStyle.Top100Left
            "
          ></TDHistorySidebar>
        </div>
      </template>
    </TDSubSidebar>
  </div>
</template>

<script>
import TDAutomation from "@/common/automation/TDAutomation.js";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDCollectionList from "@/components/TDCollectionList.vue";
import TDCollectionMixin from "@/mixins/TDCollectionMixin.js";
import JSZip from "jszip";
import TDHistorySidebar from "@/components/TDHistorySidebar.vue";
import TDAPIResponse from "@/views/tools/APITesting/TDAPIResponse.vue";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";
import TDServerTestingAPI from "@/common/api/request/AgentAPI/TDServerTestingAPI.js";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDAPITestingHelp from "@/views/helps/TDAPITestingHelp.vue";
import _ from "@/common/TDCommonFunction.js";
import { TDShortcutActionEnum } from "@/common/TDShortcutAction.js";
import TDAPIFormDataEditor from "@/views/tools/APITesting/TDAPIFormDataEditor.vue";
import TDAPIPanelSwitcher from "@/views/tools/APITesting/TDAPIPanelSwitcher.vue";
import TDAPIFormDataMixin from "@/mixins/TDAPIFormDataMixin.js";
export default {
  extends: TDToolBase,
  mixins: [TDCollectionMixin, TDAPIFormDataMixin],
  name: "TDAPITesting",
  components: {
    TDSubSidebar,
    TDCollectionList,
    TDAPIResponse,
    TDHistorySidebar,
    TDAPITestingHelp,
    TDAPIFormDataEditor,
    TDAPIPanelSwitcher,
  },

  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.APIConfigLayout,
      apiUrl: "",
      requestName: "",
      currentRequestId: null,
      httpMethod: "GET",
      headersText: "Content-Type: application/json",
      bodyText: "",
      responseText: "",
      responseHeadersText: null,
      statusCode: null,
      responseTime: null,
      isLoading: false,
      startTime: null,
      currentRequest: null,
      currentConfigLayout: {
        showReponse: true,
        wrapText: true,
        splitHorizontal: false,
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.APISidebarOption.Setting,
        currentAPIInfoOption: this.$tdEnum.APIInfoOption.body,
        currentAPIResponseInfoOption: this.$tdEnum.APIInfoOption.body,
        // kiểu body đang dùng, độc lập với việc đang xem header hay body
        currentBodyType: this.$tdEnum.APIBodyType.json,
      },
      curlContent: "",
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
      requestSectionSize: 50,
      responseSectionSize: 50,
      agentAPI: null,
      // group được chọn sẵn khi bấm "+" trên 1 group, dùng khi lưu request mới
      pendingGroupId: "",
    };
  },
  created() {
    let me = this;
    me.debouncedHandleSend = _.debounce(me.handleSend, 300);
    // cache cũ chưa có currentBodyType, đồng bộ theo panel đang mở
    if (
      me.currentConfigLayout.currentAPIInfoOption ==
      me.$tdEnum.APIInfoOption.bodyFormData
    ) {
      me.currentConfigLayout.currentBodyType = me.$tdEnum.APIBodyType.formData;
    }
  },
  async mounted() {
    let me = this;
    me.agentAPI = new TDServerTestingAPI();
    // Trỏ 2 API vào mixin để nó gọi get_tree / create / update / delete
    me.collectionItemAPI = me.agentAPI.testingItem;
    me.collectionGroupAPI = me.agentAPI.testingGroup;
    await me.loadCollection();
  },
  watch: {
    requestName(oldVal, newVal) {
      if (oldVal != newVal) {
        this.reBuildTabTitle(this.requestName);
      }
    },
  },
  computed: {
    requestSectionSizeStyle() {
      let me = this;
      let style = {};
      if (me.currentConfigLayout.showReponse) {
        if (me.currentConfigLayout.splitHorizontal) {
          style = { height: `${me.requestSectionSize}%` };
        } else {
          style = { width: `${me.requestSectionSize}%` };
        }
      } else {
        if (me.currentConfigLayout.splitHorizontal) {
          style = { height: `100%` };
        } else {
          style = { width: `100%` };
        }
      }
      return style;
    },
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
    sidebarOptions() {
      let me = this;
      let options = [];
      options.push({
        value: this.$tdEnum.APISidebarOption.Help,
        label: this.$t("i18nCommon.apiTesting.sidebarOption.help"),
        icon: "td-help-icon",
      });
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
      options.push({
        value: this.$tdEnum.APISidebarOption.History,
        label: this.$t("i18nCommon.apiTesting.sidebarOption.history"),
        icon: "td-history-icon",
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
  },
  beforeUnmount() {
    if (this._abortController) {
      this._abortController.abort();
    }
    if (this.debouncedHandleSend?.cancel) {
      this.debouncedHandleSend.cancel();
    }
  },
  methods: {
    getTabLifecycleConfig() {
      let me = this;
      return {
        shortcuts: [
          {
            enum: TDShortcutActionEnum.ExecuteAPITesting,
            config: {
              sortOrder: 100,
              presentKey: [me.$tdUtility.ctrlKey(), me.$tdUtility.enterKey()],
              labelKey: "i18nCommon.shortKeyAction.executeAPITesting",
              action: (event) => {
                if (
                  event &&
                  (event.metaKey || event.ctrlKey) &&
                  event.key === "Enter"
                ) {
                  event.preventDefault();
                  me.debouncedHandleSend();
                }
              },
            },
          },
        ],
        domEvents: [],
      };
    },
    /**
     * Đổi kiểu body từ combo box ở header, đồng thời mở panel tương ứng
     */
    changeBodyType(bodyType) {
      let me = this;
      me.applyBodyTypeOption(bodyType);
      me.updateConfigLayout();
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
    handleResize(sizes) {
      this.requestSectionSize = sizes.leftSize;
      this.responseSectionSize = sizes.rightSize;
    },
    /**
     * Nút "+" trên 1 group: tạo request mới và gán thẳng vào group đó
     */
    createNewRequestInGroup(group) {
      let me = this;
      me.createNewRequest();
      // Group ảo "Ungrouped" không có group_id thật, để trống thì lúc lưu
      // sẽ mở popup chọn collection
      me.pendingGroupId = group?.groupId ?? "";
    },
    /**
     * Nạp 1 request từ cây collection vào form
     */
    applyRequest(request) {
      let me = this;
      me.currentRequestId = request.id;
      me.requestName = request.request_name;
      me.apiUrl = request.end_point;
      me.httpMethod = request.method;
      me.headersText = request.headers_text ?? "";
      // request dạng form data lưu body_text = null, gán rỗng cho editor
      me.bodyText = request.body_text ?? "";
      me.formData = me.parseFormDataFromText(request.form_data_text);
      me.applyBodyTypeOption(request.body_type);
    },
    /**
     * Lưu request. Nếu request đang mở thì update tại chỗ,
     * nếu là request mới thì hỏi user chọn collection để lưu.
     */
    async saveRequest() {
      let me = this;
      if (!me.requestName) return;

      if (me.currentRequestId) {
        let currentGroup = me.findCollectionGroupByItemId(me.currentRequestId);
        if (!currentGroup) return;

        let testData = {
          id: me.currentRequestId,
          request_name: me.requestName,
          group_id: currentGroup.groupId,
          method: me.httpMethod,
          end_point: me.apiUrl,
          headers_text: me.headersText,
          ...me.buildBodyDataForSave(),
        };
        try {
          let response = await me.collectionItemAPI.update(testData);
          if (response?.data?.success) {
            me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
            await me.loadCollection();
          }
        } catch (e) {
          me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
        }
        return;
      }

      // Request mới: nếu đã bấm "+" trên 1 group thì lưu thẳng vào group đó,
      // không cần hỏi lại user chọn collection
      if (me.pendingGroupId) {
        await me.saveRequestToGroup(me.pendingGroupId);
        me.pendingGroupId = "";
        return;
      }

      // Chưa chọn group: mở popup chọn collection
      me.openSaveToCollectionPopup();
    },
    /**
     * Mở popup chọn collection để lưu request mới
     */
    openSaveToCollectionPopup() {
      let me = this;
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDCollectionPickerPopup,
        ownerForm: me,
        props: {
          groups: me.collectionGroups,
          showItemCount: false,
        },
        param: {
          createLabelTemplate: me.$t("i18nCommon.collection.saveToNewCollection"),
        },
        callback: async (payload) => {
          if (payload?.groupId) {
            await me.saveRequestToGroup(payload.groupId);
          } else if (payload?.newGroupName) {
            let group = await me.createCollectionGroup(payload.newGroupName);
            if (group) {
              await me.saveRequestToGroup(group.groupId);
            }
          }
        },
      });
    },
    /**
     * Lưu request hiện tại vào 1 collection
     */
    async saveRequestToGroup(groupId) {
      let me = this;
      let testData = {
        request_name: me.requestName || me.apiUrl,
        group_id: groupId,
        method: me.httpMethod,
        end_point: me.apiUrl,
        headers_text: me.headersText,
        ...me.buildBodyDataForSave(),
      };
      try {
        let response = await me.collectionItemAPI.create(testData);
        if (response?.data?.success) {
          me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
          me.currentRequestId = response.data.data.id;
          await me.loadCollection();
        }
      } catch (e) {
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    /**
     * Tên hiển thị của request, dùng cho toast xác nhận xoá
     */
    getCollectionItemName(request) {
      return request?.request_name ?? "";
    },
    /**
     * Xoá request đang mở thì reset form về trạng thái mới
     */
    onCollectionItemDeleted(request) {
      let me = this;
      if (me.currentRequestId === request.id) {
        me.createNewRequest();
      }
    },

    /**
     * Xoá nhóm sẽ xoá luôn các request bên trong. Request đang mở có thể nằm
     * trong nhóm vừa xoá: phải reset form, không thì nút Save sẽ im lặng
     * không làm gì vì không tìm được group chứa request đó.
     */
    onCollectionGroupDeleted() {
      let me = this;
      if (!me.currentRequestId) return;
      if (!me.findCollectionGroupByItemId(me.currentRequestId)) {
        me.createNewRequest();
      }
    },
    async importCollectionZip() {
      let me = this;
      if (
        me.$refs.uploadArea &&
        typeof me.$refs.uploadArea.getFileSelected == "function" &&
        typeof me.$refs.uploadArea.clearFileSelected == "function"
      ) {
        let zip = new JSZip();
        let files = me.$refs.uploadArea.getFileSelected();
        me.$refs.uploadArea.clearFileSelected();
        if (files && Array.isArray(files) && files.length > 0) {
          let zipData = await zip.loadAsync(files[0]);
          let newCollections = await me.buildCollectionsFromZip(zipData);
          await me.saveImportCollection(newCollections);
        }
      }
    },
    async saveImportCollection(newCollections) {
      let me = this;
      if (!newCollections || newCollections.length === 0) return;

      let groups = [];
      let items = [];

      newCollections.forEach((col) => {
        groups.push({
          id: col.collection_id,
          name: col.name,
        });

        if (col.requests && col.requests.length > 0) {
          col.requests.forEach((req) => {
            items.push({
              id: req.requestId,
              request_name: req.requestName,
              group_id: col.collection_id,
              method: req.httpMethod,
              end_point: req.apiUrl,
              headers_text: req.headersText,
              body_text:
                req.bodyType == me.$tdEnum.APIBodyType.formData
                  ? null
                  : req.bodyText,
              body_type: req.bodyType ?? me.$tdEnum.APIBodyType.json,
              form_data_text: req.formDataText,
            });
          });
        }
      });

      try {
        let response = await me.agentAPI.importTestingDataBatch({
          groups: groups,
          items: items,
        });
        if (response && response.success && response.data?.success) {
          me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
          await me.loadCollection();
        }
      } catch (e) {
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    async buildCollectionsFromZip(zip) {
      let me = this;
      let collections = {};
      let textExtensions = [
        ".txt",
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".json",
        ".md",
        ".sh",
        ".py",
        ".sql",
        ".html",
        ".css",
        ".xml",
        ".yaml",
        ".yml",
        ".cs",
        ".java",
        ".go",
        ".rb",
        ".php",
        ".vue",
        ".env",
        ".conf",
        ".log",
      ];

      for (let file of Object.values(zip.files)) {
        if (file.dir) continue;
        let lowerName = file.name.toLowerCase();
        if (!textExtensions.some((ext) => lowerName.endsWith(ext))) continue;

        let parts = file.name.split("/").filter(Boolean);
        if (parts.length < 2) continue;

        let collectionName = parts[1];
        let fileName = parts.at(-1);
        let requestName = fileName.replace(/\.[^.]+$/, "");

        let content = await file.async("string");

        if (!collections[collectionName]) {
          collections[collectionName] = {
            name: collectionName,
            collection_id: me.$tdUtility.newGuid(),
            openingCollection: false,
            requests: [],
          };
        }
        let curlConent = TDAutomation.parseCURL(content);
        if (curlConent) {
          collections[collectionName].requests.push({
            requestName: requestName,
            apiUrl: curlConent.url,
            bodyText: curlConent.body
              ? JSON.stringify(JSON.parse(curlConent.body), null, 2)
              : null,
            bodyType: curlConent.formData
              ? me.$tdEnum.APIBodyType.formData
              : me.$tdEnum.APIBodyType.json,
            formDataText: curlConent.formData
              ? JSON.stringify(me.buildFormDataForSave(curlConent.formData))
              : null,
            headersText: curlConent.headersText,
            httpMethod: curlConent.method,
            requestId: me.$tdUtility.newGuid(),
          });
        } else {
          console.log("parse error" + content);
        }
      }

      return Object.values(collections);
    },
    async importCollectionPostman() {
      let me = this;
      if (
        me.$refs.uploadAreaPostman &&
        typeof me.$refs.uploadAreaPostman.getFileSelected == "function" &&
        typeof me.$refs.uploadAreaPostman.clearFileSelected == "function"
      ) {
        let files = me.$refs.uploadAreaPostman.getFileSelected();
        me.$refs.uploadArea.clearFileSelected();
        if (files && Array.isArray(files) && files.length > 0) {
          let newCollections = [];
          for (let file of Object.values(files)) {
            if (!file.name.endsWith(".json")) {
              continue;
            }
            let temp = await me.buildCollectionsFromPostman(file, me);
            if (
              temp &&
              Array.isArray(temp.requests) &&
              temp.requests.length > 0
            ) {
              newCollections.push(temp);
            }
          }
          await me.saveImportCollection(newCollections);
        }
      }
    },
    async buildCollectionsFromPostman(file, me) {
      let contentTemp = await file.text();
      let content = JSON.parse(contentTemp);
      let result = null;
      if (
        content &&
        content.item &&
        content.info &&
        Array.isArray(content.item) &&
        content.item.length > 0 &&
        content.info.name
      ) {
        let tempCollection = {
          name: content.info.name,
          collection_id: me.$tdUtility.newGuid(),
          openingCollection: false,
          requests: [],
        };
        content.item.forEach((item) => {
          let bodyText = item?.request?.body?.raw;
          let headerRaw = item?.request?.header;
          let headerText = "";
          if (headerRaw && Array.isArray(headerRaw) && headerRaw.length > 0) {
            let convertHeader = [];
            headerRaw.forEach((headerItem) => {
              convertHeader.push(`${headerItem.key}:${headerItem.value}`);
            });
            if (convertHeader.length > 0) {
              headerText = convertHeader.join("\n");
            }
          }
          // postman lưu body dạng form data ở body.formdata
          let formDataRaw = item?.request?.body?.formdata;
          let isFormData = Array.isArray(formDataRaw) && formDataRaw.length > 0;
          if (item.name && item?.request?.url?.raw) {
            tempCollection.requests.push({
              requestName: item.name,
              apiUrl: item?.request?.url?.raw,
              bodyText: isFormData
                ? null
                : bodyText
                  ? JSON.stringify(JSON.parse(bodyText), null, 2)
                  : null,
              bodyType: isFormData
                ? me.$tdEnum.APIBodyType.formData
                : me.$tdEnum.APIBodyType.json,
              formDataText: isFormData
                ? JSON.stringify(me.buildFormDataForSave(formDataRaw))
                : null,
              headersText: headerText,
              httpMethod: item?.request?.method ?? "GET",
              requestId: me.$tdUtility.newGuid(),
            });
          }
        });
        result = tempCollection;
      }
      return result;
    },
    createNewRequest() {
      let me = this;
      me.requestName = "";
      me.currentRequestId = null;
      // Xoá group đã chọn sẵn, nếu không request tạo sau sẽ bị lưu nhầm
      // vào group đã bấm "+" trước đó
      me.pendingGroupId = "";
      me.apiUrl = null;
      me.httpMethod = "GET";
      me.headersText = "Content-Type: application/json";
      me.bodyText = "";
      me.formData = [];
      me.currentConfigLayout.currentAPIInfoOption =
        me.$tdEnum.APIInfoOption.body;
      me.currentConfigLayout.currentBodyType = me.$tdEnum.APIBodyType.json;
      me.responseText = "";
      me.responseHeadersText = null;
      me.statusCode = null;
      me.responseTime = null;
      me.isLoading = false;
      me.startTime = null;
      me.currentRequest = null;
      me._abortController = null;
      me.curlContent = "";
    },
    formatBody() {
      let me = this;
      if (me.bodyText) {
        me.bodyText = JSON.stringify(JSON.parse(me.bodyText), null, 2);
      }
    },
    /**
     * Chuyển danh sách field form data sang định dạng gửi lên backend
     */
    buildFormDataForRequest() {
      let me = this;
      return me.formData
        .filter((field) => field.key)
        .map((field) => ({
          key: field.key,
          value: field.value,
          type: field.type,
          file_name: field.fileName,
          file_content_type: field.fileContentType,
          file_content: field.fileContent,
        }));
    },
    /**
     * Kiểm tra form data trước khi gửi, trả về thông báo lỗi hoặc null
     * Field dạng file mà chỉ có tên (nạp từ collection hoặc history) thì cần chọn lại file
     */
    validateFormData() {
      let me = this;
      for (let field of me.formData) {
        if (!field.key || field.type != me.$tdEnum.APIFormDataType.file) {
          continue;
        }
        if (!field.fileName) {
          return me
            .$t("i18nCommon.apiTesting.formDataFileMissing")
            .format(field.key);
        }
        if (!field.fileContent) {
          return me
            .$t("i18nCommon.apiTesting.formDataFileNeedReselect")
            .format(field.key);
        }
      }
      return null;
    },
    parseHeaders(headerString) {
      let headers = {};
      if (!headerString) return headers;

      headerString.split("\n").forEach((line) => {
        let trimmed = line.trim();
        if (trimmed) {
          let [key, ...valueParts] = trimmed.split(":");
          if (key && valueParts.length > 0) {
            headers[key.trim()] = valueParts.join(":").trim();
          }
        }
      });

      return headers;
    },
    async handleSend() {
      let me = this;
      await me.handleSendRequest();
    },
    async handleSendRequest() {
      let me = this;

      if (!this.apiUrl) {
        this.$tdToast.error(this.$t("i18nCommon.apiTesting.urlRequired"));
        return;
      }

      // body dạng form data thì kiểm tra field file đã chọn file chưa
      if (this.isFormDataRequest) {
        let messageError = this.validateFormData();
        if (messageError) {
          this.$tdToast.error(messageError);
          return;
        }
      }

      this.isLoading = true;
      this.startTime = performance.now();
      this.responseText = "";
      this.responseHeadersText = null;
      this.statusCode = null;

      try {
        let requestData = {
          api_url: this.apiUrl,
          http_method: this.httpMethod,
          headers_text: this.headersText,
          body_type: this.currentBodyType,
          body_text: this.isFormDataRequest ? null : this.bodyText || null,
          form_data: this.isFormDataRequest
            ? this.buildFormDataForRequest()
            : null,
        };

        this._abortController = new AbortController();
        let res = await new TDServerTestingAPI().executeRequest(
          requestData,
          this._abortController.signal,
        );
        let response = await res.data;

        let endTime = performance.now();
        this.responseTime = Math.round(endTime - this.startTime);
        this.statusCode = response.status;
        this.responseHeadersText = response.headers || null;

        if (typeof response.body === "object") {
          this.responseText = JSON.stringify(response.body, null, 2);
        } else if (typeof response.body === "string") {
          try {
            let parsed = JSON.parse(response.body);
            this.responseText = JSON.stringify(parsed, null, 2);
          } catch {
            this.responseText = response.body;
          }
        } else {
          this.responseText = String(response.body);
        }

        this.$tdToast.success(this.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        if (error.message === "Request cancelled by user") {
          this.responseText = this.$t("i18nCommon.apiTesting.requestCanceled");
          this.$tdToast.success(
            this.$t("i18nCommon.apiTesting.requestCanceled"),
          );
        } else {
          this.responseText = `Error: ${error.message}`;
          this.$tdToast.error(error.message);
        }
      } finally {
        this.isLoading = false;
        this._abortController = null;

        let historyItem = me.buildHistoryItemForSave();
        await me.$refs.history.saveToHistory(historyItem);
      }
    },
    buildHistoryItemForSave() {
      let me = this;
      if (!me.apiUrl && me.curlContent) {
        me.importCURL(true);
      }
      let historyItem = {
        apiUrl: me.apiUrl,
        httpMethod: me.httpMethod,
        headersText: me.headersText,
        bodyText: me.bodyText,
        bodyType: me.currentBodyType,
        // không lưu nội dung file vào history vì base64 quá nặng
        formData: me.buildFormDataForSave(),
        requestName: me.requestName || me.apiUrl,
      };
      return historyItem;
    },
    handleCancelRequest() {
      if (this._abortController) {
        this._abortController.abort();
      }

      this.isLoading = false;
      this._abortController = null;
    },
    handleSendRequestFromHistory(item) {
      let me = this;
      if (item && item.apiUrl) {
        me.apiUrl = item.apiUrl;
        me.httpMethod = item.method ?? item.httpMethod;
        me.headersText = item.headersText;
        // request dạng form data lưu body_text = null, gán rỗng cho editor
        me.bodyText = item.bodyText ?? "";
        me.formData = me.parseFormDataFromHistory(item);
        me.applyBodyTypeOption(item.bodyType);
        me.requestName = item.requestName;
        me.curlContent = TDAutomation.stringifyCURL(me.getRequestObj());
        me.currentRequestId = null;
      }
    },
    /**
     * Lấy danh sách field form data từ item history hoặc item trong collection
     */
    parseFormDataFromHistory(item) {
      let me = this;
      // item trong collection lưu form data dạng text, item history lưu thẳng object
      if (item?.formDataText) {
        return me.parseFormDataFromText(item.formDataText);
      }
      if (Array.isArray(item?.formData)) {
        return item.formData.map((field) => me.createFormField(field));
      }
      return [];
    },
    /**
     * Mở đúng chế độ xem theo kiểu body của request vừa nạp vào
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
    },
    getRequestObj() {
      let me = this;
      return {
        apiUrl: me.apiUrl,
        httpMethod: me.httpMethod,
        headersText: me.headersText,
        // body dạng form data thì không dùng bodyText, giống hệt payload gửi request
        bodyText: me.isFormDataRequest ? null : me.bodyText,
        formData: me.isFormDataRequest ? me.buildFormDataForSave() : null,
      };
    },
    handleDownloadReponse() {
      let me = this;
      if (me.responseText) {
        let encoder = new TextEncoder();
        let buffer = encoder.encode(me.responseText);
        let fileName = me.$tdUtility.createFileDownloadName(me.requestName, {
          ext: ".txt",
        });
        me.$tdUtility.createDownloadFileFromBuffer(
          buffer,
          "text/plain;charset=utf-8",
          fileName,
        );
      }
    },
    openFormImportCURL() {
      let me = this;
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDAPIImportCURLPopup,
        ownerForm: this,
        props: {
          currentConfigLayout: me.currentConfigLayout,
        },
      });
    },
    copyCURLFromNormalMode() {
      let me = this;
      me.curlContent = TDAutomation.stringifyCURL(me.getRequestObj());
      me.$tdUtility.copyToClipboard(me.curlContent);
    },
    importCURL(isSilence = false) {
      let me = this;
      let CURLParsed = TDAutomation.parseCURL(me.curlContent);
      let result = false;
      if (CURLParsed) {
        me.apiUrl = CURLParsed.url;
        if (!isSilence) {
          me.requestName = CURLParsed.url;
        }
        // curl dạng form data không có body text, gán rỗng để không bị undefined
        me.bodyText = CURLParsed.bodyText ?? "";
        me.formData = (CURLParsed.formData ?? []).map((field) =>
          me.createFormField(field),
        );
        me.applyBodyTypeOption(
          CURLParsed.formData
            ? me.$tdEnum.APIBodyType.formData
            : me.$tdEnum.APIBodyType.json,
        );
        me.httpMethod = CURLParsed.method;
        me.headersText = CURLParsed.headersText;
        result = true;
      } else {
        if (!isSilence) {
          me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
        }
        result = false;
      }
      return result;
    },
    copyMockData() {
      let me = this;
      if (me.responseText) {
        let mockData = {};
        mockData.request_name = me.requestName;
        mockData.method = me.httpMethod;
        mockData.api_url = me.apiUrl;
        mockData.headers_text = me.headersText;
        mockData.body_text = me.bodyText;
        mockData.body_type = me.currentBodyType;
        mockData.form_data_text = me.isFormDataRequest
          ? JSON.stringify(me.buildFormDataForSave())
          : null;
        mockData.response_text = me.responseText;
        mockData.response_headers_text = me.responseHeadersText;
        mockData.status_code = me.statusCode;
        me.$tdUtility.copyToClipboard(JSON.stringify(mockData));
      }
    },
  },
};
</script>

<style scoped lang="scss">
.td-api-container {
  width: 100%;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
}

.td-api-testing {
  width: 100%;
  height: 100%;
}

.td-api-content {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;

  .td-api-input-area {
    margin-top: var(--padding);
    flex: 1;

    .td-api-request {
      width: 100%;
      height: 100%;
    }

    .td-api-response {
      width: 100%;
      height: 100%;
    }
  }
}

.td-api-header-group {
  gap: var(--padding);
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
}

.td-api-info-btn {
  margin-top: var(--padding);
  gap: var(--padding);
}

.td-sidebar-content {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.td-import-request-group {
  gap: var(--padding);
  margin-left: var(--padding);
}
</style>
