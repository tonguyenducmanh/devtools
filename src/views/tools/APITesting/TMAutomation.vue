<template>
  <div class="flex tm-api-container">
    <div class="flex flex-col tm-api-testing">
      <!-- Header -->
      <div class="flex tm-api-header-group">
        <div class="flex flex-one">
          <TMInput
            v-model="requestName"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.apiTesting.scriptName')"
          ></TMInput>
        </div>
        <TMButton
          v-if="isLoading"
          :noMargin="true"
          @click="handleCancelRequest"
          :type="$tmEnum.buttonType.secondary"
          iconClass="tm-cancel-icon"
          v-tooltip="$t('i18nCommon.apiTesting.cancel')"
        />
        <TMButton
          v-else
          :noMargin="true"
          @click="handleSend"
          iconClass="tm-send-icon"
          v-tooltip="$t('i18nCommon.apiTesting.send')"
        ></TMButton>
        <TMButton
          :noMargin="true"
          @click="handleDownloadReponse"
          :type="$tmEnum.buttonType.secondary"
          iconClass="tm-download-icon"
          v-tooltip="$t('i18nCommon.apiTesting.downloadReponse')"
        ></TMButton>
        <TMUpload
          v-tooltip="{
            text: $t('i18nCommon.apiTesting.importCollectionZipTooltip'),
            maxWidth: '500px',
          }"
          iconClass="tm-upload-icon"
          :accept="'.zip'"
          @change="importProModeCollectionZip"
          ref="uploadAreaProMode"
          :isShowSelect="false"
        />
        <TMButton
          v-if="currentProModeRequestId"
          :readOnly="isLoadingCollection"
          @click="createNewScriptRequest"
          :type="$tmEnum.buttonType.secondary"
          :noMargin="true"
          iconClass="tm-new-file-icon"
          v-tooltip="$t('i18nCommon.apiTesting.createNewRequest')"
        ></TMButton>
        <TMButton
          :readOnly="isLoadingCollection || !requestName"
          @click="saveProModeRequest"
          :type="$tmEnum.buttonType.secondary"
          :noMargin="true"
          iconClass="tm-save-icon"
          v-tooltip="$t('i18nCommon.apiTesting.save')"
        ></TMButton>
        <TMButton
          :noMargin="true"
          @click="showAIDocsPopup"
          :type="$tmEnum.buttonType.secondary"
          iconClass="tm-book-icon"
          v-tooltip="$t('i18nCommon.apiTesting.showAIDocs')"
        ></TMButton>
      </div>
      <!-- Content -->
      <div class="tm-api-content">
        <div
          class="flex tm-api-input-area"
          :class="{ 'flex-col': currentConfigLayout.splitHorizontal }"
        >
          <div
            class="flex flex-col tm-api-request"
            :style="requestSectionSizeStyle"
          >
            <TMTextEditor
              :isLabelTop="true"
              v-model="proModeSecranioCode"
              language="javascript"
              :wrapText="currentConfigLayout.wrapText"
              :enableHighlight="true"
              :monacoOptions="proModeMonacoOptions"
              :placeHolder="$t('i18nCommon.apiTesting.scriptExecute')"
              :label="$t('i18nCommon.apiTesting.scriptExecute')"
            ></TMTextEditor>
          </div>
          <TMResizer
            v-if="currentConfigLayout.showReponse"
            :direction="
              currentConfigLayout.splitHorizontal ? 'vertical' : 'horizontal'
            "
            @resize="handleResize"
          />
          <div
            v-if="currentConfigLayout.showReponse"
            class="flex flex-col tm-api-response"
            :style="responseSectionSizeStyle"
          >
            <TMAPIResponse
              :statusCode="statusCode"
              :responseTime="responseTime"
              :isLoading="isLoading"
              :responseText="responseText"
              :responseHeadersText="responseHeadersText"
              :currentConfigLayout="currentConfigLayout"
              @change="changeToViewResponsePanel"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- Sidebar -->
    <TMSubSidebar
      ref="subSidebar"
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="tm-sidebar-menu">
          <TMSlideOption
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
          class="tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.APISidebarOption.Help
          "
        >
          <TMAutomationHelp />
        </div>
        <!-- Collection -->
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.APISidebarOption.Collection
          "
        >
          <!-- Collection: danh sách nhóm + script.
             Dùng chung component collection, backend trả về cây đã gom sẵn -->
          <TMCollectionList
            :groups="collectionGroups"
            :selectedItemId="currentProModeRequestId"
            :isLoading="isLoadingCollection"
            itemNameKey="request_name"
            :allowEditItem="false"
            :defaultOpen="false"
            @refresh="loadCollection"
            @add-group="handleAddCollectionGroup"
            @rename-group="renameCollectionGroup"
            @delete-group="deleteCollectionGroup"
            @add-item="createNewScriptInGroup"
            @select-item="applyProModeRequest"
            @delete-item="deleteCollectionItem"
          />
        </div>
        <!-- Settings -->
        <div
          class="tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.APISidebarOption.Setting
          "
        >
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.wrapText"
            :label="$t('i18nCommon.apiTesting.wrapText')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.showReponse"
            :label="$t('i18nCommon.apiTesting.showReponse')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.splitHorizontal"
            :label="$t('i18nCommon.splitHorizontal')"
            @change="updateConfigLayout"
          ></TMCheckbox>
        </div>
        <!-- History -->
        <div
          class="tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.APISidebarOption.History
          "
        >
          <TMHistorySidebar
            ref="history"
            :applyFunction="handleSendRequestFromHistory"
            titleKey="requestName"
            :noMargin="true"
            :positionRelative="false"
            :cacheKey="$tmEnum.cacheConfig.APIPromodeHistory"
            :historyContainerStyleEnum="
              $tmEnum.AbsolutePositionStyle.Top100Left
            "
          ></TMHistorySidebar>
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>

