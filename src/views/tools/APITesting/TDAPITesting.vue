<template>
  <div class="flex td-api-container">
    <div class="flex flex-col td-api-testing">
      <!-- Header -->
      <div class="flex td-api-header-group">
        <div class="flex flex-one">
          <TDInput
            v-model="requestName"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.apiTesting.requestName')"
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
          :readOnly="isLoadingData"
          @click="createNewRequest"
          :type="$tdEnum.buttonType.secondary"
          :noMargin="true"
          iconClass="td-new-file-icon"
          v-tooltip="$t('i18nCommon.apiTesting.createNewRequest')"
        ></TDButton>
        <TDButton
          :readOnly="isLoadingData || !requestName"
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
              ></TDButton>
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
                <div class="flex td-header-options">
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
              </template>
            </TDTextEditor>
            <div
              class="td-text-area-wrap"
              v-if="
                currentConfigLayout.currentAPIInfoOption ==
                $tdEnum.APIInfoOption.body
              "
            >
              <TDTextEditor
                :isShowHeader="true"
                v-model="bodyText"
                :wrapText="currentConfigLayout.wrapText"
                :enableHighlight="true"
                language="json"
                :placeHolder="$t('i18nCommon.apiTesting.bodyPlaceholder')"
                :label="$t('i18nCommon.APIMocking.request')"
              >
                <template v-slot:header-main>
                  <div class="flex td-header-options">
                    <span
                      class="td-header-option"
                      @click="changeToViewHeaderRequest"
                      v-tooltip="$t('i18nCommon.apiTesting.clickToViewHeader')"
                      >{{
                        $t("i18nCommon.apiTesting.changeToViewHeader")
                      }}</span
                    >
                    <span class="td-header-option active">{{
                      $t("i18nCommon.apiTesting.changeToViewBody")
                    }}</span>
                  </div>
                </template>
              </TDTextEditor>
            </div>
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
        <!-- Collection -->
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.APISidebarOption.Collection
          "
        >
          <div class="flex td-header-collection">
            <div class="td-new-collection">
              <TDInput
                v-model="newCollectionName"
                :noMargin="true"
                :placeHolder="$t('i18nCommon.apiTesting.newCollectionName')"
              />
            </div>
            <TDButton
              :noMargin="true"
              @click="addNewCollection"
              :type="$tdEnum.buttonType.secondary"
              iconClass="td-plus-icon"
              v-tooltip="$t('i18nCommon.apiTesting.add')"
            />
            <TDButton
              :noMargin="true"
              @click="loadAllTestingData"
              :type="$tdEnum.buttonType.secondary"
              iconClass="td-reload-icon"
              v-tooltip="$t('i18nCommon.APIMocking.refresh')"
            />
          </div>
          <div class="td-collection">
            <div class="flex flex-col response-loading" v-if="isLoadingData">
              <div class="loader"></div>
            </div>
            <div class="td-collection-body" v-else>
              <div
                v-for="(collection, index) in allCollection"
                class="flex flex-col no-select td-collection-item"
                :key="index"
              >
                <div
                  v-if="collection.is_renaming"
                  class="td-collection-rename"
                >
                  <TDInput
                    v-model="collection.temp_name"
                    :noMargin="true"
                    :placeHolder="
                      $t('i18nCommon.apiTesting.collectionRename')
                    "
                    :ref="collection.temp_name"
                    @keyup.enter="saveNewCollectionName(collection)"
                    @clickOutSide="saveNewCollectionName(collection)"
                  >
                  </TDInput>
                </div>
                <div
                  v-else
                  class="flex td-collection-header"
                  @click="toggleCollection(collection)"
                >
                  <div class="flex text-nowrap td-collection-header-left">
                    <TDArrow
                      :openProp="collection.openingCollection"
                      :arrowOpenDirection="$tdEnum.Direction.bottom"
                      :arrowDirection="$tdEnum.Direction.right"
                    />
                    <div class="" v-tooltip="collection.name">
                      {{ collection.name }}
                    </div>
                  </div>
                  <div class="flex td-collection-edit-btn">
                    <div
                      class="td-icon td-edit-icon"
                      v-tooltip="$t('i18nCommon.edit')"
                      @click.stop="enableRenameCollection(collection)"
                    ></div>
                    <div
                      v-tooltip="$t('i18nCommon.apiTesting.delete')"
                      class="td-icon td-close-icon"
                      @click.stop="deleteCollection(collection.collection_id)"
                    ></div>
                  </div>
                </div>
                <div
                  v-if="
                    collection.openingCollection &&
                    collection.requests &&
                    collection.requests.length > 0
                  "
                  class="flex flex-col td-collection-content"
                >
                  <div
                    v-for="(request, indexRequest) in collection.requests"
                    :key="indexRequest"
                    class="flex td-collection-request-item"
                    :class="{
                      'td-collection-request-item-selected':
                        request && currentRequestId == request.requestId,
                    }"
                    @click="applyRequest(request)"
                  >
                    <span class="text-nowrap">
                      <div v-tooltip="request.requestName">
                        {{ request.requestName }}
                      </div>
                    </span>
                    <span class="td-collection-item-edit-btn">
                      <div
                        class="td-icon td-close-icon"
                        v-tooltip="$t('i18nCommon.apiTesting.delete')"
                        @click.stop="
                          deleteRequest(collection.collection_id, request)
                        "
                      ></div>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
