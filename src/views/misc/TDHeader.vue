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
    <template v-if="quote">
      <div class="td-quote-header">
        <div class="td-quote-marquee">
          <span class="td-quote-content">
            {{ quote.q }}
          </span>
          <span class="td-quote-author"> — {{ quote.a }} </span>
        </div>
      </div>
    </template>
    <div
      class="td-icon td-setting-icon"
      @click="goToUserSetting"
      v-tooltip="$t('i18nCommon.feature.userSettings')"
    ></div>
  </div>
</template>

<script>
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";
import { QUOTES } from "@/common/TDQuote.js";
export default {
  name: "TDHeader",
  computed: {
    appName() {
      return window.__env.appName;
    },
  },
  async created() {
    let me = this;
    await me.buildQuote();
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
    return {
      quote: null,
    };
  },
  methods: {
    async buildQuote() {
      let me = this;
      const cached = await me.$tdCache.get(me.$tdEnum.cacheConfig.DailyQuote);
      const today = new Date().toDateString();

      if (cached && cached.date === today) {
        me.quote = cached.quote;
      } else {
        // Lấy quote mới theo ngày
        const dayIndex = new Date().getDayOfTheYear() % QUOTES.length;
        me.quote = QUOTES[dayIndex];
        await me.$tdCache.set(me.$tdEnum.cacheConfig.DailyQuote, {
          date: today,
          quote: me.quote,
        });
      }
    },
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
.td-quote-header {
  flex: 1;
  overflow: hidden; // Ẩn phần chạy ra ngoài
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.td-quote-marquee {
  display: inline-block;
  padding-left: 100%;
  animation: quote-scroll 15s linear infinite;
}

.td-quote-content {
  margin-right: 8px;
}

.td-quote-author {
  font-style: italic;
  opacity: 0.7;
}

@keyframes quote-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}
</style>
