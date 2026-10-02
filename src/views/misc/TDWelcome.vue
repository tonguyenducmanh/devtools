<template>
  <div class="flex td-welcome">
    <div class="flex flex-col wrap-container">
      <div class="container">
        <transition v-if="isShowLoading" name="td-fade-loading">
          <TDLoading />
        </transition>
        <div v-else class="main-line-title">{{ welcomeTitle }}</div>
        <!-- flex + flex-row + flex-wrap: canh giữa, nút nằm bên phải tip, hẹp cỡ
             thì tự xuống dưới. Chỉ còn class riêng cho phần không có sẵn ở main.scss -->
        <div class="flex flex-row flex-wrap tip-wrapper">
          <transition name="td-tip" mode="out-in">
            <p :key="tipIndex" class="no-select tip-text" v-tooltip="$t('i18nTip.nextTip')" @click="nextTip">
              {{ currentTip }}
            </p>
          </transition>
          <!-- Dòng tip trên chỉ xoay 1 câu mỗi 10s nên không đọc hết được, nút này mở
               popup xem toàn bộ tip -->
          <div class="flex tip-view-all-btn" v-tooltip="$t('i18nTip.viewAllTips')" @click="showAllTips">
            <span class="td-icon td-book-icon"></span>
          </div>
        </div>
        <TDDynamicBackgroundEffect />
      </div>
      <p class="agreement">{{ $t("i18nCommon.agreement") }}</p>
    </div>
    <TDSubSidebar v-model="currentConfigLayout.isShowSidebar" @toggleSidebar="toggleSidebar">
      <template v-slot:main>
        <TDWelcomeHelp />
      </template>
    </TDSubSidebar>
  </div>
</template>

<script>
import TDWelcomeHelp from "@/views/helps/TDWelcomeHelp.vue";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDDynamicBackgroundEffect from "@/views/backgroundEffect/TDDynamicBackgroundEffect.vue";
import TDLayoutConfigMixin from "@/mixins/TDLayoutConfigMixin.js";
import TDTipsMixin from "@/mixins/TDTipsMixin.js";
import TDLoading from "../../components/TDLoading.vue";

export default {
  name: "TDWelcome",
  mixins: [TDLayoutConfigMixin, TDTipsMixin],
  components: { TDWelcomeHelp, TDSubSidebar, TDDynamicBackgroundEffect },
  data() {
    return {
      loadingType: this.$tdEnum.LoadingType.Normal,
      keyCacheLayout: this.$tdEnum.cacheConfig.WelcomeLayout,
      languageList: Object.keys(this.$tdEnum.language).sort(),
      currentConfigLayout: {
        isShowSidebar: false,
      },
    };
  },
  computed: {
    /**
     * lấy ra title để hiển thị ở màn welcome
     */
    welcomeTitle() {
      let me = this;
      return me.$tdUtility.getAuthorApp() ?? me.$tdUtility.defaultTitleApp();
    },
    isShowLoading() {
      return this.loadingType != this.$tdEnum.LoadingType.Normal;
    },
  },
  created() { },
  methods: {
    async toggleSidebar() {
      let me = this;
      await me.updateConfigLayout();
    },
    async processWhenMounted() {
      let me = this;
      me.loadingType =
        await me.$tdUtility.getUserSettings("currentLoadingType");
    },
  },
  mounted() {
    this.processWhenMounted();
    this.startTipTimer();
  },
  beforeUnmount() {
    this.stopTipTimer();
  },
};
</script>

<style lang="scss" scoped>
.td-welcome {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* Giữ nguyên các style cũ của bạn */
.wrap-container {
  height: 100%;
  flex: 1;
}

.agreement {
  // color: var(--text-color-light);
  text-align: center;
  width: 95%;
  margin: var(--padding);
}


.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--padding);
  width: 100%;
  height: 100%;
  flex: 1;
}

.main-line-title {
  font-size: 10cqw;
  font-family: var(--straight-font);
  font-weight: 600;
  position: relative;
  opacity: 1;
  visibility: visible;
  z-index: 1;
}

/* Bọc dòng tip đang xoay + nút xem tất cả (nút nằm bên phải tip).
   Dùng .flex .flex-row .flex-wrap của main.scss, class này chỉ bổ sung phần
   chưa có sẵn: z-index để nằm trên TDDynamicBackgroundEffect (canvas absolute,
   z-index 0) giống .main-line-title, và width 100% để .tip-text max-width: 60%
   lấy theo bề rộng container thay vì theo bề rộng nội dung. */
.tip-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
}

.tip-text {
  // font-size: var(--font-size-medium);
  padding: var(--padding) calc(var(--padding) * 2);
  max-width: 60%;
  height: 2.5em;
  text-align: center;
  border-radius: var(--border-radius);
  cursor: pointer;

}

/* Dùng .flex cho display + canh giữa, class này chỉ giữ kích thước và màu */
.tip-view-all-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--border-radius);
  cursor: pointer;
  color: var(--text-secondary-color);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background-color: var(--focus-color);
    color: var(--selected-item-text-color);
  }
}

/* transition chuyển tip kiểu loading game Zelda Breath of the Wild */
.td-tip-enter-active {
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
}

.td-tip-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.td-tip-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.td-tip-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>