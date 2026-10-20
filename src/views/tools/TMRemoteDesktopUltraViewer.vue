<template>
  <div class="flex container">
    <div class="main-tool">
      <div class="tm-uv-container">
        <TMFullTabWrapper
          v-model="isFullTab"
          :alwaysShowToolbar="true"
          fullScreenBgColor="#000"
          class="tm-uv-wrapper"
        >
          <template #toolbar-left>
            <div
              v-tooltip="$t('i18nCommon.ultraViewer.screenshot')"
              class="flex toolbar-btn"
              :class="{ 'toolbar-btn-disabled': !isConnected }"
              @click="takeScreenshot"
            >
              <span class="tm-icon tm-camera-icon"></span>
            </div>
            <!-- Màn hình của máy đối tác: luôn hiện, chỉ chuyển được khi
                 máy đối tác có nhiều hơn 1 màn hình -->
            <div
              v-tooltip="monitorTooltip"
              class="flex toolbar-btn tm-uv-monitor-btn"
              :class="{ 'toolbar-btn-disabled': monitorCount <= 1 }"
              @click="switchMonitor"
            >
              <span class="tm-icon tm-monitor-icon"></span>
            </div>
            <div
              v-tooltip="
                controlEnabled
                  ? $t('i18nCommon.ultraViewer.disableControl')
                  : $t('i18nCommon.ultraViewer.enableControl')
              "
              class="flex toolbar-btn"
              :class="{ 'toolbar-btn-disabled': !isConnected }"
              @click="toggleControl"
            >
              <span class="tm-icon tm-command-code-icon"></span>
            </div>
          </template>
          <template #toolbar-right>
            <div class="flex" style="margin-left: 16px">
              <div
                v-if="!isConnected && !isConnecting"
                v-tooltip="$t('i18nCommon.ultraViewer.connect')"
                class="flex toolbar-btn"
                @click="handleConnect"
              >
                <span class="tm-icon tm-connect-icon"></span>
              </div>
              <div
                v-else
                v-tooltip="$t('i18nCommon.ultraViewer.disconnect')"
                class="flex toolbar-btn"
                @click="handleDisconnect"
              >
                <span class="tm-icon tm-disconnect-icon"></span>
              </div>
            </div>
          </template>

          <div class="tm-uv-canvas-container">
            <TMDynamicBackgroundEffect
              :class="{ 'tm-uv-hide-effect': isHideEffectBackground }"
            />

            <canvas
              ref="uvCanvas"
              class="tm-uv-canvas"
              :class="{ 'tm-uv-canvas-cursor-none': isConnected && controlEnabled }"
              tabindex="0"
              @keydown="onCanvasKeydown"
              @keyup="onCanvasKeyup"
              @mousemove="onCanvasMousemove"
              @mousedown="onCanvasMousedown"
              @mouseup="onCanvasMouseup"
              @mouseleave="onCanvasMouseleave"
              @wheel.prevent="onCanvasWheel"
              @contextmenu.prevent="onCanvasContextmenu"
            ></canvas>

            <!-- Canvas phủ: con trỏ của máy đối tác (Windows không vẽ con trỏ
                 vào khung hình mà gửi riêng lệnh 3/4/28) -->
            <canvas ref="uvCursorCanvas" class="tm-uv-cursor-canvas"></canvas>

            <!-- Lớp phủ hướng dẫn khi chưa có màn hình từ xa -->
            <div v-if="!isConnected" class="tm-uv-overlay">
              <div class="tm-uv-overlay-card">
                {{
                  isConnecting
                    ? $t("i18nCommon.ultraViewer.statusConnecting")
                    : $t("i18nCommon.ultraViewer.ready")
                }}
              </div>
            </div>

            <!-- Máy đối tác đang bật chế độ chỉ xem -->
            <div v-if="isConnected && isViewOnly" class="tm-uv-banner">
              {{ $t("i18nCommon.ultraViewer.viewOnlyNotice") }}
            </div>
          </div>
        </TMFullTabWrapper>

        <!-- Log panel -->
        <div
          v-if="currentConfigLayout.showLog"
          ref="logPanel"
          class="tm-uv-log-panel"
        >
          <div
            v-for="(entry, idx) in logEntries"
            :key="idx"
            class="tm-uv-log-entry"
            :class="`tm-uv-log-${entry.type}`"
          >
            <span class="tm-uv-log-time">{{ entry.time }}</span
            >{{ entry.message }}
          </div>
        </div>
      </div>
    </div>
    <TMSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="tm-sidebar-menu">
          <TMSlideOption
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
          class="flex flex-col tm-uv-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.RemoteDesktopSidebarOption.Help
          "
        >
          <TMRemoteDesktopUltraViewerHelp />
        </div>
        <!-- Kết nối: ID + mật khẩu của máy đối tác (không lưu lại) -->
        <div
          class="flex flex-col tm-uv-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.RemoteDesktopSidebarOption.Setting
          "
        >
          <div class="flex flex-col tm-uv-setting">
            <div class="flex tm-uv-setting-item">
              <span class="tm-uv-setting-label">
                {{ $t("i18nCommon.ultraViewer.partnerIdShort") }}
              </span>
              <TMInput
                v-model="partnerId"
                class="tm-uv-setting-value"
                :noMargin="true"
                :placeHolder="$t('i18nCommon.ultraViewer.partnerIdPlaceholder')"
                @keyup.enter="handleConnect"
              />
            </div>
            <div class="flex tm-uv-setting-item">
              <span class="tm-uv-setting-label">
                {{ $t("i18nCommon.ultraViewer.passwordShort") }}
              </span>
              <TMInput
                v-model="password"
                class="tm-uv-setting-value"
                :noMargin="true"
                :inputType="'text'"
                :placeHolder="$t('i18nCommon.ultraViewer.passwordPlaceholder')"
                @keyup.enter="handleConnect"
              />
            </div>
            <div class="flex tm-uv-setting-item">
              <span class="tm-uv-setting-label">
                {{ $t("i18nCommon.ultraViewer.displayNameShort") }}
              </span>
              <TMInput
                v-model="displayName"
                class="tm-uv-setting-value"
                :noMargin="true"
                :placeHolder="$t('i18nCommon.ultraViewer.displayNamePlaceholder')"
              />
            </div>

            <TMButton
              class="tm-uv-setting-button"
              :noMargin="true"
              :label="
                isConnected || isConnecting
                  ? $t('i18nCommon.ultraViewer.disconnect')
                  : $t('i18nCommon.ultraViewer.connect')
              "
              @click="isConnected || isConnecting ? handleDisconnect() : handleConnect()"
            />
          </div>

          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.clipboardSync"
            :label="$t('i18nCommon.ultraViewer.clipboardSync')"
            @change="updateClipboardSync"
          ></TMCheckbox>

          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.showLog"
            :label="$t('i18nCommon.ultraViewer.showLog')"
            @change="updateConfigLayout"
          ></TMCheckbox>
        </div>
        <!-- Chat trong phiên: mục riêng trên sidebar -->
        <div
          class="flex flex-col tm-uv-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.RemoteDesktopSidebarOption.Chat
          "
        >
          <div class="tm-uv-chat">
            <div class="tm-uv-chat-header">
              {{ $t("i18nCommon.ultraViewer.chatTitle") }}
            </div>
            <div class="tm-uv-chat-messages">
              <div
                v-for="(entry, idx) in chatMessages"
                :key="idx"
                class="tm-uv-chat-row"
                :class="
                  entry.local ? 'tm-uv-chat-row-local' : 'tm-uv-chat-row-remote'
                "
              >
                <div class="tm-uv-chat-bubble">
                  <div class="tm-uv-chat-text">{{ entry.text }}</div>
                  <div class="tm-uv-chat-time">{{ entry.time }}</div>
                </div>
              </div>
              <div v-if="isPartnerTyping" class="tm-uv-chat-typing">
                {{ $t("i18nCommon.ultraViewer.typing") }}
              </div>
            </div>
            <div class="tm-uv-chat-input">
              <TMInput
                v-model="chatInput"
                :noMargin="true"
                :readOnly="!isConnected"
                :placeHolder="$t('i18nCommon.ultraViewer.chatPlaceholder')"
                @keyup.enter="sendChat"
              />
              <TMButton
                :noMargin="true"
                :readOnly="!isConnected"
                :iconClass="'tm-send-icon'"
                @click="sendChat"
              />
            </div>
          </div>
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>