<script>
import TMAutomation from "@/common/automation/TMAutomation.js";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMCollectionList from "@/components/TMCollectionList.vue";
import TMCollectionMixin from "@/mixins/TMCollectionMixin.js";
import JSZip from "jszip";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";
import TMAPIResponse from "@/views/tools/APITesting/TMAPIResponse.vue";
import TMDialogUtil, { TMDialogEnum } from "@/common/TMDialogUtil.js";
import TMServerTestingAPI from "@/common/api/request/AgentAPI/TMServerTestingAPI.js";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMAutomationHelp from "@/views/helps/TMAutomationHelp.vue";
import { registerTmApiPromodeLanguage } from "@/monarch/apiTesting/tmApiPromodeLanguage.js";
import { registerTmApiPromodeFormatProvider } from "@/monarch/apiTesting/tmApiPromodeFormatProvider.js";
import { registerTmApiPromodeCompletionProvider } from "@/monarch/apiTesting/tmApiPromodeCompletionProvider.js";
import { registerTmApiPromodeHoverProvider } from "@/monarch/apiTesting/tmApiPromodeHoverProvider.js";
import { API_ITEMS } from "@/monarch/apiTesting/tmApiPromodeItems.js";
import _ from "@/common/TMCommonFunction.js";
import { TMShortcutActionEnum } from "@/common/TMShortcutAction.js";
export default {
  extends: TMToolBase,
  name: "TMAutomation",
  mixins: [TMCollectionMixin],
  components: {
    TMSubSidebar,
    TMCollectionList,
    TMAPIResponse,
    TMHistorySidebar,
    TMAutomationHelp,
  },

  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.TMAutomationConfigLayout,
      requestName: "",
      currentProModeRequestId: null,
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
        currentSidebarOption: this.$tmEnum.APISidebarOption.Setting,
        currentAPIResponseInfoOption: this.$tmEnum.APIInfoOption.body,
      },
      proModeSecranioCode: "",
      requestSectionSize: 50,
      responseSectionSize: 50,
      agentAPI: null,
      // group được chọn sẵn khi bấm "+" trên 1 group, dùng khi lưu script mới
      pendingGroupId: "",
    };
  },
  created() {
    this.debouncedHandleSend = _.debounce(this.handleSend, 300);
  },
  async mounted() {
    let me = this;
    me.agentAPI = new TMServerTestingAPI();
    registerTmApiPromodeLanguage();
    // Trỏ 2 API vào mixin để nó gọi get_tree / create / update / delete
    me.collectionItemAPI = me.agentAPI.proModeItem;
    me.collectionGroupAPI = me.agentAPI.proModeGroup;
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
        value: this.$tmEnum.APISidebarOption.Help,
        label: this.$t("i18nCommon.apiTesting.sidebarOption.help"),
        icon: "tm-help-icon",
      });
      options.push({
        value: this.$tmEnum.APISidebarOption.Setting,
        label: this.$t("i18nCommon.apiTesting.sidebarOption.setting"),
        icon: "tm-setting-icon",
      });
      options.push({
        value: this.$tmEnum.APISidebarOption.Collection,
        label: this.$t("i18nCommon.apiTesting.sidebarOption.collection"),
        icon: "tm-folder-icon",
      });
      options.push({
        value: this.$tmEnum.APISidebarOption.History,
        label: this.$t("i18nCommon.apiTesting.sidebarOption.history"),
        icon: "tm-history-icon",
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
            enum: TMShortcutActionEnum.ExecuteAPITesting,
            config: {
              sortOrder: 100,
              presentKey: [me.$tmUtility.ctrlKey(), me.$tmUtility.enterKey()],
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
        registerTmApiPromodeCompletionProvider(monacoInstance);
      me._proModeDisposables.push(completionDisposable);

      const hoverDisposable = registerTmApiPromodeHoverProvider(monacoInstance);
      me._proModeDisposables.push(hoverDisposable);

      registerTmApiPromodeFormatProvider(monacoInstance);
    },
    handleResize(sizes) {
      this.requestSectionSize = sizes.leftSize;
      this.responseSectionSize = sizes.rightSize;
    },
    /**
     * Panel response do TMAPIResponse emit lên, phải ghi cache layout
     * để mở lại tool vẫn giữ đúng panel đang xem
     */
    changeToViewResponsePanel(option) {
      let me = this;
      me.currentConfigLayout.currentAPIResponseInfoOption = option;
      me.updateConfigLayout();
    },
    /**
     * Nạp 1 script từ cây collection vào editor
     */
    applyProModeRequest(request) {
      let me = this;
      if (!request) return;
      me.currentProModeRequestId = request.id;
      me.requestName = request.request_name;
      me.proModeSecranioCode = request.script_code || "";
    },
    createNewScriptRequest() {
      let me = this;
      me.requestName = "";
      me.proModeSecranioCode = "";
      me.currentProModeRequestId = null;
      // Xoá group đã chọn sẵn, nếu không script tạo sau sẽ bị lưu nhầm
      // vào group đã bấm "+" trước đó
      me.pendingGroupId = "";
    },
    /**
     * Nút "+" trên 1 group: tạo script mới và gán thẳng vào group đó
     */
    createNewScriptInGroup(group) {
      let me = this;
      me.createNewScriptRequest();
      me.pendingGroupId = group?.groupId ?? "";
    },
    /**
     * Lưu script. Nếu đang mở 1 script thì update tại chỗ,
     * nếu là script mới thì hỏi user chọn collection.
     */
    async saveProModeRequest() {
      let me = this;
      if (!me.requestName) return;

      if (me.currentProModeRequestId) {
        let currentGroup = me.findCollectionGroupByItemId(
          me.currentProModeRequestId,
        );
        if (!currentGroup) return;

        let testData = {
          id: me.currentProModeRequestId,
          request_name: me.requestName,
          group_id: currentGroup.groupId,
          script_code: me.proModeSecranioCode,
        };
        try {
          let response = await me.collectionItemAPI.update(testData);
          if (response?.data?.success) {
            me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
            await me.loadCollection();
          }
        } catch (e) {
          me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
        }
        return;
      }

      // Script mới: nếu đã bấm "+" trên 1 group thì lưu thẳng vào group đó
      if (me.pendingGroupId) {
        await me.saveProModeToGroup(me.pendingGroupId);
        me.pendingGroupId = "";
        return;
      }

      me.openSaveScriptToCollectionPopup();
    },
    /**
     * Mở popup chọn collection để lưu script mới
     */
    openSaveScriptToCollectionPopup() {
      let me = this;
      TMDialogUtil.showPopup({
        dialogType: TMDialogEnum.TMCollectionPickerPopup,
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
            await me.saveProModeToGroup(payload.groupId);
          } else if (payload?.newGroupName) {
            let group = await me.createCollectionGroup(payload.newGroupName);
            if (group) {
              await me.saveProModeToGroup(group.groupId);
            }
          }
        },
      });
    },
    /**
     * Lưu script hiện tại vào 1 collection
     */
    async saveProModeToGroup(groupId) {
      let me = this;
      let testData = {
        request_name: me.requestName || "Untitled Script",
        group_id: groupId,
        script_code: me.proModeSecranioCode,
      };
      try {
        let response = await me.collectionItemAPI.create(testData);
        if (response?.data?.success) {
          me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
          me.currentProModeRequestId = response.data.data.id;
          await me.loadCollection();
        }
      } catch (e) {
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    /**
     * Tên hiển thị của script, dùng cho toast xác nhận xoá
     */
    getCollectionItemName(request) {
      return request?.request_name ?? "";
    },
    /**
     * Xoá script đang mở thì reset form
     */
    onCollectionItemDeleted(request) {
      let me = this;
      if (me.currentProModeRequestId === request.id) {
        me.createNewScriptRequest();
      }
    },

    /**
     * Xoá nhóm sẽ xoá luôn các script bên trong. Script đang mở có thể nằm
     * trong nhóm vừa xoá: phải reset form, không thì nút Save sẽ im lặng
     * không làm gì vì không tìm được group chứa script đó.
     */
    onCollectionGroupDeleted() {
      let me = this;
      if (!me.currentProModeRequestId) return;
      if (!me.findCollectionGroupByItemId(me.currentProModeRequestId)) {
        me.createNewScriptRequest();
      }
    },
    showAIDocsPopup() {
      let me = this;
      let markdown = me.buildAIDocsPrompt();
      TMDialogUtil.showPopup({
        dialogType: TMDialogEnum.TMQuickPreview,
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
          me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
          await me.loadCollection();
        }
      } catch (e) {
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
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
            collection_id: me.$tmUtility.newGuid(),
            openingCollection: false,
            requests: [],
          };
        }
        collections[collectionName].requests.push({
          requestName: scriptName,
          scriptCode: content,
          requestId: me.$tmUtility.newGuid(),
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
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
        return;
      }

      me.isLoading = true;
      me.responseText = "";
      me.statusCode = null;
      me.responseTime = null;
      me.startTime = performance.now();

      try {
        let injectedCode = TMAutomation.buildInjectCode(me.proModeSecranioCode);

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

        me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        me.responseText = `Error: ${error.message}`;
        me.$tmToast.error(error.message);
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
        let fileName = me.$tmUtility.createFileDownloadName(me.requestName, {
          ext: ".txt",
        });
        me.$tmUtility.createDownloadFileFromBuffer(
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
.tm-api-container {
  width: 100%;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
}
.tm-api-testing {
  width: 100%;
  height: 100%;
}
.tm-api-content {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  .tm-api-input-area {
    margin-top: var(--padding);
    flex: 1;
    .tm-api-request {
      width: 100%;
      height: 100%;
    }
    .tm-api-response {
      width: 100%;
      height: 100%;
    }
  }
}
.tm-api-header-group {
  gap: var(--padding);
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
}
.tm-sidebar-content {
  flex: 1;
  width: 100%;
  min-height: 0;
}
</style>
