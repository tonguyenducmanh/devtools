<template>
  <div class="flex container">
    <div class="main-tool">
      <div class="rdp-container">
        <!-- Toolbar -->
        <div class="rdp-toolbar">
          <div class="rdp-actions">
            <button
              class="rdp-btn rdp-btn-connect"
              :disabled="isConnected || isConnecting"
              @click="handleConnect"
            >
              {{ $t("i18nCommon.remoteDesktop.connect") }}
            </button>
            <button
              class="rdp-btn rdp-btn-disconnect"
              :disabled="!isConnected"
              @click="handleDisconnect"
            >
              {{ $t("i18nCommon.remoteDesktop.disconnect") }}
            </button>
            <button
              class="rdp-btn rdp-btn-fullscreen"
              @click="toggleFullscreen"
            >
              {{ $t("i18nCommon.remoteDesktop.fullscreen") }}
            </button>
            <button
              class="rdp-btn rdp-btn-screenshot"
              @click="takeScreenshot"
            >
              {{ $t("i18nCommon.remoteDesktop.screenshot") }}
            </button>
            <span class="rdp-status" :class="statusClass">{{
              statusText
            }}</span>
          </div>
        </div>

        <!-- Canvas area -->
        <div ref="canvasContainer" class="rdp-canvas-container">
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
                  @click.stop="confirmDeleteConnection(conn)"
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
            v-model="currentConfigLayout.autoReconnect"
            :label="$t('i18nCommon.remoteDesktop.autoReconnect')"
            @change="updateConfigLayout"
          ></TDCheckbox>
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
            width="100%"
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
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";

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
        autoReconnect: false,
        showLog: false,
        resolution: "1280x720",
      },
      host: "",
      username: "",
      password: "",
      isConnected: false,
      isConnecting: false,
      session: null,
      wasmInitialized: false,
      canvasWidth: 1280,
      canvasHeight: 720,
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
    statusText() {
      if (this.isConnecting)
        return this.$t("i18nCommon.remoteDesktop.statusConnecting");
      if (this.isConnected)
        return this.$t("i18nCommon.remoteDesktop.statusConnected");
      return this.$t("i18nCommon.remoteDesktop.statusDisconnected");
    },
    statusClass() {
      if (this.isConnecting) return "rdp-status-connecting";
      if (this.isConnected) return "rdp-status-connected";
      return "rdp-status-disconnected";
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

    confirmDeleteConnection(conn) {
      let me = this;
      TDDialogUtil.showConfirm({
        title: me.$t("i18nCommon.remoteDesktop.deleteConnection"),
        message: `${me.$t("i18nCommon.remoteDesktop.deleteConnection")} "${conn.connection_name}"?`,
        onConfirm: async () => {
          await me.deleteConnectionById(conn.id);
        },
      });
    },

    async deleteConnection() {
      let me = this;
      if (!me.currentConnectionId) return;
      await me.deleteConnectionById(me.currentConnectionId);
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

        const agentUrl = window.__tdInfo?.agentURL || "http://localhost:7777";
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

    toggleFullscreen() {
      const container = this.$refs.canvasContainer;
      if (!container) return;
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
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
      this.addLog(this.$t("i18nCommon.remoteDesktop.screenshotSaved"), "success");
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
      try {
        const { DeviceEvent, InputTransaction } = this._wasm;
        const event = DeviceEvent.keyPressed(scancode);
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
  background: #0d1117;
  color: #e0e0e0;
  font-family:
    "Segoe UI",
    system-ui,
    -apple-system,
    sans-serif;
  overflow: hidden;
}

.rdp-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #161b22;
  border-bottom: 1px solid #30363d;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.rdp-title {
  font-size: 14px;
  font-weight: 700;
  color: #58a6ff;
  white-space: nowrap;
  margin-right: 6px;
}

.rdp-fields {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.rdp-input {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #30363d;
  background: #0d1117;
  color: #e0e0e0;
  font-size: 13px;
  width: 160px;
  transition: border-color 0.2s;
}

.rdp-input:focus {
  outline: none;
  border-color: #58a6ff;
}

.rdp-input::placeholder {
  color: #6e7681;
}

.rdp-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;
}

.rdp-btn {
  padding: 5px 14px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.1s;
}

.rdp-btn:active {
  transform: scale(0.97);
}

.rdp-btn:disabled {
  background: #30363d !important;
  color: #6e7681 !important;
  cursor: not-allowed;
}

.rdp-btn-connect {
  background: #238636;
  color: #fff;
}

.rdp-btn-connect:not(:disabled):hover {
  background: #2ea043;
}

.rdp-btn-disconnect {
  background: #da3633;
  color: #fff;
}

.rdp-btn-disconnect:not(:disabled):hover {
  background: #f85149;
}

.rdp-btn-fullscreen {
  background: transparent;
  color: #8b949e;
  border: 1px solid #30363d;
  font-size: 15px;
  padding: 4px 9px;
}

.rdp-btn-fullscreen:hover {
  background: #30363d;
  color: #e0e0e0;
}

.rdp-btn-screenshot {
  background: transparent;
  color: #8b949e;
  border: 1px solid #30363d;
  font-size: 13px;
  padding: 4px 12px;
}

.rdp-btn-screenshot:hover {
  background: #30363d;
  color: #e0e0e0;
}

.rdp-status {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.rdp-status-disconnected {
  background: #3d1a1a;
  color: #f85149;
}

.rdp-status-connecting {
  background: #3a3200;
  color: #e3b341;
}

.rdp-status-connected {
  background: #1a3a1a;
  color: #3fb950;
}

.rdp-canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000;
}

.rdp-canvas {
  display: block;
  background: #000;
  outline: none;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.rdp-log-panel {
  background: #0d1117;
  border-top: 1px solid #21262d;
  max-height: 140px;
  overflow-y: auto;
  padding: 6px 12px;
  font-family: "JetBrains Mono", "Fira Code", "Courier New", monospace;
  font-size: 11px;
  line-height: 1.6;
  flex-shrink: 0;
}

.rdp-log-entry {
  white-space: pre-wrap;
  word-break: break-all;
}

.rdp-log-time {
  color: #444d56;
  margin-right: 6px;
}

.rdp-log-info {
  color: #8b949e;
}

.rdp-log-success {
  color: #3fb950;
}

.rdp-log-error {
  color: #f85149;
}

.rdp-log-warn {
  color: #e3b341;
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
  border-bottom: 1px solid var(--border-color);
}

.td-connection-list-title {
  font-weight: 600;
  font-size: 14px;
}
</style>
