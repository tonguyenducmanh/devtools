<template>
  <div class="flex container">
    <div class="main-tool">
      <div class="rdp-container">
        <TDFullTabWrapper v-model="isFullTab" :alwaysShowToolbar="true" fullScreenBgColor="#000" class="rdp-wrapper">
          <template #toolbar-left>
            <div v-tooltip="$t('i18nCommon.remoteDesktop.screenshot')" class="flex toolbar-btn" @click="takeScreenshot">
              <span class="td-icon td-camera-icon"></span>
            </div>
            <div v-tooltip="$t('i18nCommon.remoteDesktop.ctrlAltDel')" class="flex toolbar-btn" @click="sendCtrlAltDel"
              :class="{ 'toolbar-btn-disabled': !isConnected }">
              <span class="td-icon td-command-code-icon"></span>
            </div>
            <div v-tooltip="$t('i18nCommon.remoteDesktop.sendFilesToRemote')" class="flex toolbar-btn"
              :class="{ 'toolbar-btn-disabled': !isConnected }">
              <TDUpload ref="uploadInput" :multiple="true" iconClass="td-icon td-upload-icon" :hideBorder="true"
                :readOnly="!isConnected" @selected="sendFilesToRemote" />
            </div>
            <div v-tooltip="$t('i18nCommon.remoteDesktop.receiveFiles')" class="flex toolbar-btn rdp-download-btn"
              @click="openReceiveFilesDialog" :class="{ 'toolbar-btn-disabled': !isConnected }">
              <span class="td-icon td-download-icon"></span>
              <span v-if="incomingFiles.length > 0" class="td-file-badge">{{
                incomingFiles.length
              }}</span>
            </div>
          </template>
          <template #toolbar-right>
            <div class="flex" style="margin-left: 16px">
              <div v-if="!isConnected && !isConnecting" v-tooltip="$t('i18nCommon.remoteDesktop.connect')"
                class="flex toolbar-btn" @click="handleConnect">
                <span class="td-icon td-connect-icon"></span>
              </div>
              <div v-else v-tooltip="$t('i18nCommon.remoteDesktop.disconnect')" class="flex toolbar-btn"
                @click="handleDisconnect">
                <span class="td-icon td-disconnect-icon"></span>
              </div>
            </div>
          </template>

          <div class="rdp-canvas-container">
            <TDDynamicBackgroundEffect :class="{ 'td-dynamic-effect-canvas': isHideEffectBackground }" />

            <canvas ref="rdpCanvas" class="rdp-canvas" :class="{
              'rdp-canvas-cursor-none':
                currentConfigLayout.enableServerPointer && isConnected,
            }" :width="canvasWidth" :height="canvasHeight" tabindex="0" @keydown="onCanvasKeydown"
              @keyup="onCanvasKeyup" @mousemove="onCanvasMousemove" @mousedown="onCanvasMousedown"
              @mouseup="onCanvasMouseup" @wheel.prevent="onCanvasWheel" @contextmenu.prevent="onCanvasContextmenu" />
          </div>
        </TDFullTabWrapper>

        <!-- Log panel -->
        <div v-if="currentConfigLayout.showLog" ref="logPanel" class="rdp-log-panel">
          <div v-for="(entry, idx) in logEntries" :key="idx" class="rdp-log-entry" :class="`rdp-log-${entry.type}`">
            <span class="rdp-log-time">{{ entry.time }}</span>{{ entry.message }}
          </div>
        </div>
      </div>
    </div>
    <TDSubSidebar v-model="currentConfigLayout.isShowSidebar" @toggleSidebar="toggleSidebar">
      <template v-slot:menu>
        <div class="td-sidebar-menu">
          <TDSlideOption :showIcon="true" v-model="currentConfigLayout.currentSidebarOption" :options="sidebarOptions"
            :noMargin="true" @change="updateConfigLayout" />
        </div>
      </template>
      <template v-slot:main>
        <div class="flex flex-col td-sub-sidebar" v-show="currentConfigLayout.currentSidebarOption ==
          $tdEnum.RemoteDesktopSidebarOption.Help
          ">
          <TDRemoteDesktopRDPHelp />
        </div>
        <div class="flex flex-col td-sub-sidebar" v-show="currentConfigLayout.currentSidebarOption ==
          $tdEnum.RemoteDesktopSidebarOption.Collection
          ">
          <div class="td-rdp-collection">
            <div class="flex flex-col td-collection-header">
              <div class="td-connection-form">
                <TDInput v-model="connectionName" :placeHolder="$t('i18nCommon.remoteDesktop.connectionNamePlaceholder')
                  " :noMargin="true" class="rdp-connection-input" />
                <TDInput v-model="host" :placeHolder="$t('i18nCommon.remoteDesktop.hostPlaceholder')" :noMargin="true"
                  class="rdp-connection-input" />
                <TDInput v-model="username" :placeHolder="$t('i18nCommon.remoteDesktop.usernamePlaceholder')
                  " :noMargin="true" class="rdp-connection-input" />
                <TDInput v-model="password" :placeHolder="$t('i18nCommon.remoteDesktop.passwordPlaceholder')
                  " :inputType="'password'" :noMargin="true" class="rdp-connection-input" />
                <div class="td-connection-actions">
                  <TDButton :noMargin="true" @click="saveConnection"
                    :label="$t('i18nCommon.remoteDesktop.saveConnection')" />
                  <TDButton :noMargin="true" :type="$tdEnum.buttonType.secondary" @click="createNewConnection"
                    :label="$t('i18nCommon.remoteDesktop.newConnection')" />
                </div>
              </div>
            </div>
            <div class="td-connection-list">
              <div class="flex td-connection-list-header">
                <span class="td-connection-list-title">{{
                  $t("i18nCommon.remoteDesktop.collection.title")
                }}</span>
                <div @click="loadConnections" class="td-icon td-reload-icon"
                  v-tooltip="$t('i18nCommon.remoteDesktop.collection.reload')"></div>
              </div>
              <div class="flex response-loading" v-if="isLoading">
                <TDLoading />
              </div>
              <div v-else-if="connections.length === 0" class="td-no-connections">
                {{ $t("i18nCommon.remoteDesktop.collection.noConnections") }}
              </div>
              <div v-else v-for="(conn, index) in connections" :key="index" class="td-connection-item" :class="{
                'td-connection-item-selected':
                  currentConnectionId === conn.id,
              }" @click="loadConnection(conn)">
                <div class="td-connection-info">
                  <span class="td-connection-name">{{
                    conn.connection_name
                  }}</span>
                  <span class="td-connection-host">{{ conn.host }}</span>
                </div>
                <div class="td-icon td-close-icon" @click.stop="deleteConnection(conn)"
                  v-tooltip="$t('i18nCommon.remoteDesktop.deleteConnection')"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col td-sub-sidebar" v-show="currentConfigLayout.currentSidebarOption ==
          $tdEnum.RemoteDesktopSidebarOption.Setting
          ">
          <div class="flex flex-col td-rdp-setting">
            <TDComboBox v-model="selectedResolution" :options="resolutionOptions" :noMargin="true" :isEditable="false"
              :width="100" :usingStylePercent="true"></TDComboBox>
            <TDComboBox v-model="selectedScaleFactor" :options="scaleFactorOptions" :noMargin="true" :isEditable="false"
              :width="100" :usingStylePercent="true" :label="$t('i18nCommon.remoteDesktop.scaleFactor')"></TDComboBox>
            <TDCheckbox :noMargin="true" :variant="$tdEnum.checkboxType.switch"
              v-model="currentConfigLayout.enableServerPointer"
              :label="$t('i18nCommon.remoteDesktop.enableServerPointer')" @change="updateConfigLayout"></TDCheckbox>
            <TDCheckbox :noMargin="true" :variant="$tdEnum.checkboxType.switch" v-model="currentConfigLayout.showLog"
              :label="$t('i18nCommon.remoteDesktop.showLog')" @change="updateConfigLayout"></TDCheckbox>
            <TDCheckbox :noMargin="true" :variant="$tdEnum.checkboxType.switch"
              v-model="currentConfigLayout.lowBandwidthMode" :label="$t('i18nCommon.remoteDesktop.lowBandwidthMode')"
              @change="updateConfigLayout"></TDCheckbox>
            <TDCheckbox :noMargin="true" :variant="$tdEnum.checkboxType.switch"
              v-model="currentConfigLayout.sendBrowserTimezone"
              :label="$t('i18nCommon.remoteDesktop.sendBrowserTimezone')" @change="updateConfigLayout"></TDCheckbox>
          </div>
        </div>
      </template>
    </TDSubSidebar>
  </div>
