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
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="currentUserSetting.wrapTab"
          :label="$t('i18nUserSettings.settings.wrapTab')"
          :noMargin="true"
        ></TDCheckbox>
      </div>
      <div class="flex user-setting-item">
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="currentUserSetting.showTabNumber"
          :label="$t('i18nCommon.tabManager.showTabNumber')"
          :noMargin="true"
        ></TDCheckbox>
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
import TDCURLUtil from "@/common/api/CURLHandle/TDCURLUtil.js";
import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";
import { getUserSettingDefault } from "@/common/TDUserSettingDefault.js";

export default {
  name: "TDUserSettings",

  data() {
    let me = this;
    return {
      currentUserSetting: getUserSettingDefault(),
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
      let cacheData = await me.$tdUtility.getUserSettings();
      if (cacheData) {
        me.currentUserSetting = Object.assign(me.currentUserSetting, cacheData);
      }
    },
    goToSource() {
      let me = this;
      me.$tdUtility.goToSource();
    },
    async saveSetting() {
      let me = this;
      me.saveTheme();
      me.handleChangeAgentURL();
      await me.$tdCache.set(
        me.$tdEnum.cacheConfig.UserSettings,
        me.currentUserSetting,
      );
      me.$tdUtility.reloadApp();
    },
    handleChangeAgentURL() {
      let me = this;
      TDCURLUtil.setGlobalInfoBeforeRequest({
        agentURL: me.currentUserSetting.agentURL,
      });
    },
    saveTheme() {
      let me = this;
      me.$tdUtility.setTheme(me.currentUserSetting.theme);
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
