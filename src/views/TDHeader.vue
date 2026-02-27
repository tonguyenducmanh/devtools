<template>
  <div class="flex td-header-container">
    <div class="flex td-app-name">
      <div class="td-logo" @click="goToWelcome"></div>
      <div
        class="td-app-title"
        @click="goToWelcome"
        v-tooltip="$t('i18nCommon.feature.welcome')"
      >
        {{ appName }}
      </div>
      <!-- Search Box -->
      <div class="td-search-container">
        <div class="td-search-box" @click="openSearchModal">
          <div class="td-icon td-search-icon"></div>
          <span class="td-search-placeholder">{{
            $t("i18nCommon.search.placeholder")
          }}</span>
          <div class="td-search-shortcut">
            <span>CTRL/⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>
    </div>
    <div
      class="td-icon td-setting-icon"
      @click="goToUserSetting"
      v-tooltip="$t('i18nCommon.feature.userSettings')"
    ></div>
  </div>
</template>

<script>
import { loadLocale } from "@/i18n/i18nData.js";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";
export default {
  name: "TDHeader",
  computed: {
    appName() {
      return window.__env.appName;
    },
  },
  created() {
    let me = this;
  },
  mounted() {
    // Thêm keyboard shortcut Cmd+K / Ctrl+K
    document.addEventListener("keydown", this.handleGlobalKeydown);
  },
  beforeUnmount() {
    document.removeEventListener("keydown", this.handleGlobalKeydown);
  },
  props: {},
  data() {
    let me = this;
    return {};
  },
  methods: {
    goToWelcome() {
      let me = this;
      me.$router.push("/");
    },
    goToUserSetting() {
      let me = this;
      me.$router.push("/TDUserSettings");
    },

    // Search methods
    openSearchModal() {
      // nếu không tồn tại request thì show popup tạo mới
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDGoToToolPopup,
        ownerForm: this,
      });
    },

    handleGlobalKeydown(event) {
      // Cmd+K hoặc Ctrl+K để mở search
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        this.openSearchModal();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.td-header-container {
  width: 100%;
  height: 100%;
  background-color: var(--bg-main-color);
  justify-content: space-between;
  padding: var(--padding) calc(var(--padding) * 1.5);

  .td-app-name {
    column-gap: var(--padding);
    .td-logo {
      width: 40px;
      height: 40px;
      background: url(@/assets/favicon.ico);
      background-size: cover;
      cursor: pointer;
    }
    .td-app-title {
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
    }
  }

  .td-search-container {
    position: relative;
    width: 200px;
    margin: 0 var(--padding);

    .td-search-box {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background-color: var(--bg-thirt-color);
      border: 1px solid transparent;
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border: 1px solid var(--focus-color);
      }

      .td-search-placeholder {
        flex: 1;
        font-size: 14px;
      }

      .td-search-shortcut {
        display: flex;
        gap: 2px;
        span {
          padding: 4px 6px;
          background-color: var(--bg-layer-color);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-color-secondary);
        }
      }
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .td-search-container {
    max-width: 200px;
    .td-search-shortcut {
      display: none;
    }
  }
}
</style>