</template>

<script>
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDRemoteDesktopRDPHelp from "@/views/helps/TDRemoteDesktopRDPHelp.vue";
import TDServerRDPAPI from "@/common/api/request/AgentAPI/TDServerRDPAPI.js";
import TDDynamicBackgroundEffect from "@/views/backgroundEffect/TDDynamicBackgroundEffect.vue";
import TDFullTabWrapper from "@/components/TDFullTabWrapper.vue";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";

// Bit values of the Rust `PerformanceFlags` bitflags, sent to the backend as a bitmask.
const PERF_FLAG_DISABLE_WALLPAPER = 0x00000001;
const PERF_FLAG_DISABLE_FULLWINDOWDRAG = 0x00000002;
const PERF_FLAG_DISABLE_MENUANIMATIONS = 0x00000004;
const PERF_FLAG_DISABLE_THEMING = 0x00000008;
const PERF_FLAG_DISABLE_CURSOR_SHADOW = 0x00000020;
const PERF_FLAG_DISABLE_CURSORSETTINGS = 0x00000040;
const PERF_FLAG_ENABLE_FONT_SMOOTHING = 0x00000080;
const PERF_FLAG_DISABLE_DESKTOP_COMPOSITION = 0x00000100;

// Matches IronRDP's own default, so behaviour is unchanged when low bandwidth mode is off.
const PERF_FLAG_BASE =
  PERF_FLAG_DISABLE_FULLWINDOWDRAG |
  PERF_FLAG_DISABLE_MENUANIMATIONS |
  PERF_FLAG_ENABLE_FONT_SMOOTHING;

// Stops the server from sending wallpaper, theming, font smoothing and cursor
// effects. Cuts bandwidth and CPU noticeably on a slow link.
const PERF_FLAG_LOW_BANDWIDTH =
  PERF_FLAG_DISABLE_WALLPAPER |
  PERF_FLAG_DISABLE_THEMING |
  PERF_FLAG_DISABLE_CURSOR_SHADOW |
  PERF_FLAG_DISABLE_CURSORSETTINGS |
  PERF_FLAG_DISABLE_DESKTOP_COMPOSITION;

// [MS-RDPECLIP] 2.2.5.3 FileContentsFlags
const RDP_FILE_CONTENTS_FLAG_SIZE = 0x1;
const RDP_FILE_CONTENTS_FLAG_RANGE = 0x2;

// Keep in sync with the reference web client. A FileContentsRequest is a single
// PDU, so chunks that are too large may not fit the server's limit.
const RDP_FILE_CHUNK_SIZE = 64 * 1024;