<script>
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMRemoteDesktopUltraViewerHelp from "@/views/helps/TMRemoteDesktopUltraViewerHelp.vue";
import TMDynamicBackgroundEffect from "@/views/backgroundEffect/TMDynamicBackgroundEffect.vue";
import TMFullTabWrapper from "@/components/TMFullTabWrapper.vue";
import TMButton from "@/components/TMButton.vue";
import TMCheckbox from "@/components/TMCheckbox.vue";
import TMInput from "@/components/TMInput.vue";

// Tên hiển thị gửi cho máy đối tác: sinh tự động 5 ký tự ngẫu nhiên + "-PC".
const DISPLAY_NAME_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * TMRemoteDesktopUltraViewer - xem và điều khiển máy khác đang chạy
 * UltraViewer (Windows).
 *
 * Toàn bộ giao thức UltraViewer nằm trong module WebAssembly
 * (src_wasm/ultraviewer, port từ https://github.com/DeanOpen/MacViewer - MIT).
 * Daemon Go chỉ làm trung gian mở TCP + TLS tới relay rồi chuyển byte qua
 * WebSocket, nên tool chạy được trên mọi nền tảng (Windows/macOS/Linux).
 */
export default {
  name: "TMRemoteDesktopUltraViewer",
  extends: TMToolBase,
  components: {
    TMSubSidebar,
    TMRemoteDesktopUltraViewerHelp,
    TMDynamicBackgroundEffect,
    TMFullTabWrapper,
    TMButton,
    TMCheckbox,
    TMInput,
  },

  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.UltraViewerConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tmEnum.RemoteDesktopSidebarOption.Help,
        showLog: false,
        clipboardSync: false,
      },
      isHideEffectBackground: false,
      isFullTab: false,
      isConnected: false,
      isConnecting: false,
      isViewOnly: false,
      controlEnabled: true,
      // Số màn hình của máy đối tác (0 = không rõ) và màn hình đang chọn.
      monitorCount: 0,
      selectedMonitor: 0,
      // Gốc toạ độ của vùng đang xem (khi chỉ xem 1 màn hình).
      viewOffsetX: 0,
      viewOffsetY: 0,
      // Thông tin đăng nhập của máy đối tác + danh tính viewer (lưu trong cache).
      partnerId: "",
      password: "",
      displayName: "",
      deviceIdentity: "",
      chatInput: "",
      chatMessages: [],
      isPartnerTyping: false,
      logEntries: [],
      // Module WASM đã nạp
      wasmModule: null,
      client: null,
    };
  },

  computed: {
    /**
     * Tên màn hình đang hiển thị ("Tất cả" khi xem toàn bộ desktop ảo).
     */
    monitorName() {
      if (this.selectedMonitor === 0) {
        return this.$t("i18nCommon.ultraViewer.allMonitors");
      }
      return this.$t("i18nCommon.ultraViewer.monitorIndex", {
        index: this.selectedMonitor,
      });
    },
    /**
     * Tooltip: số màn hình của máy đối tác + màn hình đang xem.
     */
    monitorTooltip() {
      if (this.monitorCount <= 1) {
        return this.$t("i18nCommon.ultraViewer.singleMonitor");
      }
      return this.$t("i18nCommon.ultraViewer.monitorTooltip", {
        count: this.monitorCount,
        monitor: this.monitorName,
      });
    },
    sidebarOptions() {
      let options = [];
      options.push({
        value: this.$tmEnum.RemoteDesktopSidebarOption.Help,
        label: this.$t("i18nCommon.ultraViewer.sidebarOption.help"),
        icon: "tm-help-icon",
      });
      options.push({
        value: this.$tmEnum.RemoteDesktopSidebarOption.Setting,
        label: this.$t("i18nCommon.ultraViewer.sidebarOption.connection"),
        icon: "tm-setting-icon",
      });
      options.push({
        value: this.$tmEnum.RemoteDesktopSidebarOption.Chat,
        label: this.$t("i18nCommon.ultraViewer.sidebarOption.chat"),
        icon: "tm-chat-icon",
      });
      return options;
    },
  },

  async mounted() {
    // Nạp profile đã lưu: danh tính thiết bị, tên hiển thị, ID + mật khẩu
    // máy đối tác.
    const profile = await this.$tmCache.get(
      this.$tmEnum.cacheConfig.UltraViewerProfile,
    );
    if (profile) {
      this.partnerId = profile.partnerId || "";
      this.password = profile.password || "";
      this.displayName = profile.displayName || "";
      this.deviceIdentity = profile.deviceIdentity || "";
    }
    // Chưa có tên hiển thị thì sinh tự động (5 ký tự ngẫu nhiên + "-PC").
    if (!this.displayName) {
      this.displayName = this.randomName() + "-PC";
    }
    // Chưa có danh tính thiết bị thì sinh mới (relay cấp ID theo MAC).
    if (!this.deviceIdentity) {
      this.deviceIdentity = this.randomHex(16);
    }
  },

  beforeUnmount() {
    this.handleDisconnect();
  },

  methods: {
    /**
     * Báo lỗi cho người dùng: ghi log + toast + tự bật khung log (mặc định
     * khung log đang tắt nên lỗi sẽ bị bỏ qua).
     */
    reportError(message) {
      let me = this;
      me.addLog(message, "error");
      me.$tmToast.error(message);
      if (!me.currentConfigLayout.showLog) {
        me.currentConfigLayout.showLog = true;
        me.updateConfigLayout();
      }
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

    /**
     * Lưu toàn bộ profile viewer vào cache chuẩn của app:
     * danh tính thiết bị (relay cấp ID theo MAC nên phải giữ nguyên giữa các
     * phiên), tên hiển thị gửi máy đối tác, và ID + mật khẩu máy đối tác.
     */
    async saveProfile() {
      let me = this;
      await me.$tmCache.set(me.$tmEnum.cacheConfig.UltraViewerProfile, {
        deviceIdentity: me.deviceIdentity,
        displayName: me.displayName,
        partnerId: me.partnerId.trim(),
        password: me.password,
      });
    },

    randomName() {
      const bytes = new Uint8Array(5);
      crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => DISPLAY_NAME_ALPHABET[b % DISPLAY_NAME_ALPHABET.length])
        .join("");
    },

    randomHex(byteCount) {
      const bytes = new Uint8Array(byteCount);
      crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    },

    /**
     * URL WebSocket tới daemon (daemon làm trung gian TCP + TLS tới relay).
     */
    getRelayWebSocketUrl() {
      const agentUrl = window.__tmAPI?.automation?.agentURL || "";
      if (!agentUrl) {
        throw new Error(this.$t("i18nCommon.ultraViewer.agentNotAvailable"));
      }
      return (
        agentUrl.replace(/^http/, "ws").replace(/\/$/, "") + "/ultraviewer/ws"
      );
    },

    async handleConnect() {
      let me = this;
      if (me.isConnected || me.isConnecting) return;

      // ID trên cửa sổ UltraViewer hiển thị dạng "211 782 391" — bỏ khoảng
      // trắng và dấu gạch ngang trước khi kiểm tra.
      const id = me.partnerId.replace(/[\s-]/g, "");
      if (!id || !/^\d{1,64}$/.test(id)) {
        me.reportError(me.$t("i18nCommon.ultraViewer.partnerIdRequired"));
        return;
      }
      if (!me.password) {
        me.reportError(me.$t("i18nCommon.ultraViewer.passwordRequired"));
        return;
      }

      me.isConnecting = true;
      try {
        if (!me.wasmModule) {
          me.addLog(me.$t("i18nCommon.ultraViewer.loadingWasm"), "info");
          // Giống RDP: luôn nạp từ assets-wasm-<version>/ultraviewer. Khi build,
          // vite.config.js copy folder src_wasm/pkg/ultraviewer sang đó.
          // Dùng biến chuỗi để Vite không bundle/không quét file wasm này.
          const uvPath = `/assets-wasm-${import.meta.env.PACKAGE_VERSION}/ultraviewer/ultraviewer_client.js`;
          const wasmModule = await import(/* @vite-ignore */ uvPath);
          await wasmModule.default();
          me.wasmModule = wasmModule;
          me.addLog(me.$t("i18nCommon.ultraViewer.wasmReady"), "success");
        }

        const client = new me.wasmModule.UltraViewerClient();
        me.client = client;

        client.on_status((message) => {
          me.addLog(message, "info");
        });
        client.on_connected((width, height) => {
          me.isConnected = true;
          me.isConnecting = false;
          me.isHideEffectBackground = true;
          me.monitorCount = client.monitor_count();
          me.selectedMonitor = 0;
          me.updateViewOffset();
          // Lưu profile (ID + mật khẩu + tên + danh tính) để lần sau khỏi nhập.
          me.saveProfile();
          if (client.is_direct_route()) {
            me.addLog(me.$t("i18nCommon.ultraViewer.connectedDirect"), "success");
          }
          me.addLog(
            `${me.$t("i18nCommon.ultraViewer.connected")} ${width}x${height}`,
            "success",
          );
          const canvas = me.$refs.uvCanvas;
          if (canvas) canvas.focus();
        });
        client.on_view_only((viewOnly) => {
          me.isViewOnly = viewOnly;
          if (viewOnly) {
            me.controlEnabled = false;
            me.addLog(me.$t("i18nCommon.ultraViewer.viewOnlyNotice"), "warn");
          }
        });
        client.on_chat((text) => {
          me.pushChat(text, false);
        });
        client.on_typing((typing) => {
          me.isPartnerTyping = typing;
        });
        client.on_clipboard((text) => {
          me.addLog(
            `${me.$t("i18nCommon.ultraViewer.clipboardReceived")} ${text}`,
            "info",
          );
          try {
            me.$tmUtility.copyToClipboard(text, false);
          } catch (e) {
            // Không copy được clipboard thì chỉ ghi log.
          }
        });
        client.on_closed((message) => {
          me.isConnected = false;
          me.isConnecting = false;
          me.isHideEffectBackground = false;
          me.isViewOnly = false;
          me.client = null;
          me.addLog(
            `${me.$t("i18nCommon.ultraViewer.sessionEnded")}: ${message}`,
            "warn",
          );
        });

        const canvas = me.$refs.uvCanvas;
        if (canvas) {
          client.attach_canvas(canvas);
        }
        const cursorCanvas = me.$refs.uvCursorCanvas;
        if (cursorCanvas) {
          client.attach_cursor_canvas(cursorCanvas);
        }

        me.addLog(
          `${me.$t("i18nCommon.ultraViewer.connecting")} ${id}`,
          "info",
        );
        client.connect(
          me.getRelayWebSocketUrl(),
          id,
          me.password,
          me.displayName || "DevTools",
          me.deviceIdentity,
          "",
          -new Date().getTimezoneOffset(),
          window.screen?.width || 1920,
          window.screen?.height || 1080,
        );
      } catch (e) {
        me.isConnecting = false;
        me.reportError(
          `${me.$t("i18nCommon.ultraViewer.connectionFailed")}: ${me.formatError(e)}`,
        );
      }
    },

    handleDisconnect() {
      let me = this;
      if (me.client) {
        try {
          me.client.release_input();
          me.client.disconnect();
        } catch (e) {
          me.addLog(
            `${me.$t("i18nCommon.ultraViewer.disconnectError")}: ${me.formatError(e)}`,
            "warn",
          );
        }
      }
      me.client = null;
      me.isConnected = false;
      me.isConnecting = false;
      me.isHideEffectBackground = false;
      me.isViewOnly = false;
      me.isPartnerTyping = false;
    },

    /**
     * Bấm nút trên thanh công cụ để chuyển qua lại giữa các màn hình.
     */
    switchMonitor() {
      let me = this;
      if (!me.client || me.monitorCount <= 1) return;
      // 0 = xem tất cả, 1..n = từng màn hình → có monitorCount + 1 lựa chọn.
      const next = (me.selectedMonitor + 1) % (me.monitorCount + 1);
      me.client.select_monitor(next);
      // Đọc lại từ module: nếu máy đối tác không có màn hình đó thì module
      // tự quay về "tất cả".
      me.selectedMonitor = me.client.selected_monitor();
      me.updateViewOffset();
      me.addLog(
        me.$t("i18nCommon.ultraViewer.monitorSwitched", {
          monitor: me.monitorName,
        }),
        "info",
      );
    },

    /**
     * Lấy gốc toạ độ của vùng đang xem để cộng vào toạ độ chuột gửi đi.
     */
    updateViewOffset() {
      let me = this;
      if (!me.client) {
        me.viewOffsetX = 0;
        me.viewOffsetY = 0;
        return;
      }
      const offset = me.client.view_offset();
      me.viewOffsetX = offset[0] || 0;
      me.viewOffsetY = offset[1] || 0;
    },

    toggleControl() {
      let me = this;
      if (!me.isConnected) return;
      me.controlEnabled = !me.controlEnabled;
      if (me.client) {
        me.client.set_control_enabled(me.controlEnabled);
      }
      me.addLog(
        me.controlEnabled
          ? me.$t("i18nCommon.ultraViewer.controlEnabled")
          : me.$t("i18nCommon.ultraViewer.controlDisabled"),
        "info",
      );
    },

    updateClipboardSync() {
      if (this.client) {
        this.client.set_clipboard_sharing(this.currentConfigLayout.clipboardSync);
      }
      this.updateConfigLayout();
    },

    pushChat(text, local) {
      this.chatMessages.push({
        text,
        local,
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      });
      if (this.chatMessages.length > 200) {
        this.chatMessages.splice(0, this.chatMessages.length - 200);
      }
    },

    sendChat() {
      let me = this;
      const text = me.chatInput.trim();
      if (!text || !me.client) return;
      try {
        me.client.send_chat(text);
        me.pushChat(text, true);
        me.chatInput = "";
      } catch (e) {
        me.addLog(
          `${me.$t("i18nCommon.ultraViewer.chatFailed")}: ${me.formatError(e)}`,
          "error",
        );
      }
    },

    takeScreenshot() {
      let me = this;
      const canvas = me.$refs.uvCanvas;
      if (!canvas || !me.isConnected) return;
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `ultraviewer-screenshot-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        me.addLog(me.$t("i18nCommon.ultraViewer.screenshotSaved"), "success");
      } catch (e) {
        me.addLog(
          `${me.$t("i18nCommon.ultraViewer.screenshotFailed")}: ${me.formatError(e)}`,
          "error",
        );
      }
    },

    formatError(e) {
      return e?.message || e?.toString() || String(e);
    },

    // ─────────────────────── Nhập liệu chuột / bàn phím ───────────────────────

    /**
     * Đổi toạ độ chuột trên canvas (CSS pixel) sang toạ độ màn hình từ xa.
     */
    toRemotePoint(e) {
      const canvas = this.$refs.uvCanvas;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width ? canvas.width / rect.width : 1;
      const scaleY = rect.height ? canvas.height / rect.height : 1;
      // Cộng gốc của vùng đang xem: máy đối tác luôn dùng toạ độ trên
      // desktop ảo, không phải toạ độ trong màn hình đang chọn.
      return {
        x: Math.round((e.clientX - rect.left) * scaleX) + this.viewOffsetX,
        y: Math.round((e.clientY - rect.top) * scaleY) + this.viewOffsetY,
      };
    },

    onCanvasMousemove(e) {
      if (!this.client || !this.isConnected || !this.controlEnabled) return;
      const { x, y } = this.toRemotePoint(e);
      this.client.pointer_move(x, y);
    },

    onCanvasMousedown(e) {
      if (!this.client || !this.isConnected || !this.controlEnabled) return;
      e.preventDefault();
      this.$refs.uvCanvas?.focus();
      const { x, y } = this.toRemotePoint(e);
      this.client.pointer_button(e.button, true, x, y);
    },

    onCanvasMouseup(e) {
      if (!this.client || !this.isConnected || !this.controlEnabled) return;
      e.preventDefault();
      const { x, y } = this.toRemotePoint(e);
      this.client.pointer_button(e.button, false, x, y);
    },

    onCanvasMouseleave() {
      // Nhả toàn bộ phím khi rời khỏi vùng màn hình.
      if (this.client && this.isConnected) {
        this.client.release_input();
      }
    },

    onCanvasWheel(e) {
      if (!this.client || !this.isConnected || !this.controlEnabled) return;
      e.preventDefault();
      // 1 bước lăn chuột = 120 đơn vị, giống cách UltraViewer quy đổi.
      const lines = -e.deltaY / 120;
      this.client.wheel(lines);
    },

    onCanvasKeydown(e) {
      if (!this.client || !this.isConnected || !this.controlEnabled) return;
      e.preventDefault();
      e.stopPropagation();

      // Ctrl+V / Cmd+V: đồng bộ clipboard sang máy đối tác trước khi gõ.
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyV") {
        this.syncClipboardToRemoteAndPaste();
        return;
      }
      this.client.key(e.code, true, e.key?.length === 1 ? e.key : null);
      this.sendModifiers(e);
    },

    onCanvasKeyup(e) {
      if (!this.client || !this.isConnected || !this.controlEnabled) return;
      e.preventDefault();
      e.stopPropagation();
      this.client.key(e.code, false, null);
      this.sendModifiers(e);
    },

    onCanvasContextmenu(e) {
      e.preventDefault();
    },

    sendModifiers(e) {
      this.client?.modifiers(
        e.shiftKey,
        e.ctrlKey,
        e.altKey,
        e.metaKey,
        e.getModifierState?.("CapsLock") ?? false,
      );
    },

    async syncClipboardToRemoteAndPaste() {
      let me = this;
      try {
        const text = await navigator.clipboard.readText();
        if (text && me.client) {
          me.client.send_clipboard(text);
        }
      } catch (err) {
        me.addLog(
          `${me.$t("i18nCommon.ultraViewer.clipboardReadFailed")}: ${me.formatError(err)}`,
          "warn",
        );
      }
      // Vẫn gửi phím V để máy đối tác dán nội dung vừa đồng bộ.
      if (me.client) {
        me.client.key("KeyV", true, null);
        me.client.key("KeyV", false, null);
      }
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

.tm-uv-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-main-color);
  overflow: hidden;
}

.tm-uv-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.tm-uv-canvas-container {
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.tm-uv-canvas {
  display: block;
  outline: none;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.tm-uv-canvas-cursor-none {
  cursor: none;
}

/* Canvas phủ vẽ con trỏ của máy đối tác. Vị trí/kích thước được module WASM
   đặt lại theo khung thực tế của canvas màn hình (canvas màn hình được canh
   giữa nên không thể dùng top/left cố định). */
.tm-uv-cursor-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

/* Ẩn hiệu ứng nền động khi đã có màn hình từ xa */
.tm-uv-hide-effect {
  display: none;
}

/* Trạng thái đang bật của một nút trên thanh công cụ */
.tm-uv-btn-active {
  background-color: var(--focus-color);
  color: var(--selected-item-text-color);
}

.tm-uv-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.tm-uv-overlay-card {
  padding: 20px 28px;
  border-radius: var(--border-radius);
  background: var(--bg-layer-color);
  text-align: center;
  font-size: var(--font-size-medium-rare);
  line-height: 1.6;
}

.tm-uv-banner {
  position: absolute;
  top: var(--padding);
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 14px;
  border-radius: var(--border-radius);
  background: var(--bg-layer-color);
  font-size: var(--font-size-small);
}

.tm-uv-log-panel {
  background: var(--bg-layer-color);
  border-radius: var(--border-radius);
  max-height: 140px;
  height: 140px;
  overflow-y: auto;
  padding: 6px 12px;
  line-height: 1.6;
  flex-shrink: 0;
}

.tm-uv-log-entry {
  white-space: pre-wrap;
  word-break: break-all;
}

.tm-uv-log-time {
  margin-right: var(--padding);
}

.tm-uv-log-error {
  color: var(--text-error-color);
}

.tm-uv-log-warn {
  color: var(--focus-color);
}

.tm-uv-log-success {
  color: var(--text-primary-color);
}

.tm-uv-sub-sidebar {
  height: 100%;
  justify-content: flex-start;
  width: 100%;
  overflow: auto;
  /* Utility `.flex` đặt align-items:center → trong flex cột, khối con bị co
     theo nội dung. Kéo giãn hết chiều ngang để lấp đúng bề rộng sidebar. */
  align-items: stretch;
}

.tm-uv-setting {
  width: 100%;
  gap: var(--padding);
  justify-content: flex-start;
  align-items: stretch;

  .tm-uv-setting-item {
    justify-content: space-between;
    align-items: center;
    gap: var(--padding);
    width: 100%;
    box-sizing: border-box;

    .tm-uv-setting-label {
      flex: 1;
    }

    /* Ô input cố định bề rộng → các dòng thẳng hàng nhau */
    :deep(.tm-uv-setting-value) {
      width: 140px;
    }
  }

  /* Nút kết nối rộng hết để dễ bấm */
  :deep(.tm-uv-setting-button) {
    width: 100%;
  }
}

/* Chat nằm trong sidebar nên không cần nền/viền riêng — chỉ bố cục và
   khoảng cách theo chuẩn padding của app. */
.tm-uv-chat {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 200px;
  min-width: 0;
  overflow: hidden;
  flex: 1;
}

.tm-uv-chat-header {
  padding: var(--padding);
  font-size: var(--font-size-small);
  font-weight: 600;
}

.tm-uv-chat-messages {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 0 var(--padding);
  display: flex;
  flex-direction: column;
  gap: var(--padding-medium);
}

/* Tin của mình bên phải, tin của máy đối tác bên trái */
.tm-uv-chat-row {
  display: flex;
}

.tm-uv-chat-row-local {
  justify-content: flex-end;
}

.tm-uv-chat-row-remote {
  justify-content: flex-start;
}

.tm-uv-chat-bubble {
  max-width: 85%;
  padding: var(--padding-medium) var(--padding-x-medium);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  font-size: var(--font-size-small);
  line-height: 1.5;
}

/* Tin của mình viền màu nhấn, tin máy đối tác viền màu trung tính */
.tm-uv-chat-row-local .tm-uv-chat-bubble {
  border-color: var(--focus-color);
  color: var(--focus-color);
}

.tm-uv-chat-row-remote .tm-uv-chat-bubble {
  border-color: var(--text-secondary-color);
  color: var(--text-primary-color);
}

.tm-uv-chat-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.tm-uv-chat-time {
  margin-top: var(--padding-medium);
  font-size: var(--font-size-small);
  opacity: 0.5;
  text-align: right;
}

.tm-uv-chat-typing {
  font-size: var(--font-size-small);
  opacity: 0.6;
  font-style: italic;
}

.tm-uv-chat-input {
  display: flex;
  align-items: center;
  gap: var(--padding);
  padding: var(--padding);
  min-width: 0;

  /* Ô nhập co giãn theo sidebar, nút gửi giữ nguyên kích thước */
  :deep(.tm-input) {
    flex: 1;
    min-width: 0;
  }

  :deep(.tm-button) {
    flex-shrink: 0;
  }
}
</style>
