<template>
  <div class="flex td-user-setting">
    <div class="flex flex-col setting-group">
      <div class="flex user-setting-item">
        <div>{{ $t("i18nCommon.apiTesting.tooltipUrlAgent") }}</div>
        <div class="input-setting">
          <TDInput
            v-model="currentUserSetting.agentURL"
            v-tooltip="$t('i18nCommon.apiTesting.tooltipUrlAgent')"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.apiTesting.agentUrl')"
          />
        </div>
      </div>
      <div class="flex user-setting-item">
        <div>{{ $t("i18nUserSettings.settings.theme") }}</div>
        <TDComboBox
          :width="200"
          v-model="currentUserSetting.theme"
          :options="themeOption"
          :noMargin="true"
        />
      </div>
      <div class="flex user-setting-item">
        <div>{{ $t("i18nUserSettings.settings.language") }}</div>
        <TDComboBox
          :width="200"
          v-model="currentUserSetting.currentLanguage"
          :options="languageOption"
          :noMargin="true"
        />
      </div>
      <TDButton
        :noMargin="true"
        @click="saveSetting"
        :label="$t('i18nUserSettings.saveSetting')"
      />
    </div>
    <div class="divide"></div>

    <div class="flex flex-col setting-group">
      <div class="flex user-setting-item">
        <div>{{ $t("i18nCommon.apiTesting.pingAgent") }}</div>
        <TDButton
          :noMargin="true"
          @click="heathCheck"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.ping')"
        ></TDButton>
      </div>
      <div class="flex user-setting-item">
        <div>{{ $t("i18nCommon.apiTesting.downloadAgent") }}</div>
        <TDButton
          :noMargin="true"
          :type="$tdEnum.buttonType.secondary"
          @click="goToSource"
          :label="$t('i18nCommon.tdheader.goToSource')"
          v-tooltip="$t('i18nCommon.apiTesting.toolTipDownloadAgent')"
        />
      </div>
    </div>
  </div>
</template>
<script>
import { loadLocale } from "@/i18n/i18nData.js";
import TDCURLUtil from "@/common/api/CURLHandle/TDCURLUtil.js";
import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

export default {
  name: "TDUserSettings",

  data() {
    let me = this;
    return {
      currentUserSetting: {
        theme: "light",
        currentLanguage: "vi",
        agentURL: window.__env?.APITesting?.agentServer,
      },
      themeOption: [
        { value: "light", label: me.$t("i18nUserSettings.themeSetting.light") },
        { value: "dark", label: me.$t("i18nUserSettings.themeSetting.dark") },
      ],
      languageOption: [
        { value: "vi", label: me.$t("i18nGlobal.language.vi") },
        { value: "en", label: me.$t("i18nGlobal.language.en") },
      ],
    };
  },
  created() {
    let me = this;
    me.processWhenCreated();
  },
  methods: {
    async heathCheck() {
      let me = this;
      try {
        let res = await new TDAgentAPI().heathCheck();
        if (res && res.success && res.data) {
          me.$tdToast.success(res.data);
        } else {
          me.$tdToast.success(res);
        }
      } catch (ex) {
        me.$tdUtility.showErrorNotFoundAgentServer();
      }
    },
    async processWhenCreated() {
      let me = this;
      let cacheAgentUrl = await me.$tdCache.get(
        me.$tdEnum.cacheConfig.AgentUrl,
      );
      if (cacheAgentUrl) {
        me.currentUserSetting.agentURL = cacheAgentUrl;
      }
      me.currentUserSetting.theme = await me.$tdCache.get(
        me.$tdEnum.cacheConfig.Theme,
      );
      if (!me.currentUserSetting.theme) {
        me.currentUserSetting.theme = window.__env.defaultValue.theme;
        await me.$tdCache.set(me.$tdEnum.cacheConfig.Theme, currentTheme);
      }
      me.currentUserSetting.currentLanguage = await me.getCurrentLanguage();
    },
    goToSource() {
      let me = this;
      me.$tdUtility.goToSource();
    },
    async saveSetting() {
      let me = this;
      await me.saveLanguage();
      await me.saveTheme();
      await me.handleChangeAgentURL();
      me.$tdUtility.reloadApp();
    },
    async getCurrentLanguage() {
      let me = this;
      let currentLanguage = await this.$tdCache.get(
        this.$tdEnum.cacheConfig.Language,
      );
      if (currentLanguage) {
        return currentLanguage;
      }
      return this.$tdEnum.language.vi;
    },

    async saveLanguage() {
      let me = this;
      await me.$tdCache.set(
        me.$tdEnum.cacheConfig.Language,
        me.currentUserSetting.currentLanguage,
      );
      await loadLocale(me.currentUserSetting.currentLanguage);
    },
    async handleChangeAgentURL() {
      let me = this;
      await me.$tdCache.set(
        me.$tdEnum.cacheConfig.AgentUrl,
        me.currentUserSetting.agentURL,
      );
      TDCURLUtil.setGlobalInfoBeforeRequest({
        agentURL: me.currentUserSetting.agentURL,
      });
    },
    async saveTheme() {
      let me = this;
      await me.$tdCache.set(
        me.$tdEnum.cacheConfig.Theme,
        me.currentUserSetting.theme,
      );
      me.$tdUtility.setTheme(me.currentUserSetting.theme);
      this.$tdEventBus.emit(
        this.$tdEnum.eventGlobal.changeTheme,
        me.currentUserSetting.theme,
      );
    },
  },
  mounted() {},
};
</script>

<style lang="scss" scoped>
.td-user-setting {
  width: 100%;
  height: 100%;
  justify-content: space-around;
  gap: var(--padding);
  .divide {
    width: var(--padding);
    height: 100%;
    background-color: var(--bg-layer-color);
    border-radius: var(--border-radius);
  }
  .setting-group {
    width: 100%;
    height: 100%;
    gap: var(--padding);
    justify-content: flex-start;
    .user-setting-item {
      width: 100%;
      justify-content: space-between;
      .input-setting {
        width: 200px;
      }
    }
  }
}
</style>