export default {
  name: "TDRemoteDesktop",
  extends: TDToolBase,
  components: {
    TDSubSidebar,
    TDRemoteDesktopRDPHelp,
    TDDynamicBackgroundEffect,
    TDFullTabWrapper,
  },

  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.RemoteDesktopConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.RemoteDesktopSidebarOption.Help,
        showLog: false,
        resolution: "1920x1080",
        scaleFactor: 100,
        enableServerPointer: true,
        lowBandwidthMode: false,
        sendBrowserTimezone: true,
      },
      isHideEffectBackground: false,
      host: "",
      username: "",
      password: "",
      isConnected: false,
      isConnecting: false,
      isFullTab: false,
      session: null,
      wasmInitialized: false,
      canvasWidth: 1920,
      canvasHeight: 1080,
      logEntries: [],
      connections: [],
      currentConnectionId: null,
      connectionName: "",
      isLoading: false,
      agentAPI: null,
      remoteFilesDialogId: null,
      // File transfer state. `clipDataId` is the remote clipboard lock id and must
      // be sent with every FileContentsRequest, otherwise the transfer never completes.
      nextFileStreamId: 1,
      incomingFiles: [],
      incomingFileClipDataId: null,
      activeDownloads: new Map(),
      uploadFileHandles: new Map(),
      remoteClipDataLocks: new Set(),
      resolutions: [
        { value: "800x600", label: "800x600", width: 800, height: 600 },
        { value: "1024x768", label: "1024x768", width: 1024, height: 768 },
        { value: "1280x720", label: "1280x720 (HD)", width: 1280, height: 720 },
        { value: "1280x800", label: "1280x800", width: 1280, height: 800 },
        { value: "1366x768", label: "1366x768", width: 1366, height: 768 },
        { value: "1440x900", label: "1440x900", width: 1440, height: 900 },
        {
          value: "1600x900",
          label: "1600x900 (HD+)",
          width: 1600,
          height: 900,
        },
        {
          value: "1920x1080",
          label: "1920x1080 (Full HD)",
          width: 1920,
          height: 1080,
        },
        {
          value: "2560x1440",
          label: "2560x1440 (2K)",
          width: 2560,
          height: 1440,
        },
        {
          value: "3840x2160",
          label: "3840x2160 (4K)",
          width: 3840,
          height: 2160,
        },
      ],
    };
  },
  watch: {
    connectionName(oldVal, newVal) {
      if (oldVal != newVal) {
        this.reBuildTabTitle(this.connectionName);
      }
    },
  },
  computed: {
    resolutionOptions() {
      return this.resolutions.map((r) => ({
        value: r.value,
        label: r.label,
      }));
    },
    selectedResolution: {
      get() {
        return this.currentConfigLayout.resolution || "1920x1080";
      },
      set(value) {
        const res = this.resolutions.find((r) => r.value === value);
        if (res) {
          this.canvasWidth = res.width;
          this.canvasHeight = res.height;
        }
        this.currentConfigLayout.resolution = value;
        this.updateConfigLayout();
      },
    },
    selectedScaleFactor: {
      get() {
        return this.currentConfigLayout.scaleFactor || 100;
      },
      set(value) {
        this.currentConfigLayout.scaleFactor = value;
        this.updateConfigLayout();
      },
    },
    scaleFactorOptions() {
      return [
        { value: 100, label: "100%" },
        { value: 125, label: "125%" },
        { value: 150, label: "150%" },
        { value: 175, label: "175%" },
        { value: 200, label: "200%" },
        { value: 250, label: "250%" },
        { value: 300, label: "300%" },
      ];
    },
    sidebarOptions() {
      let options = [];
      options.push({
        value: this.$tdEnum.RemoteDesktopSidebarOption.Help,
        label: this.$t("i18nCommon.remoteDesktop.sidebarOption.help"),
        icon: "td-help-icon",
      });
      options.push({
        value: this.$tdEnum.RemoteDesktopSidebarOption.Collection,
        label: this.$t("i18nCommon.remoteDesktop.sidebarOption.collection"),
        icon: "td-folder-icon",
      });
      options.push({
        value: this.$tdEnum.RemoteDesktopSidebarOption.Setting,
        label: this.$t("i18nCommon.remoteDesktop.sidebarOption.setting"),
        icon: "td-setting-icon",
      });
      return options;
    },
  },

  async mounted() {
    this.agentAPI = new TDServerRDPAPI();
    this.setupInputHandlers();
    this.addLog(this.$t("i18nCommon.remoteDesktop.ready"), "info");
    await this.loadConnections();
  },

  beforeUnmount() {
    let me = this;
    me.handleDisconnect();
    me.closeRemoteFilesDialog();
    // Danh sách file chỉ bị xoá khi component bị huỷ. Đóng popup hay ngắt kết
    // nối đều giữ nguyên danh sách.
    me.clearIncomingFiles();
  },

  methods: {
    buildPerformanceFlags() {
      let me = this;
      let flags = PERF_FLAG_BASE;
      if (me.currentConfigLayout.lowBandwidthMode) {
        flags |= PERF_FLAG_LOW_BANDWIDTH;
      }
      return flags >>> 0;
    },

    // `Date#getTimezoneOffset()` already matches the MS-RDPBCGR bias convention:
    // minutes of UTC minus local, so a client ahead of UTC sends a negative value.
    buildTimezoneInfo() {
      let offsetMinutes = new Date().getTimezoneOffset();
      let timeZone = "GMT";
      try {
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "GMT";
      } catch (e) { }
      let tz = timeZone.replace(/[^A-Za-z0-9_/+-]/g, "_");
      return {
        bias: offsetMinutes,
        standard_name: tz,
        daylight_name: tz,
      };
    },

    addLog(message, type = "info") {
      const time = new Date().toLocaleTimeString("en-US", { hour12: false });
      this.logEntries.push({ time, message, type });
      if (this.logEntries.length > 200) {
        this.logEntries.splice(0, this.logEntries.length - 200);
      }
      this.$nextTick(() => {
        const panel = this.$refs.logPanel;
        if (panel) panel.scrollTop = panel.scrollHeight;
      });
    },

    async loadConnections() {
      let me = this;
      me.isLoading = true;
      try {
        let response = await me.agentAPI.rdpConnection.getAll();
        let data = response?.data?.data ?? [];
        if (response && response.success && Array.isArray(data)) {
          me.connections.splice(0, me.connections.length, ...data);
        }
      } catch (error) {
        console.error(
          me.$t("i18nCommon.remoteDesktop.collection.loadError"),
          error,
        );
        me.$tdUtility.showErrorNotFoundAgentServer();
      } finally {
        me.isLoading = false;
      }
    },

    async loadConnection(conn) {
      let me = this;
      if (me.isConnected) {
        me.handleDisconnect();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      me.currentConnectionId = conn.id;
      me.connectionName = conn.connection_name;
      me.host = conn.host;
      me.username = conn.username || "";
      me.password = conn.password || "";
      await me.handleConnect();
    },

    createNewConnection() {
      let me = this;
      if (me.isConnected) {
        me.handleDisconnect();
      }
      me.currentConnectionId = null;
      me.connectionName = "";
      me.host = "";
      me.username = "";
      me.password = "";
    },

    async saveConnection() {
      let me = this;
      if (!me.connectionName) {
        me.$tdToast.warning(
          me.$t("i18nCommon.remoteDesktop.connectionNameRequired"),
        );
        return;
      }
      if (!me.host) {
        me.$tdToast.warning(me.$t("i18nCommon.remoteDesktop.hostRequired"));
        return;
      }

      let connData = {
        connection_name: me.connectionName,
        host: me.host,
        username: me.username,
        password: me.password,
      };

      try {
        if (me.currentConnectionId) {
          connData.id = me.currentConnectionId;
          let response = await me.agentAPI.rdpConnection.update(connData);
          if (response && response.success) {
            me.$tdToast.success(me.$t("i18nCommon.remoteDesktop.saveSuccess"));
            await me.loadConnections();
          }
        } else {
          let response = await me.agentAPI.rdpConnection.create(connData);
          if (response && response.success) {
            me.$tdToast.success(me.$t("i18nCommon.remoteDesktop.saveSuccess"));
            me.currentConnectionId = response.data?.data?.id;
            await me.loadConnections();
          }
        }
      } catch (error) {
        console.error(me.$t("i18nCommon.remoteDesktop.saveError"), error);
        me.$tdToast.error(me.$t("i18nCommon.remoteDesktop.saveError"));
      }
    },

    async deleteConnection(conn) {
      let me = this;
      await me.deleteConnectionById(conn.id);
    },

    async deleteConnectionById(id) {
      let me = this;
      try {
        let response = await me.agentAPI.rdpConnection.deleteById(id);
        if (response && response.success) {
          me.$tdToast.success(me.$t("i18nCommon.remoteDesktop.deleteSuccess"));
          if (me.currentConnectionId === id) {
            me.createNewConnection();
          }
          await me.loadConnections();
        }
      } catch (error) {
        console.error(me.$t("i18nCommon.remoteDesktop.deleteError"), error);
        me.$tdToast.error(me.$t("i18nCommon.remoteDesktop.deleteError"));
      }
    },

    async handleConnect() {
      if (this.isConnected || this.isConnecting) return;
      const destination = this.host.trim();
      const username = this.username.trim();
      const password = this.password;

      if (!destination || !username) {
        this.addLog(
          this.$t("i18nCommon.remoteDesktop.validationError"),
          "error",
        );
        return;
      }

      this.isConnecting = true;
      try {
        if (!this.wasmInitialized) {
          this.addLog(this.$t("i18nCommon.remoteDesktop.loadingWasm"), "info");
          const wasmModule = await import("@wasm/pkg/rdp_client.js");
          await wasmModule.default();
          wasmModule.setup("info");
          this.wasmInitialized = true;
          this._wasm = wasmModule;
          this.addLog(this.$t("i18nCommon.remoteDesktop.wasmReady"), "success");
        }

        const { SessionBuilder, DesktopSize, Extension } = this._wasm;
        const canvas = this.$refs.rdpCanvas;

        const agentUrl = window.__tdAPI?.automation?.agentURL;
        const proxyAddress =
          agentUrl.replace(/^http/, "ws").replace(/\/$/, "") + "/rdp/ws";

        this.addLog(
          `${this.$t("i18nCommon.remoteDesktop.connecting")} ${destination}`,
          "info",
        );

        const desktopSize = new DesktopSize(
          this.canvasWidth,
          this.canvasHeight,
        );
        const enableCredsspExt = new Extension("enable_credssp", true);

        const builder = new SessionBuilder();
        builder.username(username);
        builder.password(password);
        builder.destination(destination);
        builder.proxyAddress(proxyAddress);
        builder.authToken("none");
        builder.desktopSize(desktopSize);
        builder.renderCanvas(canvas);
        builder.extension(enableCredsspExt);

        // RDP-specific options are passed through the extension mechanism
        // (SessionBuilder::extension) to keep the iron-remote-desktop API
        // protocol-agnostic. The backend interprets each ident.
        const tuningExtensions = [
          new Extension(
            "enable_server_pointer",
            this.currentConfigLayout.enableServerPointer,
          ),
          new Extension(
            "pointer_software_rendering",
            this.currentConfigLayout.enableServerPointer,
          ),
          new Extension("desktop_scale_factor", this.selectedScaleFactor),
          new Extension(
            "performance_flags",
            this.buildPerformanceFlags(),
          ),
        ];
        if (this.currentConfigLayout.sendBrowserTimezone) {
          tuningExtensions.push(
            new Extension("timezone_info", this.buildTimezoneInfo()),
          );
        }
        tuningExtensions.forEach((ext) => builder.extension(ext));

        // File transfer runs over the clipboard channel (MS-RDPECLIP). The callbacks are
        // registered on the builder, the operations are invoked on the live session.
        builder.extension(
          new Extension("files_available_callback", (files, clipDataId) => {
            this.onRemoteFilesAvailable(files, clipDataId);
          }),
        );
        builder.extension(
          new Extension("file_contents_request_callback", (request) => {
            this.onRemoteFileContentsRequest(request);
          }),
        );
        builder.extension(
          new Extension("file_contents_response_callback", (response) => {
            this.onRemoteFileContentsResponse(response);
          }),
        );
        builder.extension(
          new Extension("lock_callback", (dataId) => {
            this.remoteClipDataLocks.add(dataId);
          }),
        );
        builder.extension(
          new Extension("unlock_callback", (dataId) => {
            this.remoteClipDataLocks.delete(dataId);
          }),
        );
        builder.extension(
          new Extension("locks_expired_callback", (clipDataIds) => {
            this.onRemoteLocksExpired(clipDataIds);
          }),
        );
        builder.extension(
          new Extension("format_list_response_callback", (ok) => {
            if (ok) {
              this.addLog(
                this.$t("i18nCommon.remoteDesktop.uploadListAccepted"),
                "success",
              );
            } else {
              this.addLog(
                this.$t("i18nCommon.remoteDesktop.uploadListRejected"),
                "error",
              );
            }
          }),
        );

        builder.setCursorStyleCallbackContext(canvas);
        // không set curor ở đây để đảm bảo khi di chuột vào canvas thì hiển thị icon cursor của IronRDP thay vì cursor style của trình duyệt
        builder.setCursorStyleCallback((style) => { });

        builder.remoteClipboardChangedCallback((clipboardData) => {
          try {
            const items = clipboardData.items();
            for (const item of items) {
              if (
                item.mimeType() === "text/plain" ||
                item.mimeType().includes("text")
              ) {
                const text = item.value();
                if (text) {
                  this.$tdUtility.copyToClipboard(text, false);
                }
                break;
              }
            }
          } catch (e) {
            this.addLog(
              "Error handling remote clipboard change: " + e,
              "error",
            );
          }
        });

        this.session = await builder.connect();
        const ds = this.session.desktopSize();
        this.canvasWidth = ds.width;
        this.canvasHeight = ds.height;
        this.isConnected = true;
        this.isHideEffectBackground = true;
        this.isConnecting = false;

        this.addLog(
          `${this.$t("i18nCommon.remoteDesktop.connected")} ${ds.width}x${ds.height}`,
          "success",
        );

        canvas.focus();

        this.session
          .run()
          .then((info) => {
            this.addLog(
              `${this.$t("i18nCommon.remoteDesktop.sessionEnded")}: ${info.reason()}`,
              "warn",
            );
            this.cleanup();
          })
          .catch((e) => {
            this.addLog(
              `${this.$t("i18nCommon.remoteDesktop.sessionError")}: ${this.formatError(e)}`,
              "error",
            );
            this.cleanup();
          });
      } catch (e) {
        this.addLog(
          `${this.$t("i18nCommon.remoteDesktop.connectionFailed")}: ${this.formatError(e)}`,
          "error",
        );
        this.cleanup();
      }
    },

    handleDisconnect() {
      if (this.session) {
        try {
          this.session.shutdown();
          this.addLog(
            this.$t("i18nCommon.remoteDesktop.disconnectedByUser"),
            "warn",
          );
        } catch (e) {
          this.addLog(
            `${this.$t("i18nCommon.remoteDesktop.disconnectError")}: ${this.formatError(e)}`,
            "error",
          );
        }
      }
      this.cleanup();
    },

    cleanup() {
      let me = this;
      this.session = null;
      this.isConnected = false;
      this.isConnecting = false;
      me.activeDownloads.clear();
      me.uploadFileHandles.clear();
      me.remoteClipDataLocks.clear();
      // Giữ danh sách file đã nhận khi ngắt kết nối. Chỉ xoá khi component bị
      // huỷ (beforeUnmount). clipDataId phải bỏ vì lock clipboard phía máy remote
      // không còn tồn tại.
      me.incomingFileClipDataId = null;
    },

    toggleFullTab() {
      this.isFullTab = !this.isFullTab;
      if (!this.isFullTab && document.fullscreenElement) {
        document.exitFullscreen();
      }
    },

    takeScreenshot() {
      const canvas = this.$refs.rdpCanvas;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `rdp-screenshot-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      this.addLog(
        this.$t("i18nCommon.remoteDesktop.screenshotSaved"),
        "success",
      );
    },

    sendCtrlAltDel() {
      if (!this.session) return;
      try {
        const { DeviceEvent, InputTransaction } = this._wasm;
        const tx = new InputTransaction();
        tx.addEvent(DeviceEvent.keyPressed(0x1d)); // ControlLeft
        tx.addEvent(DeviceEvent.keyPressed(0x38)); // AltLeft
        tx.addEvent(DeviceEvent.keyPressed(0xe053)); // Delete
        tx.addEvent(DeviceEvent.keyReleased(0xe053));
        tx.addEvent(DeviceEvent.keyReleased(0x38));
        tx.addEvent(DeviceEvent.keyReleased(0x1d));
        this.session.applyInputs(tx);
        this.addLog("Sent Ctrl + Alt + Del", "info");
      } catch (e) {
        this.addLog(
          "Failed to send Ctrl+Alt+Del: " + this.formatError(e),
          "error",
        );
      }
    },

    // ─────────────────────────── File transfer (MS-RDPECLIP) ───────────────────────────

    /**
     * Gửi file từ máy ngoài lên máy trong.
     * Advertise qua FormatList, sau đó máy trong sẽ paste và yêu cầu từng chunk.
     */
    sendFilesToRemote(files) {
      let me = this;
      if (!me.session || !files || files.length === 0) return;
      try {
        let fileInfos = Array.from(files).map((file) => ({
          name: file.name,
          size: file.size,
          lastModified: file.lastModified || 0,
        }));
        me.session.invokeExtension(
          new me._wasm.Extension("initiate_file_copy", fileInfos),
        );
        me.uploadFileHandles.clear();
        Array.from(files).forEach((file, index) => {
          me.uploadFileHandles.set(index, file);
        });
        me.addLog(
          `${me.$t("i18nCommon.remoteDesktop.sentFileList")} ${fileInfos.length}`,
          "info",
        );
      } catch (e) {
        me.addLog(
          `${me.$t("i18nCommon.remoteDesktop.uploadInitFailed")}: ${me.formatError(e)}`,
          "error",
        );
      }
    },

    /**
     * Máy trong yêu cầu nội dung file (upload). Đọc đúng chunk được hỏi rồi trả lời.
     * flags: SIZE (0x1) trả về 8 byte LE u64, RANGE (0x2) trả về byte range.
     */
    async onRemoteFileContentsRequest(request) {
      let me = this;
      let file = me.uploadFileHandles.get(request.index);
      if (!file) {
        me.session.invokeExtension(
          new me._wasm.Extension("submit_file_contents", {
            stream_id: request.streamId,
            is_error: true,
            data: new Uint8Array(0),
          }),
        );
        return;
      }
      try {
        let data;
        if (request.flags & RDP_FILE_CONTENTS_FLAG_SIZE) {
          // SIZE: position phải 0 và size phải 8, nội dung là 8 byte LE u64.
          let sizeBuffer = new ArrayBuffer(8);
          new DataView(sizeBuffer).setBigUint64(0, BigInt(file.size), true);
          data = new Uint8Array(sizeBuffer);
        } else {
          let chunk = file.slice(
            request.position,
            request.position + request.size,
          );
          data = new Uint8Array(await chunk.arrayBuffer());
        }
        me.session.invokeExtension(
          new me._wasm.Extension("submit_file_contents", {
            stream_id: request.streamId,
            is_error: false,
            data: data,
          }),
        );
      } catch (e) {
        me.session.invokeExtension(
          new me._wasm.Extension("submit_file_contents", {
            stream_id: request.streamId,
            is_error: true,
            data: new Uint8Array(0),
          }),
        );
        me.addLog(
          `${me.$t("i18nCommon.remoteDesktop.uploadChunkFailed")}: ${me.formatError(e)}`,
          "error",
        );
      }
    },

    /**
     * Máy trong đưa ra danh sách file muốn gửi. Chỉ lưu vào danh sách chờ và hiện
     * badge đếm trên nút toolbar, không tự mở popup cho tới khi người dùng bấm nút.
     */
    onRemoteFilesAvailable(files, clipDataId) {
      let me = this;
      let list = Array.from(files || []);
      if (list.length === 0) return;
      // Giữ luôn index gốc của máy trong. Bỏ entry thư mục sẽ làm lệch index,
      // mà file_index phải trỏ đúng vị trí trong danh sách gốc phía máy trong.
      let received = list
        .map((f, remoteIndex) => ({ ...f, remoteIndex: remoteIndex }))
        .filter((f) => !f.isDirectory);
      // Gán lại mảng để danh sách mới thay thế hoàn toàn danh sách cũ.
      me.incomingFiles = received;
      me.incomingFileClipDataId =
        clipDataId === undefined ? null : clipDataId;
      me.addLog(
        `${me.$t("i18nCommon.remoteDesktop.receivedFileList")} ${received.length}`,
        "info",
      );
    },

    /**
     * Bấm nút tải về: mở popup danh sách và bắt đầu tải luôn, không bắt thêm
     * thao tác chọn từng file.
     */
    async openReceiveFilesDialog() {
      let me = this;
      if (!me.isConnected) return;
      if (me.remoteFilesDialogId) return;
      me.remoteFilesDialogId = await TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDRDPRemoteFilesPopup,
        ownerForm: me,
        param: {
          getFiles: () => me.incomingFiles,
          // Popup đã đóng: chỉ nhả handle để mở lại được, không xoá danh sách.
          onDialogClosed: () => {
            me.remoteFilesDialogId = null;
          },
          onDownloadFile: (index) => me.downloadIncomingFileAt(index),
          onDownloadAllFiles: () => me.downloadAllIncomingFiles(),
          onRemoveFile: (index) => me.removeIncomingFile(index),
          onClearFiles: () => me.clearIncomingFiles(),
        },
      });
    },

    closeRemoteFilesDialog() {
      let me = this;
      if (!me.remoteFilesDialogId) return;
      TDDialogUtil.closeById(me.remoteFilesDialogId);
      me.remoteFilesDialogId = null;
    },

    /**
     * Bắt đầu tải 1 file: hỏi size trước (SIZE), rồi mới kéo từng chunk (RANGE).
     * Không hỏi SIZE thì không biết khi nào dừng.
     */
    startFileDownload(file, fileIndex, clipDataId) {
      let me = this;
      let streamId = me.nextFileStreamId;
      me.nextFileStreamId = (me.nextFileStreamId + 1) >>> 0;
      if (me.nextFileStreamId === 0) me.nextFileStreamId = 1;
      // Giữ clipDataId trong state để việc xóa danh sách trên UI không làm hỏng
      // các download đang chạy dở.
      me.activeDownloads.set(streamId, {
        fileIndex: fileIndex,
        file: file,
        fileName: file.name,
        clipDataId: clipDataId === null ? undefined : clipDataId,
        totalSize: 0,
        receivedBytes: 0,
        chunks: [],
      });
      me.session.invokeExtension(
        new me._wasm.Extension("request_file_contents", {
          stream_id: streamId,
          file_index: fileIndex,
          flags: RDP_FILE_CONTENTS_FLAG_SIZE,
          position: 0,
          size: 8,
          clip_data_id: clipDataId === null ? undefined : clipDataId,
        }),
      );
    },

    /**
     * Tải toàn bộ file trong danh sách. Danh sách chỉ bị xoá khi người dùng bấm
     * xoá, nên bấm nhiều lần vẫn tải lại được, không có trạng thái chặn.
     */
    downloadAllIncomingFiles() {
      let me = this;
      if (!me.session || me.incomingFiles.length === 0) return;
      me.incomingFiles.forEach((file) => {
        me.startFileDownload(file, file.remoteIndex, me.incomingFileClipDataId);
      });
      me.addLog(
        `${me.$t("i18nCommon.remoteDesktop.downloading")} ${me.incomingFiles.length}`,
        "info",
      );
    },

    /**
     * Tải đúng 1 file theo vị trí trong danh sách (người dùng bấm vào dòng đó).
     */
    downloadIncomingFileAt(index) {
      let me = this;
      if (!me.session) return;
      let file = me.incomingFiles[index];
      if (!file) return;
      me.startFileDownload(file, file.remoteIndex, me.incomingFileClipDataId);
      me.addLog(
        `${me.$t("i18nCommon.remoteDesktop.downloading")} ${file.name}`,
        "info",
      );
    },

    /**
     * Nhận chunk từ máy trong: đáp ứng SIZE request, hoặc gom RANGE chunk cho tới
     * khi đủ rồi ghép thành Blob và gọi save xuống đĩa.
     */
    onRemoteFileContentsResponse(response) {
      let me = this;
      let state = me.activeDownloads.get(response.streamId);
      if (!state) return;

      if (response.isError) {
        me.activeDownloads.delete(response.streamId);
        me.addLog(
          `${me.$t("i18nCommon.remoteDesktop.downloadFailed")}: ${state.fileName}`,
          "error",
        );
        return;
      }

      let data = new Uint8Array(response.data);

      if (state.totalSize === 0) {
        // Đây là kết quả của SIZE request: 8 byte LE u64 là tổng dung lượng file.
        let view = new DataView(
          data.buffer,
          data.byteOffset,
          data.byteLength,
        );
        state.totalSize = Number(view.getBigUint64(0, true));
        if (state.totalSize === 0) {
          // File rỗng: xong ngay, không cần kéo chunk nào.
          me.finishFileDownload(response.streamId, state);
          return;
        }
        me.requestNextFileChunk(response.streamId, state);
        return;
      }

      state.chunks.push(data);
      state.receivedBytes += data.length;
      if (state.receivedBytes >= state.totalSize) {
        me.finishFileDownload(response.streamId, state);
      } else {
        me.requestNextFileChunk(response.streamId, state);
      }
    },

    requestNextFileChunk(streamId, state) {
      let me = this;
      let position = state.receivedBytes;
      let size = Math.min(RDP_FILE_CHUNK_SIZE, state.totalSize - position);
      me.session.invokeExtension(
        new me._wasm.Extension("request_file_contents", {
          stream_id: streamId,
          file_index: state.fileIndex,
          flags: RDP_FILE_CONTENTS_FLAG_RANGE,
          position: position,
          size: size,
          clip_data_id: state.clipDataId,
        }),
      );
    },

    finishFileDownload(streamId, state) {
      let me = this;
      me.activeDownloads.delete(streamId);
      let fileName = me.$tdUtility.createFileDownloadName(state.fileName, {
        fallback: "rdp-file",
      });
      let blob = new Blob(state.chunks, { type: "application/octet-stream" });
      me.$tdUtility.createDownloadFileFromBlob(blob, fileName);
      me.addLog(
        `${me.$t("i18nCommon.remoteDesktop.downloaded")} ${fileName}`,
        "success",
      );
      // Giữ file trong danh sách, chỉ đánh dấu đã tải. Người dùng tự xoá khi
      // không cần nữa, tránh mất danh sách vì tải tự động.
      state.file.downloaded = true;
    },

    /**
     * Xoá 1 file khỏi danh sách chờ (người dùng bấm nút xoá trên popup).
     */
    removeIncomingFile(index) {
      let me = this;
      if (index < 0 || index >= me.incomingFiles.length) return;
      me.incomingFiles.splice(index, 1);
      me.syncIncomingFileClipDataId();
    },

    /**
     * Xoá toàn bộ danh sách chờ. Không đụng download đang chạy dở vì chúng đã giữ
     * clipDataId riêng trong state.
     */
    clearIncomingFiles() {
      let me = this;
      // Dùng splice thay vì gán mảng mới, để mọi tham chiếu đang giữ tới danh sách
      // (popup, download đang chạy) thấy thay đổi ngay.
      me.incomingFiles.splice(0, me.incomingFiles.length);
      me.incomingFileClipDataId = null;
    },

    /**
     * clipDataId là lock của clipboard phía máy remote, hết ý nghĩa khi danh sách
     * đã rỗng.
     */
    syncIncomingFileClipDataId() {
      let me = this;
      if (me.incomingFiles.length === 0) {
        me.incomingFileClipDataId = null;
      }
    },

    /**
     * Lock clipboard phía máy trong hết hạn: huỷ toàn bộ download đang dắt,
     * nếu không chúng sẽ treo vĩnh viễn.
     */
    onRemoteLocksExpired(clipDataIds) {
      let me = this;
      let expired = new Set(Array.from(clipDataIds || []));
      expired.forEach((dataId) => {
        me.remoteClipDataLocks.delete(dataId);
      });
      me.activeDownloads.forEach((state, streamId) => {
        me.activeDownloads.delete(streamId);
        me.addLog(
          `${me.$t("i18nCommon.remoteDesktop.downloadAborted")} ${state.fileName}`,
          "warn",
        );
      });
      // Danh sách đang chỉ dùng được khi lock của nó còn hiệu lực. Lock hết hạn
      // thì các file ấy không lấy được nữa, đóng popup để danh sách được xoá.
      if (
        me.incomingFileClipDataId !== null &&
        expired.has(me.incomingFileClipDataId)
      ) {
        me.closeRemoteFilesDialog();
      }
    },

    formatError(e) {
      if (e && typeof e === "object" && "__wbg_ptr" in e) {
        try {
          const kindNames = {
            0: "General",
            1: "WrongPassword",
            2: "LogonFailure",
            3: "AccessDenied",
            4: "RDCleanPath",
            5: "ProxyConnect",
            6: "NegotiationFailure",
          };
          const kind = e.kind ? e.kind() : "Unknown";
          const bt = e.backtrace ? e.backtrace() : "";
          return `[${kindNames[kind] || kind}] ${bt}`;
        } catch (_) { }
      }
      return e?.message || e?.toString() || String(e);
    },

    setupInputHandlers() { },

    onCanvasKeydown(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!this.session) return;
      const scancode = this.getScancode(e.code);
      if (scancode === null) return;

      // Intercept Ctrl+V or Cmd+V to sync clipboard before sending the keystroke
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyV") {
        this.syncClipboardToRemoteAndPaste(scancode);
        return;
      }

      try {
        const { DeviceEvent, InputTransaction } = this._wasm;
        const event = DeviceEvent.keyPressed(scancode);
        const tx = new InputTransaction();
        tx.addEvent(event);
        this.session.applyInputs(tx);
      } catch (_) { }
    },

    async syncClipboardToRemoteAndPaste(vScancode) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          const { ClipboardData } = this._wasm;
          const content = new ClipboardData();
          content.addText("text/plain", text);
          await this.session.onClipboardPaste(content);
        }
      } catch (err) {
        this.addLog("Could not read local clipboard: " + err, "warn");
      }

      // After syncing, send the V keydown to remote
      if (!this.session) return;
      try {
        const { DeviceEvent, InputTransaction } = this._wasm;
        const event = DeviceEvent.keyPressed(vScancode);
        const tx = new InputTransaction();
        tx.addEvent(event);
        this.session.applyInputs(tx);
      } catch (_) { }
    },

    onCanvasKeyup(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!this.session) return;
      const scancode = this.getScancode(e.code);
      if (scancode === null) return;
      try {
        const { DeviceEvent, InputTransaction } = this._wasm;
        const event = DeviceEvent.keyReleased(scancode);
        const tx = new InputTransaction();
        tx.addEvent(event);
        this.session.applyInputs(tx);
      } catch (_) { }
    },

    onCanvasMousemove(e) {
      if (!this.session) return;
      try {
        const canvas = this.$refs.rdpCanvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.round((e.clientX - rect.left) * scaleX);
        const y = Math.round((e.clientY - rect.top) * scaleY);
        const { DeviceEvent, InputTransaction } = this._wasm;
        const event = DeviceEvent.mouseMove(x, y);
        const tx = new InputTransaction();
        tx.addEvent(event);
        this.session.applyInputs(tx);
      } catch (_) { }
    },

    onCanvasMousedown(e) {
      e.preventDefault();
      this.$refs.rdpCanvas?.focus();
      if (!this.session) return;
      try {
        const { DeviceEvent, InputTransaction } = this._wasm;
        const event = DeviceEvent.mouseButtonPressed(e.button);
        const tx = new InputTransaction();
        tx.addEvent(event);
        this.session.applyInputs(tx);
      } catch (_) { }
    },

    onCanvasMouseup(e) {
      e.preventDefault();
      if (!this.session) return;
      try {
        const { DeviceEvent, InputTransaction } = this._wasm;
        const event = DeviceEvent.mouseButtonReleased(e.button);
        const tx = new InputTransaction();
        tx.addEvent(event);
        this.session.applyInputs(tx);
      } catch (_) { }
    },

    onCanvasWheel(e) {
      e.preventDefault();
      if (!this.session) return;
      try {
        const { DeviceEvent, InputTransaction } = this._wasm;
        if (e.deltaY !== 0) {
          const amount = e.deltaY > 0 ? -1 : 1;
          const event = DeviceEvent.wheelRotations(true, amount, 1);
          const tx = new InputTransaction();
          tx.addEvent(event);
          this.session.applyInputs(tx);
        }
        if (e.deltaX !== 0) {
          const amount = e.deltaX > 0 ? -1 : 1;
          const event = DeviceEvent.wheelRotations(false, amount, 1);
          const tx = new InputTransaction();
          tx.addEvent(event);
          this.session.applyInputs(tx);
        }
      } catch (_) { }
    },

    onCanvasContextmenu(e) {
      e.preventDefault();
    },

    getScancode(code) {
      const SCANCODE_MAP = {
        Escape: 0x01,
        Digit1: 0x02,
        Digit2: 0x03,
        Digit3: 0x04,
        Digit4: 0x05,
        Digit5: 0x06,
        Digit6: 0x07,
        Digit7: 0x08,
        Digit8: 0x09,
        Digit9: 0x0a,
        Digit0: 0x0b,
        Minus: 0x0c,
        Equal: 0x0d,
        Backspace: 0x0e,
        Tab: 0x0f,
        KeyQ: 0x10,
        KeyW: 0x11,
        KeyE: 0x12,
        KeyR: 0x13,
        KeyT: 0x14,
        KeyY: 0x15,
        KeyU: 0x16,
        KeyI: 0x17,
        KeyO: 0x18,
        KeyP: 0x19,
        BracketLeft: 0x1a,
        BracketRight: 0x1b,
        Enter: 0x1c,
        ControlLeft: 0x1d,
        KeyA: 0x1e,
        KeyS: 0x1f,
        KeyD: 0x20,
        KeyF: 0x21,
        KeyG: 0x22,
        KeyH: 0x23,
        KeyJ: 0x24,
        KeyK: 0x25,
        KeyL: 0x26,
        Semicolon: 0x27,
        Quote: 0x28,
        Backquote: 0x29,
        ShiftLeft: 0x2a,
        Backslash: 0x2b,
        KeyZ: 0x2c,
        KeyX: 0x2d,
        KeyC: 0x2e,
        KeyV: 0x2f,
        KeyB: 0x30,
        KeyN: 0x31,
        KeyM: 0x32,
        Comma: 0x33,
        Period: 0x34,
        Slash: 0x35,
        ShiftRight: 0x36,
        NumpadMultiply: 0x37,
        AltLeft: 0x38,
        Space: 0x39,
        CapsLock: 0x3a,
        F1: 0x3b,
        F2: 0x3c,
        F3: 0x3d,
        F4: 0x3e,
        F5: 0x3f,
        F6: 0x40,
        F7: 0x41,
        F8: 0x42,
        F9: 0x43,
        F10: 0x44,
        NumLock: 0x45,
        ScrollLock: 0x46,
        Numpad7: 0x47,
        Numpad8: 0x48,
        Numpad9: 0x49,
        NumpadSubtract: 0x4a,
        Numpad4: 0x4b,
        Numpad5: 0x4c,
        Numpad6: 0x4d,
        NumpadAdd: 0x4e,
        Numpad1: 0x4f,
        Numpad2: 0x50,
        Numpad3: 0x51,
        Numpad0: 0x52,
        NumpadDecimal: 0x53,
        F11: 0x57,
        F12: 0x58,
        NumpadEnter: 0xe01c,
        ControlRight: 0xe01d,
        NumpadDivide: 0xe035,
        PrintScreen: 0xe037,
        AltRight: 0xe038,
        Home: 0xe047,
        ArrowUp: 0xe048,
        PageUp: 0xe049,
        ArrowLeft: 0xe04b,
        ArrowRight: 0xe04d,
        End: 0xe04f,
        ArrowDown: 0xe050,
        PageDown: 0xe051,
        Insert: 0xe052,
        Delete: 0xe053,
        MetaLeft: 0xe05b,
        MetaRight: 0xe05c,
        ContextMenu: 0xe05d,
        Pause: 0xe11d45,
      };
      return SCANCODE_MAP[code] ?? null;
    },
  },
};
</script>

<style scoped lang="scss">
.container {
  display: flex;
  width: 100%;
  height: 100%;
}

.main-tool {
  height: 100%;
  width: 100%;
}

.rdp-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-main-color);
  overflow: hidden;
}

.rdp-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.rdp-canvas-container {
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.rdp-canvas-cursor-none {
  cursor: none;
}

/* Badge kiểu app icon iOS: tròn, góc trên phải, lệch ra ngoài icon */
.rdp-download-btn {
  position: relative;
}

.td-file-badge {
  position: absolute;
  top: -1px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 2px;
  border-radius: 8px;
  background-color: #e5484d;
  color: #ffffff;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  white-space: nowrap;
  /* Viền màu nền để tách badge khỏi icon bên dưới */
  box-shadow: 0 0 0 1.5px var(--bg-layer-color);
  pointer-events: none;
}

.rdp-canvas {
  display: block;
  outline: none;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.rdp-log-panel {
  background: var(--bg-layer-color);
  border-radius: var(--border-radius);
  max-height: 140px;
  height: 140px;
  overflow-y: auto;
  padding: 6px 12px;
  line-height: 1.6;
  flex-shrink: 0;
}

.rdp-log-entry {
  white-space: pre-wrap;
  word-break: break-all;
}

.rdp-log-time {
  margin-right: var(--padding);
}

.td-sub-sidebar {
  height: 100%;
  justify-content: flex-start;
  width: 100%;
  overflow: auto;
}

.td-rdp-setting {
  gap: var(--padding);
  margin-top: var(--padding);
  width: 100%;

  .td-combobox {
    width: 100%;
  }
}

.td-rdp-collection {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--padding);
}

.td-collection-header {
  gap: var(--padding);
  width: 100%;
  margin-top: var(--padding);
}

.td-connection-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--padding);
}

.rdp-connection-input {
  width: 100%;
}

.rdp-port-input {
  width: 100px;
}

.td-connection-actions {
  display: flex;
  gap: var(--padding);
  width: 100%;
}

.td-connection-list {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.td-no-connections {
  padding: var(--padding);
  text-align: center;
  color: #6e7681;
}

.td-connection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--padding);
  border-radius: var(--border-radius);
  cursor: pointer;
  margin-bottom: var(--padding);
}

.td-connection-item:hover {
  background-color: var(--focus-color);
  color: var(--selected-item-text-color);
}

.td-connection-item-selected {
  background-color: var(--focus-color);
  color: var(--selected-item-text-color);
  font-weight: 600;
}

.td-connection-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.td-connection-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-connection-host {
  font-size: 12px;
  color: var(--text-color);
}

.response-loading {
  width: 100%;
  height: 100px;
  background-color: var(--bg-layer-color);
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  justify-content: center;
  align-items: center;
}

.td-setting-item {
  margin-top: var(--padding);
  padding: 0 var(--padding);
  width: 100%;
  box-sizing: border-box;
}

.td-connection-list-header {
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--padding);
  padding-right: var(--padding);
}

.td-connection-list-title {
  font-weight: 600;
  font-size: 14px;
}

.td-dynamic-effect-canvas {
  display: none;
}
</style>
