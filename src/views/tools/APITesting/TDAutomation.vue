<template>
  <div class="flex td-api-container">
    <div class="flex flex-col td-api-testing">
      <!-- Header -->
      <div class="flex td-api-header-group">
        <div class="flex flex-one">
          <TDInput
            v-model="requestName"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.apiTesting.scriptName')"
            :borderRadiusPosition="[
              $tdEnum.BorderRadiusPosition.TopLeft,
              $tdEnum.BorderRadiusPosition.BottomLeft,
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
        <TDUpload
          v-tooltip="{
            text: $t('i18nCommon.apiTesting.importCollectionZipTooltip'),
            maxWidth: '500px',
          }"
          iconClass="td-upload-icon"
          :accept="'.zip'"
          @change="importProModeCollectionZip"
          ref="uploadAreaProMode"
          :isShowSelect="false"
        />
        <TDButton
          v-if="currentProModeRequestId"
          :readOnly="isLoadingData"
          @click="createNewScriptRequest"
          :type="$tdEnum.buttonType.secondary"
          :noMargin="true"
          iconClass="td-new-file-icon"
          v-tooltip="$t('i18nCommon.apiTesting.createNewRequest')"
        ></TDButton>
        <TDButton
          :readOnly="isLoadingData || !requestName"
          @click="saveProModeRequest"
          :type="$tdEnum.buttonType.secondary"
          :noMargin="true"
          iconClass="td-save-icon"
          v-tooltip="$t('i18nCommon.apiTesting.save')"
        ></TDButton>
        <TDButton
          :noMargin="true"
          @click="showAIDocsPopup"
          :type="$tdEnum.buttonType.secondary"
          iconClass="td-book-icon"
          v-tooltip="$t('i18nCommon.apiTesting.showAIDocs')"
        ></TDButton>
      </div>
      <!-- Content -->
      <div class="td-api-content">
        <div
          class="flex td-api-input-area"
          :class="{ 'flex-col': currentConfigLayout.splitHorizontal }"
        >
          <div
            class="flex flex-col td-api-request"
            :style="requestSectionSizeStyle"
          >
            <TDTextEditor
              :isLabelTop="true"
              v-model="proModeSecranioCode"
              language="javascript"
              :wrapText="currentConfigLayout.wrapText"
              :enableHighlight="true"
              :monacoOptions="proModeMonacoOptions"
              :placeHolder="$t('i18nCommon.apiTesting.scriptExecute')"
              :label="$t('i18nCommon.apiTesting.scriptExecute')"
            ></TDTextEditor>
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
              @click="loadAllProModeData"
              :type="$tdEnum.buttonType.secondary"
              iconClass="td-reload-icon"
              v-tooltip="$t('i18nCommon.APIMocking.refresh')"
            />
          </div>
          <div class="td-collection">
            <div class="flex flex-col response-loading" v-if="isLoadingData">
              <TDLoading />
            </div>
            <div class="td-collection-body" v-else>
              <div
                v-for="(collection, index) in allCollection"
                class="flex flex-col no-select td-collection-item"
                :key="index"
              >
                <div v-if="collection.is_renaming" class="td-collection-rename">
                  <TDInput
                    v-model="collection.temp_name"
                    :noMargin="true"
                    :placeHolder="$t('i18nCommon.apiTesting.collectionRename')"
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
                      @click.stop="
                        deleteProModeCollection(collection.collection_id)
                      "
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
                        request && currentProModeRequestId == request.requestId,
                    }"
                    @click="applyProModeRequest(request)"
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
                          deleteProModeRequest(
                            collection.collection_id,
                            request,
                          )
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
            :cacheKey="$tdEnum.cacheConfig.APIPromodeHistory"
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
import { registerTdApiPromodeLanguage } from "@/monarch/apiTesting/tdApiPromodeLanguage.js";
import { registerTdApiPromodeFormatProvider } from "@/monarch/apiTesting/tdApiPromodeFormatProvider.js";
import { registerTdApiPromodeCompletionProvider } from "@/monarch/apiTesting/tdApiPromodeCompletionProvider.js";
import { registerTdApiPromodeHoverProvider } from "@/monarch/apiTesting/tdApiPromodeHoverProvider.js";
import { API_ITEMS } from "@/monarch/apiTesting/tdApiPromodeItems.js";
import _ from "@/common/TDCommonFunction.js";
import { TDShortcutActionEnum } from "@/common/TDShortcutAction.js";
export default {
  extends: TDToolBase,
  name: "TDAutomation",
  components: {
    TDSubSidebar,
    TDArrow,
    TDAPIResponse,
    TDHistorySidebar,
    TDAPITestingHelp,
  },

  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.TDAutomationConfigLayout,
      requestName: "",
      currentProModeRequestId: null,
      newCollectionName: "",
      allCollection: [],
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
        currentAPIResponseInfoOption: this.$tdEnum.APIInfoOption.body,
      },
      proModeSecranioCode: "",
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
    registerTdApiPromodeLanguage();
    await this.loadAllProModeData();
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
    proModeMonacoOptions() {
      let me = this;
      return {
        onInit: (editor, monacoInstance) => {
          me._monacoInstance = monacoInstance;
          me._registerProModeProviders(monacoInstance);
        },
      };
    },
  },
  beforeUnmount() {
    if (this.currentRequest && this.currentRequest.cancel) {
      this.currentRequest.cancel();
    }
    if (this.debouncedHandleSend?.cancel) {
      this.debouncedHandleSend.cancel();
    }
    this.disposeIntellisense();
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
    registerIntellisense() {
      let me = this;
      if (me._monacoInstance) {
        me._registerProModeProviders(me._monacoInstance);
      }
    },
    disposeIntellisense() {
      let me = this;
      if (me._proModeDisposables) {
        me._proModeDisposables.forEach((d) => d?.dispose?.());
        me._proModeDisposables = null;
      }
    },
    _registerProModeProviders(monacoInstance) {
      let me = this;
      if (me._proModeDisposables) {
        me._proModeDisposables.forEach((d) => d?.dispose?.());
      }
      me._proModeDisposables = [];

      const completionDisposable =
        registerTdApiPromodeCompletionProvider(monacoInstance);
      me._proModeDisposables.push(completionDisposable);

      const hoverDisposable = registerTdApiPromodeHoverProvider(monacoInstance);
      me._proModeDisposables.push(hoverDisposable);

      registerTdApiPromodeFormatProvider(monacoInstance);
    },
    handleResize(sizes) {
      this.requestSectionSize = sizes.leftSize;
      this.responseSectionSize = sizes.rightSize;
    },
    async toggleCollection(collection) {
      if (collection) {
        collection.openingCollection = !collection.openingCollection;
      }
    },

    // ─── CRUD ──────────────────────────────────────────────
    async loadAllProModeData() {
      let me = this;
      me.isLoadingData = true;
      try {
        let [groupsParams, itemsParams] = await Promise.all([
          me.agentAPI.proModeGroup.getAll(),
          me.agentAPI.proModeItem.getAll(),
        ]);

        let groups = groupsParams?.data?.data || [];
        let items = itemsParams?.data?.data || [];

        let collections = groups.map((g) => ({
          name: g.name,
          collection_id: g.id,
          openingCollection: false,
          requests: [],
          is_renaming: false,
        }));

        items.forEach((t) => {
          let collection = collections.find(
            (c) => c.collection_id === t.group_id,
          );
          if (collection) {
            collection.requests.push({
              requestName: t.request_name,
              scriptCode: t.script_code,
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
        console.error("Lỗi tải dữ liệu automation:", error);
        me.$tdUtility.showErrorNotFoundAgentServer();
      } finally {
        me.isLoadingData = false;
      }
    },
    async addNewCollection(collectionName) {
      let me = this;
      if (typeof collectionName == "string") {
        me.newCollectionName = collectionName;
      }
      if (me.newCollectionName) {
        try {
          let response = await me.agentAPI.proModeGroup.create({
            name: me.newCollectionName,
          });
          if (response && response.success && response.data?.success) {
            me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
            me.newCollectionName = "";
            await me.loadAllProModeData();
          }
        } catch (error) {
          me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
        }
      }
    },
    applyProModeRequest(request) {
      let me = this;
      if (request) {
        me.requestName = request.requestName;
        me.proModeSecranioCode = request.scriptCode || "";
        me.currentProModeRequestId = request.requestId;
      }
    },
    createNewScriptRequest() {
      let me = this;
      me.requestName = "";
      me.proModeSecranioCode = "";
      me.currentProModeRequestId = null;
    },
    async saveProModeRequest() {
      let me = this;
      if (me.requestName && me.allCollection && me.allCollection.length > 0) {
        if (me.currentProModeRequestId) {
          let currentCollection = me.allCollection.find((c) =>
            c.requests.find((r) => r.requestId == me.currentProModeRequestId),
          );
          if (currentCollection) {
            let testData = {
              id: me.currentProModeRequestId,
              request_name: me.requestName,
              group_id: currentCollection.collection_id,
              script_code: me.proModeSecranioCode,
            };
            try {
              let response = await me.agentAPI.proModeItem.update(testData);
              if (response && response.success && response.data?.success) {
                me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
                await me.loadAllProModeData();
              }
            } catch (e) {
              me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
            }
          }
        } else {
          TDDialogUtil.showPopup({
            dialogType: TDDialogEnum.TDAPISaveProModeToCollectionPopup,
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
        request_name: me.requestName || "Untitled Script",
        group_id: collection.collection_id,
        script_code: me.proModeSecranioCode,
      };
      try {
        let response = await me.agentAPI.proModeItem.create(testData);
        if (response && response.success && response.data?.success) {
          me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
          me.currentProModeRequestId = response.data.data.id;
          await me.loadAllProModeData();
        }
      } catch (e) {
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    async deleteProModeRequest(collectionId, request) {
      let me = this;
      if (request && request.requestId) {
        try {
          let response = await me.agentAPI.proModeItem.deleteById(
            request.requestId,
          );
          if (response && response.success && response.data?.success) {
            me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
            if (me.currentProModeRequestId == request.requestId) {
              me.currentProModeRequestId = null;
            }
            await me.loadAllProModeData();
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
            let response = await me.agentAPI.proModeGroup.update({
              id: collection.collection_id,
              name: collection.temp_name,
            });
            if (response && response.success && response.data?.success) {
              me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
              await me.loadAllProModeData();
            }
          } catch (e) {
            me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
          }
        }
      }
    },
    showAIDocsPopup() {
      let me = this;
      let markdown = me.buildAIDocsPrompt();
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDQuickPreview,
        ownerForm: me,
        props: {},
        param: {
          value: markdown,
          label: me.$t("i18nCommon.apiTesting.showAIDocs"),
          language: "markdown",
        },
      });
    },
    buildAIDocsPrompt() {
      let lines = [];
      lines.push("# Automation Script Reference");
      lines.push("");
      lines.push("Available functions:");
      lines.push("");
      API_ITEMS.forEach((item) => {
        lines.push(`## ${item.label}`);
        lines.push("");
        if (item.documentation) {
          lines.push(item.documentation.trim());
        }
        lines.push("");
      });
      lines.push("# End of Reference");
      return lines.join("\n");
    },
    async deleteProModeCollection(collectionId) {
      let me = this;
      if (collectionId) {
        try {
          let response =
            await me.agentAPI.proModeGroup.deleteById(collectionId);
          if (response && response.success && response.data?.success) {
            me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
            await me.loadAllProModeData();
          }
        } catch (e) {
          me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
        }
      }
    },

    // ─── ZIP Import ──────────────────────────────────────
    async importProModeCollectionZip() {
      let me = this;
      if (
        me.$refs.uploadAreaProMode &&
        typeof me.$refs.uploadAreaProMode.getFileSelected == "function" &&
        typeof me.$refs.uploadAreaProMode.clearFileSelected == "function"
      ) {
        let zip = new JSZip();
        let files = me.$refs.uploadAreaProMode.getFileSelected();
        me.$refs.uploadAreaProMode.clearFileSelected();
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
              script_code: req.scriptCode,
            });
          });
        }
      });

      try {
        let response = await me.agentAPI.importProModeBatch({
          groups: groups,
          items: items,
        });
        if (response && response.success && response.data?.success) {
          me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
          await me.loadAllProModeData();
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
        let scriptName = fileName.replace(/\.[^.]+$/, "");

        let content = await file.async("string");

        if (!collections[collectionName]) {
          collections[collectionName] = {
            name: collectionName,
            collection_id: me.$tdUtility.newGuid(),
            openingCollection: false,
            requests: [],
          };
        }
        collections[collectionName].requests.push({
          requestName: scriptName,
          scriptCode: content,
          requestId: me.$tdUtility.newGuid(),
        });
      }

      return Object.values(collections);
    },

    // ─── Execution ──────────────────────────────────────
    async handleSend() {
      let me = this;
      await me.handleSendRequestProMode();
    },
    async handleSendRequestProMode() {
      let me = this;

      if (!me.proModeSecranioCode) {
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
        return;
      }

      me.isLoading = true;
      me.responseText = "";
      me.statusCode = null;
      me.responseTime = null;
      me.startTime = performance.now();

      try {
        let injectedCode = TDAutomation.buildInjectCode(me.proModeSecranioCode);

        let userFn = new Function(injectedCode);
        let result = await userFn();

        let endTime = performance.now();
        me.responseTime = Math.round(endTime - me.startTime);
        me.statusCode = 200;

        if (typeof result === "object") {
          me.responseText = JSON.stringify(result, null, 2);
        } else if (typeof result === "string") {
          try {
            me.responseText = JSON.stringify(JSON.parse(result), null, 2);
          } catch {
            me.responseText = result;
          }
        } else if (typeof result !== "undefined") {
          me.responseText = String(result);
        } else {
          me.responseText = "// Script executed successfully (no return)";
        }

        me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        me.responseText = `Error: ${error.message}`;
        me.$tdToast.error(error.message);
      } finally {
        me.isLoading = false;
        if (me.proModeSecranioCode) {
          let shortCode = me.proModeSecranioCode.slice(0, 100);
          let historyItem = {
            requestName: me.requestName || shortCode,
            proModeSecranioCode: me.proModeSecranioCode,
          };
          await me.$refs.history.saveToHistory(historyItem);
        }
      }
    },
    handleSendRequestFromHistory(item) {
      let me = this;
      if (item && item.proModeSecranioCode) {
        me.proModeSecranioCode = item.proModeSecranioCode;
        me.requestName = item.requestName;
      }
    },
    handleCancelRequest() {
      if (
        this.currentRequest &&
        typeof this.currentRequest.cancel === "function"
      ) {
        this.currentRequest.cancel();
      }
      this.isLoading = false;
      this.currentRequest = null;
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
</style>
