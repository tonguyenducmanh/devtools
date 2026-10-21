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
            <!-- Chat: mở popup nổi (không che màn hình) để vẫn xem/thao tác
                 màn hình từ xa được trong lúc chat. Ở chế độ fullscreen thì
                 sidebar bị ẩn nên cần nút này trên thanh công cụ. -->
            <div
              v-tooltip="$t('i18nCommon.ultraViewer.chatTitle')"
              class="flex toolbar-btn"
              :class="{ 'toolbar-btn-active': isChatPopupOpen }"
              @click="toggleChatPopup"
            >
              <span class="tm-icon tm-chat-icon"></span>
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
              :class="{
                'tm-uv-canvas-cursor-none':
                  isConnected &&
                  controlEnabled &&
                  !currentConfigLayout.showLocalCursor,
              }"
              :width="canvasWidth"
              :height="canvasHeight"
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

            <!-- Canvas phủ vẽ con trỏ máy đối tác (chỉ dùng khi tắt con trỏ mượt hoặc ở chế độ chỉ xem) -->
            <canvas
              v-if="!currentConfigLayout.showLocalCursor || isViewOnly"
              ref="uvCursorCanvas"
              class="tm-uv-cursor-canvas"
              :width="canvasWidth"
              :height="canvasHeight"
            ></canvas>

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
                :placeHolder="
                  $t('i18nCommon.ultraViewer.displayNamePlaceholder')
                "
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
              @click="
                isConnected || isConnecting
                  ? handleDisconnect()
                  : handleConnect()
              "
            />
          </div>

          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.clipboardSync"
            :label="$t('i18nCommon.ultraViewer.clipboardSync')"
            @change="updateClipboardSync"
          ></TMCheckbox>

          <!-- Đường LAN trực tiếp: chỉ dùng được khi 2 máy cùng mạng LAN.
               Bật thì viewer mở listener LAN và quảng bá địa chỉ trong lệnh
               tra cứu để máy đối tác kết nối thẳng (bỏ qua relay → độ trễ
               thấp hơn, nội dung màn hình không rời LAN). -->
          <TMCheckbox
            v-tooltip="allowDirectTooltip"
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.allowDirect"
            :label="$t('i18nCommon.ultraViewer.allowDirect')"
            @change="updateAllowDirect"
          ></TMCheckbox>

          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.showLocalCursor"
            :label="$t('i18nCommon.ultraViewer.showLocalCursor')"
            @change="updateConfigLayout"
          ></TMCheckbox>

          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.showLog"
            :label="$t('i18nCommon.ultraViewer.showLog')"
            @change="updateConfigLayout"
          ></TMCheckbox>
        </div>
        <!-- Chat trong phiên: mục riêng trên sidebar (dùng chung khung chat
             với popup nổi mở từ nút chat trên thanh công cụ) -->
        <div
          class="flex flex-col tm-uv-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.RemoteDesktopSidebarOption.Chat
          "
        >
          <TMUltraViewerChatBox
            :messages="chatState.messages"
            :isTyping="chatState.isTyping"
            :readOnly="!isConnected"
            :placeHolder="$t('i18nCommon.ultraViewer.chatPlaceholder')"
            :typingText="$t('i18nCommon.ultraViewer.typing')"
            :title="$t('i18nCommon.ultraViewer.chatTitle')"
            @send="sendChat"
          />
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>

