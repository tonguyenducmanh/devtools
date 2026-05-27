<template>
  <div class="flex container">
    <div class="main-tool flex-col">
      <TDDynamicBackgroundEffect v-if="!activeSessionId" />
      <div
        ref="terminalContainer"
        class="terminal-container"
        v-show="activeSessionId"
      ></div>
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
        <!-- Help -->
        <div
          class="flex flex-col td-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.TerminalSidebarOption.Help
          "
        >
          <TDTerminalHelp />
        </div>

        <!-- Sessions Collection -->
        <div
          class="flex flex-col td-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.TerminalSidebarOption.Collection
          "
        >
          <div class="td-terminal-collection">
            <div class="flex flex-col td-collection-header">
              <div class="td-connection-form">
                <TDComboBox
                  v-model="selectedShell"
                  :options="shellOptions"
                  :noMargin="true"
                  :isEditable="false"
                  :width="100"
                  :usingStylePercent="true"
                ></TDComboBox>
                <div class="td-connection-actions mt-medium">
                  <TDInput
                    :noMargin="true"
                    v-model="sessionName"
                    :placeHolder="$t('i18nCommon.feature.terminal.sessionName')"
                  />
                </div>
                <div class="td-connection-actions mt-medium">
                  <TDButton
                    :noMargin="true"
                    :readOnly="!sessionName"
                    @click="createSession"
                    :label="$t('i18nCommon.feature.terminal.createSession')"
                  />
                </div>
              </div>
            </div>
            <div class="td-connection-list mt-medium">
              <div class="flex td-connection-list-header">
                <span class="td-connection-list-title">{{
                  $t("i18nCommon.feature.terminal.sessionListTitle")
                }}</span>
                <div
                  @click="fetchSessions"
                  class="td-icon td-reload-icon"
                ></div>
              </div>

              <div v-if="activeSessions.length === 0" class="td-no-connections">
                {{ $t("i18nCommon.feature.terminal.noActiveSessions") }}
              </div>
              <div
                v-else
                v-for="session in activeSessions"
                :key="session.id"
                class="td-connection-item"
                :class="{
                  'td-connection-item-selected': activeSessionId === session.id,
                }"
                @click="selectSession(session)"
              >
                <div class="td-connection-info">
                  <span class="td-connection-name">{{ session.name }}</span>
                  <span class="td-connection-host">{{
                    session.id.substring(0, 8)
                  }}</span>
                </div>
                <div
                  class="td-icon td-close-icon"
                  @click.stop="killSession(session.id)"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings -->
        <div
          class="flex flex-col td-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.TerminalSidebarOption.Setting
          "
        >
          <div class="td-terminal-setting">
            <TDComboBox
              v-model="selectedTheme"
              :options="themeOptions"
              :noMargin="true"
              :isEditable="false"
              :width="100"
              :usingStylePercent="true"
              :label="$t('i18nCommon.feature.terminal.themeLabel')"
            ></TDComboBox>
          </div>
        </div>
      </template>
    </TDSubSidebar>
  </div>
</template>

<script>
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDButton from "@/components/TDButton.vue";
import TDTerminalHelp from "@/views/helps/TDTerminalHelp.vue";
import TDTerminalAPI from "@/common/api/request/AgentAPI/TDTerminalAPI.js";
import TDCache from "@/common/cache/TDCache.js";
import TDDynamicBackgroundEffect from "@/components/TDDynamicBackgroundEffect.vue";

