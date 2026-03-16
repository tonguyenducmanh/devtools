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
    </div>

    <!-- Quote Marquee -->
    <div class="td-quote-container" v-if="showQuote && quoteOfDay">
      <div class="td-quote-marquee">
        <span class="td-quote-text">
          {{ quoteOfDay.q }} — {{ quoteOfDay.a }}
        </span>
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
import { useTabManager } from "@/stores/TDTabManager.js";
import { getQuoteOfDay } from "@/common/TDQuotes.js";
export default {
  name: "TDHeader",
  setup() {
    const { openTab, exitTabMode } = useTabManager();
    return { openTab, exitTabMode };
  },
  computed: {
    appName() {
      return window.__env.appName;
    },
    showQuote() {
      return window.__env?.quoteConfig?.showQuote ?? true;
    },
    quoteOfDay() {
      return getQuoteOfDay();
    },
  },

  methods: {
    goToWelcome() {
      let me = this;
      me.exitTabMode();
    },
    goToUserSetting() {
      let me = this;
      me.openTab({
        titleKey: "i18nCommon.feature.userSettings",
        groupPath: "",
        path: "/TDUserSettings",
        component: () => import("@/views/misc/TDUserSettings.vue"),
      });
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

  .td-quote-container {
    flex: 1;
    overflow: hidden;
    mask-image: linear-gradient(
      to right,
      transparent,
      black 10%,
      black 90%,
      transparent
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      black 10%,
      black 90%,
      transparent
    );

    .td-quote-marquee {
      display: inline-block;
      white-space: nowrap;
      animation: td-quote-scroll 30s linear infinite;
      will-change: transform;

      .td-quote-text {
        font-size: 14px;
        font-style: italic;
        color: var(--text-secondary-color);
        padding-right: 50px;
      }
    }
  }
}

@keyframes td-quote-scroll {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
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