<script>
import { reactive } from "vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMRemoteDesktopUltraViewerHelp from "@/views/helps/TMRemoteDesktopUltraViewerHelp.vue";
import TMDynamicBackgroundEffect from "@/views/backgroundEffect/TMDynamicBackgroundEffect.vue";
import TMFullTabWrapper from "@/components/TMFullTabWrapper.vue";
import TMButton from "@/components/TMButton.vue";
import TMCheckbox from "@/components/TMCheckbox.vue";
import TMInput from "@/components/TMInput.vue";
import TMUltraViewerChatBox from "@/views/dialogs/ultraviewer/TMUltraViewerChatBox.vue";
import TMDialogUtil, { TMDialogEnum } from "@/common/TMDialogUtil.js";

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
    TMUltraViewerChatBox,
  },

  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.UltraViewerConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tmEnum.RemoteDesktopSidebarOption.Help,
        showLog: false,
        clipboardSync: false,
        // Cho phép dùng đường LAN trực tiếp khi 2 máy cùng mạng.
        allowDirect: false,
        // Hiển thị con trỏ máy tính (mượt, 60-144fps không trễ như IronRDP).
        showLocalCursor: false,
      },
      isHideEffectBackground: false,
      isFullTab: false,
      isConnected: false,
      isConnecting: false,
      isViewOnly: false,
      controlEnabled: true,
      // Đang chạy trên đường LAN trực tiếp (true) hay qua relay (false).
      isDirectRoute: false,
      // Số màn hình của máy đối tác (0 = không rõ) và màn hình đang chọn.
      monitorCount: 0,
      selectedMonitor: 0,
      // Kích thước canvas màn hình (giống IronRDP để khớp tỷ lệ và chống tràn)
      canvasWidth: 1920,
      canvasHeight: 1080,
      // Gốc toạ độ của vùng đang xem (khi chỉ xem 1 màn hình).
      viewOffsetX: 0,
      viewOffsetY: 0,
      // Thông tin đăng nhập của máy đối tác + danh tính viewer (lưu trong cache).
      partnerId: "",
      password: "",
      displayName: "",
      deviceIdentity: "",
      // ID máy đối tác của phiên hiện tại (để nhận biết kết nối mới khác ID).
      lastConnectedId: "",
      // Dữ liệu chat dùng chung giữa khung chat trong sidebar và popup nổi.
      // Dùng object reactive để popup (app Vue riêng) nhìn thấy tin nhắn mới
      // ngay khi đang mở.
      chatState: reactive({
        messages: [],
        isTyping: false,
        // Chặn nhập khi chưa kết nối (đồng bộ qua watch isConnected).
        readOnly: true,
      }),
      // Id của popup chat đang mở (null = đã đóng).
      chatPopupId: null,
      logEntries: [],
      // Module WASM đã nạp
      wasmModule: null,
      client: null,
    };
  },

  watch: {
    /**
     * Đồng bộ trạng thái "chưa kết nối" sang khung chat dùng chung để popup
     * nổi cũng chặn nhập đúng lúc.
     */
    isConnected(value) {
      this.chatState.readOnly = !value;
    },
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
    /**
     * Đường đang dùng cho màn hình: LAN trực tiếp hay qua relay.
     */
    directRouteText() {
      if (this.isDirectRoute) {
        return this.$t("i18nCommon.ultraViewer.routeDirect");
      }
      return this.$t("i18nCommon.ultraViewer.routeRelay");
    },
    /**
     * Tooltip của tuỳ chọn kết nối LAN trực tiếp: giải thích + đường đang
     * dùng (nếu đã kết nối).
     */
    allowDirectTooltip() {
      let me = this;
      let text = me.$t("i18nCommon.ultraViewer.allowDirectHint");
      if (me.isConnected) {
        text += " " + me.directRouteText;
      }
      return text;
    },
    /**
     * Popup chat nổi đang mở hay không (để tô đậm nút chat).
     */
    isChatPopupOpen() {
      return !!this.chatPopupId;
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

      // Kết nối tới ID khác thì xoá tin nhắn chat và log cũ.
      if (id !== me.lastConnectedId) {
        me.chatState.messages.splice(0, me.chatState.messages.length);
        me.chatState.isTyping = false;
        me.logEntries.splice(0, me.logEntries.length);
      }
      me.lastConnectedId = id;

      me.isConnecting = true;
      try {
        // Ngắt phiên cũ (nếu có) trước khi tạo client mới: client cũ giữ
        // timer 16ms trong WASM, nếu không ngắt thì timer vẫn chạy vô ích.
        if (me.client) {
          try {
            me.client.release_input();
            me.client.disconnect();
          } catch (e) {
            // Client cũ đã hỏng rồi → bỏ qua.
          }
          me.client = null;
        }
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
          // Đường truyền có thể đổi (qua relay → LAN trực tiếp) trong phiên.
          me.isDirectRoute = client.is_direct_route();
          me.addLog(message, "info");
        });
        client.on_connected((width, height) => {
          me.isConnected = true;
          me.isConnecting = false;
          me.isHideEffectBackground = true;
          me.monitorCount = client.monitor_count();
          me.selectedMonitor = 0;
          me.canvasWidth = width;
          me.canvasHeight = height;
          me.updateViewOffset();
          // Lưu profile (ID + mật khẩu + tên + danh tính) để lần sau khỏi nhập.
          me.saveProfile();
          me.isDirectRoute = client.is_direct_route();
          if (me.isDirectRoute) {
            me.addLog(
              me.$t("i18nCommon.ultraViewer.connectedDirect"),
              "success",
            );
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
          me.chatState.isTyping = typing;
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
          me.isDirectRoute = false;
          me.client = null;
          // Ngắt client để dừng timer 16ms bên trong WASM (nếu không timer
          // vẫn chạy mãi dù phiên đã kết thúc).
          try {
            client.disconnect();
          } catch (e) {
            // Client đã hỏng → bỏ qua.
          }
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
          me.currentConfigLayout.allowDirect,
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
      me.chatState.isTyping = false;
      me.isDirectRoute = false;
    },

    /**
     * Bật/tắt đường LAN trực tiếp.
     *
     * Tắt: đóng listener LAN ngay và quay về đường relay. Bật: chỉ có tác
     * dụng ở lần kết nối tiếp theo (lệnh tra cứu đã gửi rồi) nên cần bấm
     * "Kết nối" lại.
     */
    updateAllowDirect() {
      let me = this;
      me.updateConfigLayout();
      if (!me.client) return;
      try {
        me.client.set_allow_direct(me.currentConfigLayout.allowDirect);
        me.addLog(
          me.currentConfigLayout.allowDirect
            ? me.$t("i18nCommon.ultraViewer.directEnabled")
            : me.$t("i18nCommon.ultraViewer.directDisabled"),
          "info",
        );
      } catch (e) {
        me.addLog(
          `${me.$t("i18nCommon.ultraViewer.directToggleFailed")}: ${me.formatError(e)}`,
          "warn",
        );
      }
    },

    /**
     * Mở/đóng popup chat nổi (không có nền che màn hình).
     *
     * Popup dùng chung dữ liệu chat với sidebar nên tin nhắn hiện đồng bộ ở
     * cả hai nơi. Bấm nút chat lần nữa (hoặc bấm nút X) thì đóng popup.
     */
    async toggleChatPopup() {
      let me = this;
      if (me.chatPopupId) {
        TMDialogUtil.closeById(me.chatPopupId);
        me.chatPopupId = null;
        return;
      }
      try {
        me.chatPopupId = await TMDialogUtil.showPopup({
          dialogType: TMDialogEnum.TMUltraViewerChatPopup,
          ownerForm: me,
          props: {
            chatState: me.chatState,
            onSend: (text) => me.sendChat(text),
          },
          param: {
            title: me.$t("i18nCommon.ultraViewer.chatTitle"),
            placeHolder: me.$t("i18nCommon.ultraViewer.chatPlaceholder"),
            typingText: me.$t("i18nCommon.ultraViewer.typing"),
          },
          callback: () => {
            me.chatPopupId = null;
          },
        });
      } catch (e) {
        me.chatPopupId = null;
        me.reportError(
          `${me.$t("i18nCommon.ultraViewer.chatPopupFailed")}: ${me.formatError(e)}`,
        );
      }
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
      const sz = me.client.screen_size();
      if (sz && sz[0] && sz[1]) {
        me.canvasWidth = sz[0];
        me.canvasHeight = sz[1];
      }
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
        this.client.set_clipboard_sharing(
          this.currentConfigLayout.clipboardSync,
        );
      }
      this.updateConfigLayout();
    },

    pushChat(text, local) {
      const messages = this.chatState.messages;
      messages.push({
        text,
        local,
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      });
      if (messages.length > 200) {
        messages.splice(0, messages.length - 200);
      }
    },

    /**
     * Gửi tin nhắn tới máy đối tác (dùng chung cho sidebar và popup).
     * @param {string} text nội dung tin nhắn
     */
    sendChat(text) {
      let me = this;
      const content = (text ?? "").trim();
      if (!content || !me.client) return;
      try {
        me.client.send_chat(content);
        me.pushChat(content, true);
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
     * Ánh xạ nút chuột từ chuẩn trình duyệt sang chuẩn UltraViewer.
     * Browser: 0=trái, 1=giữa, 2=phải
     * UltraViewer (input.rs): 0=trái, 1=phải, 2=giữa
     */
    remapMouseButton(browserButton) {
      if (browserButton === 1) return 2; // giữa → 2 (MBUTTONDOWN/UP)
      if (browserButton === 2) return 1; // phải → 1 (RBUTTONDOWN/UP)
      return browserButton; // 0=trái giữ nguyên
    },

    /**
     * Đổi toạ độ chuột trên canvas (CSS pixel) sang toạ độ màn hình từ xa.
     * Đọc trực tiếp bounding rect của canvas để có toạ độ chính xác tức thì
     * như IronRDP (không cache để tránh giật bước nhảy toạ độ).
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

    /**
     * Chuột di chuyển: chuyển toạ độ trên canvas sang toạ độ desktop ảo của máy
     * đối tác rồi gọi WASM pointer_move. WASM bên trong đã giới hạn nhịp gửi 8ms (~125Hz)
     * nên gửi ngay lập tức không làm nghẽn mạng, loại bỏ độ trễ và giật lùi con trỏ.
     */
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
      this.client.pointer_button(this.remapMouseButton(e.button), true, x, y);
    },

    onCanvasMouseup(e) {
      if (!this.client || !this.isConnected || !this.controlEnabled) return;
      e.preventDefault();
      const { x, y } = this.toRemotePoint(e);
      this.client.pointer_button(this.remapMouseButton(e.button), false, x, y);
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

/* Canvas phủ vẽ con trỏ của máy đối tác (khi ở chế độ server pointer hoặc chỉ xem) */
.tm-uv-cursor-canvas {
  position: absolute;
  outline: none;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
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

/* Khung chat đã tách thành component dùng chung
   (src/views/dialogs/ultraviewer/TMUltraViewerChatBox.vue) nên không còn style
   chat ở đây. */

/* Nút chat đang mở popup thì tô đậm để biết popup đang mở (nút nằm trong
   thanh công cụ của TMFullTabWrapper nên cần :deep) */
:deep(.toolbar-btn-active) {
  background-color: var(--focus-color);
  color: var(--selected-item-text-color);
}
</style>