import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export default {
  name: "TDTerminalVirtual",
  extends: TDToolBase,
  components: {
    TDSubSidebar,
    TDButton,
    TDTerminalHelp,
    TDDynamicBackgroundEffect,
  },
  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.TerminalConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.TerminalSidebarOption.Help,
        terminalTheme: "dark",
      },
      availableShells: [],
      selectedShell: "",
      activeSessions: [],
      activeSessionId: null,
      sessionName: "session 1",
      themes: {
        dark: {
          background: "#1e1e1e",
          foreground: "#ffffff",
          cursor: "#ffffff",
          cursorAccent: "#1e1e1e",
        },
        light: {
          background: "#ffffff",
          foreground: "#000000",
          cursor: "#000000",
          cursorAccent: "#ffffff",
        },
        dracula: {
          background: "#282a36",
          foreground: "#f8f8f2",
          cursor: "#f8f8f2",
          cursorAccent: "#282a36",
          black: "#21222c",
          red: "#ff5555",
          green: "#50fa7b",
          yellow: "#f1fa8c",
          blue: "#bd93f9",
          magenta: "#ff79c6",
          cyan: "#8be9fd",
          white: "#f8f8f2",
          brightBlack: "#6272a4",
          brightRed: "#ff6e6e",
          brightGreen: "#69ff94",
          brightYellow: "#ffffa5",
          brightBlue: "#d6acff",
          brightMagenta: "#ff92df",
          brightCyan: "#a4ffff",
          brightWhite: "#ffffff",
        },
      },
    };
  },
  created() {
    this.terminal = null;
    this.fitAddon = null;
    this.ws = null;
    this.resizeObserver = null;
  },
  computed: {
    sidebarOptions() {
      return [
        {
          value: this.$tdEnum.TerminalSidebarOption.Help,
          label: this.$t("i18nCommon.sidebarOption.help"),
          icon: "td-help-icon",
        },
        {
          value: this.$tdEnum.TerminalSidebarOption.Collection,
          label: this.$t("i18nCommon.feature.terminal.sessionsTitle"),
          icon: "td-folder-icon",
        },
        {
          value: this.$tdEnum.TerminalSidebarOption.Setting,
          label: this.$t("i18nCommon.sidebarOption.setting"),
          icon: "td-setting-icon",
        },
      ];
    },
    shellOptions() {
      return this.availableShells.map((s) => ({
        value: s.path,
        label: s.name,
      }));
    },
    themeOptions() {
      return [
        { value: "dark", label: "Dark" },
        { value: "light", label: "Light" },
        { value: "dracula", label: "Dracula" },
      ];
    },
    selectedTheme: {
      get() {
        return this.currentConfigLayout.terminalTheme || "dark";
      },
      set(value) {
        this.currentConfigLayout.terminalTheme = value;
        this.updateConfigLayout();
        this.applyTheme();
      },
    },
  },
  async mounted() {
    await this.fetchShells();
    await this.fetchSessions();
  },
  watch: {
    sessionName(oldVal, newVal) {
      if (oldVal != newVal) {
        this.reBuildTabTitle(this.sessionName);
      }
    },
  },
  beforeUnmount() {
    this.cleanupTerminal();
  },
  methods: {
    toggleSidebar() {
      this.updateConfigLayout();
      this.$nextTick(() => {
        if (this.fitAddon && this.terminal) {
          this.fitAddon.fit();
        }
      });
    },
    async fetchShells() {
      try {
        let res = await TDTerminalAPI.getShells();
        if (res && res.data) {
          this.availableShells = res.data;
          if (this.availableShells.length > 0) {
            this.selectedShell = this.availableShells[0].path;
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
    async fetchSessions() {
      try {
        let res = await TDTerminalAPI.getSessions();
        if (res && res.data) {
          this.activeSessions = res.data;
        }
      } catch (e) {
        console.error(e);
      }
    },
    async createSession() {
      if (!this.selectedShell) return;
      try {
        let res = await TDTerminalAPI.createSession({
          shell: this.selectedShell,
          name: this.sessionName,
        });
        if (res && res.data && res.data.data) {
          await this.fetchSessions();
          this.selectSession(res.data.data);
        }
      } catch (e) {
        console.error(e);
        this.$tdToast.error(this.$t("i18nCommon.toastMessage.error"));
      }
    },
    async killSession(id) {
      try {
        await TDTerminalAPI.killSession(id);
        if (this.activeSessionId === id) {
          this.cleanupTerminal();
          this.activeSessionId = null;
        }
        await this.fetchSessions();
      } catch (e) {
        console.error(e);
        this.$tdToast.error(this.$t("i18nCommon.toastMessage.error"));
      }
    },
    selectSession(session) {
      this.activeSessionId = session.id;
      this.sessionName = session.name;
      this.initTerminal();
    },
    applyTheme() {
      if (this.terminal) {
        let themeToApply = this.themes[this.selectedTheme] || this.themes.dark;
        this.terminal.options.theme = themeToApply;
      }
    },
    cleanupTerminal() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      if (this.terminal) {
        this.terminal.dispose();
        this.terminal = null;
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    },
    initTerminal() {
      this.cleanupTerminal();
      this.$nextTick(() => {
        let container = this.$refs.terminalContainer;
        if (!container) return;

        let themeToApply = this.themes[this.selectedTheme] || this.themes.dark;

        this.terminal = new Terminal({
          cursorBlink: true,
          theme: themeToApply,
          macOptionIsMeta: true,
        });

        this.fitAddon = new FitAddon();
        this.terminal.loadAddon(this.fitAddon);

        // Ngăn chặn các phím Backspace/Delete bị trình duyệt hoặc Vue app bắt (ví dụ global hotkeys)
        this.terminal.attachCustomKeyEventHandler((e) => {
          if (e.key === "Backspace" || e.key === "Delete") {
            e.stopPropagation();
          }
          return true;
        });

        this.terminal.open(container);
        this.fitAddon.fit();

        let agentUrl = TDTerminalAPI.getBaseUrl();
        if (!agentUrl) {
          this.$tdUtility.showErrorNotFoundAgentServer();
          return;
        }

        let wsUrl = agentUrl.replace("http", "ws");
        if (wsUrl.endsWith("/")) {
          wsUrl = wsUrl.slice(0, -1);
        }
        wsUrl += `/api/terminal/ws/${this.activeSessionId}`;

        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = "arraybuffer";

        this.ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            this.terminal.write(new Uint8Array(event.data));
          } else {
            this.terminal.write(event.data);
          }
        };

        this.terminal.onData((data) => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            let sendData = data;
            // Zsh trên Mac đôi khi không mapping \x7f (DEL) cho Backspace,
            // nên ta thử chuyển sang \x08 (BS - Backspace) để tương thích tốt hơn.
            if (sendData === "\x7f") {
              sendData = "\x08";
            }
            this.ws.send(sendData);
          }
        });

        this.terminal.onResize((size) => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(
              JSON.stringify({
                type: "resize",
                cols: size.cols,
                rows: size.rows,
              }),
            );
          }
        });

        this.resizeObserver = new ResizeObserver(() => {
          if (this.fitAddon && this.terminal) {
            this.fitAddon.fit();
          }
        });
        this.resizeObserver.observe(container);
      });
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

.terminal-container {
  width: 100%;
  height: 100%;
  background: var(--bg-main-color);
  overflow: hidden;
}

.no-session-msg {
  margin: auto;
  color: var(--text-secondary-color);
  font-size: var(--font-size-l-medium);
  position: relative;
  z-index: 1;
}

.td-sub-sidebar {
  height: 100%;
  justify-content: flex-start;
  width: 100%;
  overflow: auto;
}

.td-terminal-collection {
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

.td-connection-list-header {
  justify-content: space-between;
  align-items: center;
  padding: var(--padding);
}

.td-connection-list-title {
  font-weight: 600;
  font-size: var(--font-size-medium-rare);
}

.td-no-connections {
  padding: var(--padding);
  text-align: center;
  color: var(--text-secondary-color);
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
  font-size: var(--font-size-small);
  color: var(--text-secondary-color);
}

.td-terminal-setting {
  display: flex;
  flex-direction: column;
  gap: var(--padding);
  margin-top: var(--padding);
  width: 100%;
  .td-combobox {
    width: 100%;
  }
}
</style>
