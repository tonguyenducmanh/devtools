<template>
  <div class="flex container">
    <div class="main-tool">
      <div class="rdp-container">
        <!-- Canvas area -->
        <div
          ref="canvasContainer"
          class="rdp-canvas-container"
          :class="{ 'rdp-canvas-container-full-tab': isFullTab }"
        >
          <canvas
            ref="rdpCanvas"
            class="rdp-canvas"
            :width="canvasWidth"
            :height="canvasHeight"
            tabindex="0"
            @keydown="onCanvasKeydown"
            @keyup="onCanvasKeyup"
            @mousemove="onCanvasMousemove"
            @mousedown="onCanvasMousedown"
            @mouseup="onCanvasMouseup"
            @wheel.prevent="onCanvasWheel"
            @contextmenu.prevent="onCanvasContextmenu"
          />
          <div v-if="isFullTab" class="fullscreen-toolbar">
            <div
              v-tooltip="$t('i18nCommon.remoteDesktop.exitFullscreen')"
              class="flex toolbar-btn"
              @click="closeFullTab"
            >
              <span class="td-icon td-exit-full-screen-icon"></span>
            </div>
            <div
              v-tooltip="$t('i18nCommon.remoteDesktop.screenshot')"
              class="flex toolbar-btn"
              @click="takeScreenshot"
            >
              <span class="td-icon td-camera-icon"></span>
            </div>
            <div
              v-tooltip="$t('i18nCommon.remoteDesktop.ctrlAltDel')"
              class="flex toolbar-btn"
              @click="sendCtrlAltDel"
              :class="{ 'toolbar-btn-disabled': !isConnected }"
            >
              <span class="td-icon td-command-code-icon"></span>
            </div>
            <div
              v-tooltip="$t('i18nCommon.remoteDesktop.fullscreen')"
              class="flex toolbar-btn"
              @click="toggleFullscreen"
            >
              <span class="td-icon td-full-screen-icon"></span>
            </div>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="rdp-toolbar">
          <div class="rdp-actions">
            <TDButton
              :noMargin="true"
              v-if="!isConnected && !isConnecting"
              @click="handleConnect"
              :label="$t('i18nCommon.remoteDesktop.connect')"
            />
            <TDButton
              :noMargin="true"
              :type="$tdEnum.buttonType.secondary"
              v-else
              @click="handleDisconnect"
              :label="$t('i18nCommon.remoteDesktop.disconnect')"
            />
            <TDButton
              :noMargin="true"
              :type="$tdEnum.buttonType.secondary"
              @click="openFullTab"
              :label="$t('i18nCommon.remoteDesktop.fullTab')"
            />
            <TDButton
              :noMargin="true"
              :type="$tdEnum.buttonType.secondary"
              @click="takeScreenshot"
              :label="$t('i18nCommon.remoteDesktop.screenshot')"
            />
            <TDButton
              :noMargin="true"
              :type="$tdEnum.buttonType.secondary"
              @click="sendCtrlAltDel"
              :readOnly="!isConnected"
              :label="'Ctrl + Alt + Del'"
            />
          </div>
        </div>

        <!-- Log panel -->
        <div
          v-if="currentConfigLayout.showLog"
          ref="logPanel"
          class="rdp-log-panel"
        >
          <div
            v-for="(entry, idx) in logEntries"
            :key="idx"
            class="rdp-log-entry"
            :class="`rdp-log-${entry.type}`"
          >
            <span class="rdp-log-time">{{ entry.time }}</span
            >{{ entry.message }}
          </div>
        </div>
      </div>
    </div>
    <TDSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="td-sidebar-menu">
          <TDSlideOption
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
          class="flex flex-col td-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.RemoteDesktopSidebarOption.Help
          "
        >
          <TDRemoteDesktopRDPHelp />
        </div>
        <div
          class="flex flex-col td-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.RemoteDesktopSidebarOption.Collection
          "
        >
          <div class="td-rdp-collection">
            <div class="flex flex-col td-collection-header">
              <div class="td-connection-form">
                <TDInput
                  v-model="connectionName"
                  :placeHolder="
                    $t('i18nCommon.remoteDesktop.connectionNamePlaceholder')
                  "
                  :noMargin="true"
                  class="rdp-connection-input"
                />
                <TDInput
                  v-model="host"
                  :placeHolder="$t('i18nCommon.remoteDesktop.hostPlaceholder')"
                  :noMargin="true"
                  class="rdp-connection-input"
                />
                <TDInput
                  v-model="username"
                  :placeHolder="
                    $t('i18nCommon.remoteDesktop.usernamePlaceholder')
                  "
                  :noMargin="true"
                  class="rdp-connection-input"
                />
                <TDInput
                  v-model="password"
                  :placeHolder="
                    $t('i18nCommon.remoteDesktop.passwordPlaceholder')
                  "
                  :inputType="'password'"
                  :noMargin="true"
                  class="rdp-connection-input"
                />
                <div class="td-connection-actions">
                  <TDButton
                    :noMargin="true"
                    @click="saveConnection"
                    :label="$t('i18nCommon.remoteDesktop.saveConnection')"
                  />
                  <TDButton
                    :noMargin="true"
                    :type="$tdEnum.buttonType.secondary"
                    @click="createNewConnection"
                    :label="$t('i18nCommon.remoteDesktop.newConnection')"
                  />
                </div>
              </div>
            </div>
            <div class="td-connection-list">
              <div class="flex td-connection-list-header">
                <span class="td-connection-list-title">{{
                  $t("i18nCommon.remoteDesktop.collection.title")
                }}</span>
                <div
                  @click="loadConnections"
                  class="td-icon td-reload-icon"
                  v-tooltip="$t('i18nCommon.remoteDesktop.collection.reload')"
                ></div>
              </div>
              <div class="flex response-loading" v-if="isLoading">
                <div class="loader"></div>
              </div>
              <div
                v-else-if="connections.length === 0"
                class="td-no-connections"
              >
                {{ $t("i18nCommon.remoteDesktop.collection.noConnections") }}
              </div>
              <div
                v-else
                v-for="(conn, index) in connections"
                :key="index"
                class="td-connection-item"
                :class="{
                  'td-connection-item-selected':
                    currentConnectionId === conn.id,
                }"
                @click="loadConnection(conn)"
              >
                <div class="td-connection-info">
                  <span class="td-connection-name">{{
                    conn.connection_name
                  }}</span>
                  <span class="td-connection-host">{{ conn.host }}</span>
                </div>
                <div
                  class="td-icon td-close-icon"
                  @click.stop="deleteConnection(conn)"
                  v-tooltip="$t('i18nCommon.remoteDesktop.deleteConnection')"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="flex flex-col td-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.RemoteDesktopSidebarOption.Setting
          "
        >
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.showLog"
            :label="$t('i18nCommon.remoteDesktop.showLog')"
            @change="updateConfigLayout"
          ></TDCheckbox>
          <TDComboBox
            v-model="selectedResolution"
            :options="resolutionOptions"
            :noMargin="true"
            :isEditable="false"
            :width="100"
            :usingStylePercent="true"
          ></TDComboBox>
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