import TDArrow from "@/components/TDArrow.vue";
import JSZip from "jszip";
import TDHistorySidebar from "@/components/TDHistorySidebar.vue";
import TDAPIResponse from "@/views/tools/APITesting/TDAPIResponse.vue";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";
import TDServerTestingAPI from "@/common/api/request/AgentAPI/TDServerTestingAPI.js";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDAPITestingHelp from "@/views/helps/TDAPITestingHelp.vue";
import _ from "@/common/TDCommonFunction.js";
import { TDShortcutActionEnum } from "@/common/TDShortcutAction.js";
export default {
  extends: TDToolBase,
  name: "TDAPITesting",
  components: {
    TDSubSidebar,
    TDArrow,
    TDAPIResponse,
    TDHistorySidebar,
    TDAPITestingHelp,
  },

  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.APIConfigLayout,
      apiUrl: "",
      requestName: "",
      currentRequestId: null,
      newCollectionName: "",
      allCollection: [],
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
      isLoadingData: false,
    };
  },
  created() {
    this.debouncedHandleSend = _.debounce(this.handleSend, 300);
  },
  async mounted() {
    this.agentAPI = new TDServerTestingAPI();
    await this.loadAllTestingData();
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
    changeToViewBodyRequest() {
      let me = this;
      me.currentConfigLayout.currentAPIInfoOption =
        me.$tdEnum.APIInfoOption.body;
      me.updateConfigLayout();
    },
    changeToViewHeaderRequest() {
      let me = this;
      me.currentConfigLayout.currentAPIInfoOption =
        me.$tdEnum.APIInfoOption.header;
      me.updateConfigLayout();
    },
    handleResize(sizes) {
      this.requestSectionSize = sizes.leftSize;
      this.responseSectionSize = sizes.rightSize;
    },
    async addNewCollection(collectionName) {
      let me = this;
      if (typeof collectionName == "string") {
        me.newCollectionName = collectionName;
      }
      if (me.newCollectionName) {
        try {
          let response = await me.agentAPI.testingGroup.create({
            name: me.newCollectionName,
          });
          if (response && response.success && response.data?.success) {
            me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
            me.newCollectionName = "";
            await me.loadAllTestingData();
          }
        } catch (error) {
          me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
        }
      }
    },
    async toggleCollection(collection) {
      if (collection) {
        collection.openingCollection = !collection.openingCollection;
      }
    },
    async loadAllTestingData() {
      let me = this;
      me.isLoadingData = true;
      try {
        let [groupsParams, testsParams] = await Promise.all([
          me.agentAPI.testingGroup.getAll(),
          me.agentAPI.testingItem.getAll(),
        ]);

        let groups = groupsParams?.data?.data || [];
        let tests = testsParams?.data?.data || [];

        let collections = groups.map((g) => ({
          name: g.name,
          collection_id: g.id,
          openingCollection: false,
          requests: [],
          is_renaming: false,
        }));

        tests.forEach((t) => {
          let collection = collections.find(
            (c) => c.collection_id === t.group_id,
          );
          if (collection) {
            collection.requests.push({
              requestName: t.request_name,
              method: t.method,
              apiUrl: t.end_point,
              headersText: t.headers_text,
              bodyText: t.body_text,
              requestId: t.id,
            });
          }
        });

        if (me.allCollection && me.allCollection.length > 0) {
          collections.forEach((newCol) => {
            let oldCol = me.allCollection.find(
              (c) => c.collection_id === newCol.collection_id,
            );
            if (oldCol) {
              newCol.openingCollection = oldCol.openingCollection;
            }
          });
        }

        me.allCollection = collections;
      } catch (error) {
        console.error("Lỗi tải dữ liệu testing:", error);
        me.$tdUtility.showErrorNotFoundAgentServer();
      } finally {
        me.isLoadingData = false;
      }
    },
    applyRequest(request) {
      let me = this;
      me.handleSendRequestFromHistory(request);
      me.currentRequestId = request.requestId;
    },
    async saveRequest() {
      let me = this;
      if (me.requestName && me.allCollection && me.allCollection.length > 0) {
        if (me.currentRequestId) {
          let currentCollection = me.allCollection.find((c) =>
            c.requests.find((r) => r.requestId == me.currentRequestId),
          );
          if (currentCollection) {
            let testData = {
              id: me.currentRequestId,
              request_name: me.requestName,
              group_id: currentCollection.collection_id,
              method: me.httpMethod,
              end_point: me.apiUrl,
              headers_text: me.headersText,
              body_text: me.bodyText,
            };
            try {
              let response = await me.agentAPI.testingItem.update(testData);
              if (response && response.success && response.data?.success) {
                me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
                await me.loadAllTestingData();
              }
            } catch (e) {
              me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
            }
          }
        } else {
          TDDialogUtil.showPopup({
            dialogType: TDDialogEnum.TDAPISaveToCollectionPopup,
            ownerForm: this,
            props: {
              allCollection: me.allCollection,
            },
          });
        }
      }
    },
    async saveToCollection(collection) {
      let me = this;
      let testData = {
        request_name: me.requestName || me.apiUrl,
        group_id: collection.collection_id,
        method: me.httpMethod,
        end_point: me.apiUrl,
        headers_text: me.headersText,
        body_text: me.bodyText,
      };
      try {
        let response = await me.agentAPI.testingItem.create(testData);
        if (response && response.success && response.data?.success) {
          me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
          me.currentRequestId = response.data.data.id;
          await me.loadAllTestingData();
        }
      } catch (e) {
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    async deleteRequest(collectionId, request) {
      let me = this;
      if (request && request.requestId) {
        try {
          let response = await me.agentAPI.testingItem.deleteById(
            request.requestId,
          );
          if (response && response.success && response.data?.success) {
            me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
            await me.loadAllTestingData();
          }
        } catch (e) {
          me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
        }
      }
    },
    enableRenameCollection(collection) {
      let me = this;
      if (collection) {
        collection.is_renaming = true;
        collection.temp_name = collection.name;
        this.$nextTick(() => {
          if (me.$refs && me.$refs[collection.temp_name]) {
            let refs = me.$refs[collection.temp_name];
            if (refs) {
              if (Array.isArray(refs)) {
                refs[0].focus();
              } else {
                refs.focus();
              }
            }
          }
        });
      }
    },
    async saveNewCollectionName(collection) {
      let me = this;
      if (collection) {
        delete collection.is_renaming;
        if (collection.temp_name && collection.temp_name !== collection.name) {
          try {
            let response = await me.agentAPI.testingGroup.update({
              id: collection.collection_id,
              name: collection.temp_name,
            });
            if (response && response.success && response.data?.success) {
              me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
              await me.loadAllTestingData();
            }
          } catch (e) {
            me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
          }
        }
      }
    },
    async deleteCollection(collectionId) {
      let me = this;
      if (collectionId) {
        try {
          let response =
            await me.agentAPI.testingGroup.deleteById(collectionId);
          if (response && response.success && response.data?.success) {
            me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
            await me.loadAllTestingData();
          }
        } catch (e) {
          me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
        }
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
              body_text: req.bodyText,
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
          await me.loadAllTestingData();
        }
      } catch (e) {
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    async buildCollectionsFromZip(zip) {
      let me = this;
      let collections = {};
      let textExtensions = [
        ".txt", ".js", ".ts", ".jsx", ".tsx", ".json", ".md", ".sh",
        ".py", ".sql", ".html", ".css", ".xml", ".yaml", ".yml",
        ".cs", ".java", ".go", ".rb", ".php", ".vue", ".env",
        ".conf", ".log",
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
          if (item.name && item?.request?.url?.raw) {
            tempCollection.requests.push({
              requestName: item.name,
              apiUrl: item?.request?.url?.raw,
              bodyText: bodyText
                ? JSON.stringify(JSON.parse(bodyText), null, 2)
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
      me.groupName = "";
      me.currentRequestId = null;
      me.apiUrl = null;
      me.httpMethod = "GET";
      me.headersText = "Content-Type: application/json";
      me.bodyText = "";
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
          body_text: this.bodyText || null,
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
        me.bodyText = item.bodyText;
        me.requestName = item.requestName;
        me.curlContent = TDAutomation.stringifyCURL(me.getRequestObj());
        me.currentRequestId = null;
      }
    },
    getRequestObj() {
      let me = this;
      return {
        apiUrl: me.apiUrl,
        httpMethod: me.httpMethod,
        headersText: me.headersText,
        bodyText: me.bodyText,
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
        me.bodyText = CURLParsed.bodyText;
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
@use "@/styles/collection-sub-sidebar.scss";

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
.td-header-collection {
  width: 100%;
  height: 30px;
  margin-top: var(--padding);
  gap: var(--padding);
  .td-new-collection {
    flex: 1;
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
.td-collection-rename {
  width: 100%;
}
.td-import-request-group {
  gap: var(--padding);
  margin-left: var(--padding);
}
.td-text-area-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}
.td-header-options {
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
</style>
