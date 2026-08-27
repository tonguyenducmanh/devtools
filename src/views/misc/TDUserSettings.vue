<template>
  <div class="flex flex-col td-user-setting">
    <div class="flex setting-content">
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
          <div>{{ $t("i18nUserSettings.settings.backgroundEffect") }}</div>
          <TDComboBox
            :width="200"
            v-model="currentUserSetting.backgroundEffect"
            :options="backgroundEffectOption"
            :noMargin="true"
          />
        </div>
        <div class="flex user-setting-item">
          <div>{{ $t("i18nUserSettings.settings.cursorEffect") }}</div>
          <TDComboBox
            :width="200"
            v-model="currentUserSetting.cursorEffect"
            :options="cursorEffectOption"
            :noMargin="true"
          />
        </div>
        <div class="flex user-setting-item">
          <div>{{ $t("i18nUserSettings.settings.loadingType") }}</div>
          <TDComboBox
            :width="200"
            v-model="currentUserSetting.currentLoadingType"
            :options="loadingOption"
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
      </div>
      <div class="divide"></div>
      <div class="flex flex-col setting-group">
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
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentUserSetting.toastInHeader"
            :label="$t('i18nUserSettings.settings.toastInHeader')"
            :noMargin="true"
          ></TDCheckbox>
        </div>
      </div>
    </div>
    <TDButton
      :noMargin="true"
      @click="saveSetting"
      :label="$t('i18nUserSettings.saveSetting')"
    />
  </div>
</template>
<script>
import TDAutomation from "@/common/automation/TDAutomation.js";
import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";
import { getUserSettingDefault } from "@/common/TDUserSettingDefault.js";
import { toast } from "@/common/plugin/TDToastPlugin.js";

export default {
  name: "TDUserSettings",

  data() {
    let me = this;
    return {
      currentUserSetting: getUserSettingDefault(),
      themeOption: me.$tdEnum.monacoThemeList,
      languageOption: [
        { value: "vi", label: me.$t("i18nGlobal.language.vi") },
        { value: "en", label: me.$t("i18nGlobal.language.en") },
      ],
      loadingOption: [
        {
          value: this.$tdEnum.LoadingType.Normal,
          label: me.$t("i18nUserSettings.loadingType.Normal"),
        },
        {
          value: this.$tdEnum.LoadingType.Meme,
          label: me.$t("i18nUserSettings.loadingType.Meme"),
        },
      ],
    };
  },
  computed: {
    backgroundEffectOption() {
      return this.$tdEnum.backgroundEffectList.map((item) => ({
        label: this.$t(item.labelKey),
        value: item.value,
      }));
    },
    cursorEffectOption() {
      return this.$tdEnum.cursorEffectList.map((item) => ({
        label: this.$t(item.labelKey),
        value: item.value,
      }));
    },
  },
  created() {
    let me = this;
    me.processWhenCreated();
  },
  methods: {
    async processWhenCreated() {
      let me = this;
      let cacheData = await me.$tdUtility.getUserSettings();
      if (cacheData) {
        me.currentUserSetting = Object.assign(me.currentUserSetting, cacheData);
      }
    },
    async saveSetting() {
      let me = this;
      me.saveTheme();
      me.handleChangeAgentURL();
      toast.setUseHeaderToast(me.currentUserSetting.toastInHeader !== false);
      await me.$tdCache.set(
        me.$tdEnum.cacheConfig.UserSettings,
        me.currentUserSetting,
      );
      me.$tdUtility.reloadApp();
    },
    handleChangeAgentURL() {
      let me = this;
      TDAutomation.setGlobalInfoBeforeRequest({
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
  justify-content: flex-start;
  align-items: center;
  gap: var(--padding);
  .setting-content {
    width: 100%;
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
}
</style>