export default {
  name: "TDRemoteDesktop",
  extends: TDToolBase,
  components: { TDSubSidebar, TDRemoteDesktopRDPHelp },

  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.RemoteDesktopConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.RemoteDesktopSidebarOption.Help,
        showLog: false,
        resolution: "1920x1080",
      },
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
    this.handleDisconnect();
  },

  methods: {
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
        let response = await me.agentAPI.getAllRDPConnections();
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

    loadConnection(conn) {
      let me = this;
      me.currentConnectionId = conn.id;
      me.connectionName = conn.connection_name;
      me.host = conn.host;
      me.username = conn.username || "";
      me.password = conn.password || "";
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
          let response = await me.agentAPI.updateRDPConnection(connData);
          if (response && response.success) {
            me.$tdToast.success(me.$t("i18nCommon.remoteDesktop.saveSuccess"));
            await me.loadConnections();
          }
        } else {
          let response = await me.agentAPI.createRDPConnection(connData);
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
        let response = await me.agentAPI.deleteRDPConnection(id);
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

        const agentUrl = window.__tdInfo?.agentURL;
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

        builder.setCursorStyleCallbackContext(canvas);
        builder.setCursorStyleCallback((style) => {
          canvas.style.cursor = style || "default";
        });

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
                  navigator.clipboard.writeText(text).catch((err) => {
                    this.addLog(
                      "Failed to write to local clipboard: " + err,
                      "error",
                    );
                  });
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
      this.session = null;
      this.isConnected = false;
      this.isConnecting = false;
    },
    openFullTab() {
      let me = this;
      me.isFullTab = true;
    },
    closeFullTab() {
      let me = this;
      me.isFullTab = false;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    },

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
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
        } catch (_) {}
      }
      return e?.message || e?.toString() || String(e);
    },

    setupInputHandlers() {},

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
      } catch (_) {}
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
      } catch (_) {}
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
      } catch (_) {}
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
      } catch (_) {}
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
      } catch (_) {}
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
      } catch (_) {}
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
      } catch (_) {}
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

.rdp-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: var(--padding);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.rdp-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: var(--padding);
  flex-wrap: wrap;
}

.rdp-canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bg-main-color);
}

.rdp-canvas-container-full-tab {
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  .close-full-tab-btn {
    cursor: pointer;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 20px;
    background-color: var(--bg-layer-color);
    border-radius: 0 0 var(--border-radius) var(--border-radius);
  }
  .fullscreen-toolbar {
    cursor: pointer;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
    background-color: var(--bg-layer-color);
    border-radius: 0 0 var(--border-radius) var(--border-radius);
    padding: 4px;
    .toolbar-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--border-radius);
      &:hover {
        background-color: var(--bg-main-color);
      }
    }
  }
}

.rdp-canvas {
  display: block;
  outline: none;
  background: var(--bg-layer-color);
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
  background-color: var(--bg-layer-color);
}

.td-connection-item-selected {
  background-color: var(--bg-layer-color);
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
  color: #6e7681;
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
  padding: var(--padding);
}

.td-connection-list-title {
  font-weight: 600;
  font-size: 14px;
}
</style>
