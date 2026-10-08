<template>
  <div class="flex flex-col tm-user-setting">
    <div class="flex setting-content">
      <div class="flex flex-col setting-group">
        <div class="flex user-setting-item">
          <div>{{ $t("i18nCommon.apiTesting.tooltipUrlAgent") }}</div>
          <div class="input-setting">
            <TMInput
              v-model="currentUserSetting.agentURL"
              v-tooltip="$t('i18nCommon.apiTesting.tooltipUrlAgent')"
              :noMargin="true"
              :placeHolder="$t('i18nCommon.apiTesting.agentUrl')"
            />
          </div>
        </div>
        <div class="flex user-setting-item">
          <div>{{ $t("i18nUserSettings.settings.theme") }}</div>
          <TMComboBox
            :width="200"
            v-model="currentUserSetting.theme"
            :options="themeOption"
            :noMargin="true"
          />
        </div>
        <div class="flex user-setting-item">
          <div>{{ $t("i18nUserSettings.settings.backgroundEffect") }}</div>
          <TMComboBox
            :width="200"
            v-model="currentUserSetting.backgroundEffect"
            :options="backgroundEffectOption"
            :noMargin="true"
          />
        </div>
        <div class="flex user-setting-item">
          <div>{{ $t("i18nUserSettings.settings.cursorEffect") }}</div>
          <TMComboBox
            :width="200"
            v-model="currentUserSetting.cursorEffect"
            :options="cursorEffectOption"
            :noMargin="true"
          />
        </div>
        <div class="flex user-setting-item">
          <div>{{ $t("i18nUserSettings.settings.welcomeBackground") }}</div>
          <TMComboBox
            :width="200"
            v-model="currentUserSetting.welcomeBackground"
            :options="welcomeBackgroundOption"
            :noMargin="true"
          />
        </div>
        <div class="flex user-setting-item">
          <div>{{ $t("i18nUserSettings.settings.language") }}</div>
          <TMComboBox
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
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentUserSetting.wrapTab"
            :label="$t('i18nUserSettings.settings.wrapTab')"
            :noMargin="true"
          ></TMCheckbox>
        </div>
      </div>
    </div>
    <TMButton
      :noMargin="true"
      @click="saveSetting"
      :label="$t('i18nUserSettings.saveSetting')"
    />
  </div>
</template>
<script>
import TMAutomation from "@/common/automation/TMAutomation.js";
import TMAgentAPI from "@/common/api/request/AgentAPI/TMAgentAPI.js";
import { getUserSettingDefault } from "@/common/TMUserSettingDefault.js";

export default {
  name: "TMUserSettings",

  data() {
    let me = this;
    return {
      currentUserSetting: getUserSettingDefault(),
      themeOption: me.$tmEnum.monacoThemeList,
      languageOption: [
        { value: "vi", label: me.$t("i18nGlobal.language.vi") },
        { value: "en", label: me.$t("i18nGlobal.language.en") },
      ],
    };
  },
  computed: {
    welcomeBackgroundOption() {
      return this.$tmEnum.welcomeBackgroundList.map((item) => ({
        label: this.$t(item.labelKey),
        value: item.value,
      }));
    },
    backgroundEffectOption() {
      return this.$tmEnum.backgroundEffectList.map((item) => ({
        label: this.$t(item.labelKey),
        value: item.value,
      }));
    },
    cursorEffectOption() {
      return this.$tmEnum.cursorEffectList.map((item) => ({
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
      let cacheData = await me.$tmUtility.getUserSettings();
      if (cacheData) {
        me.currentUserSetting = Object.assign(me.currentUserSetting, cacheData);
      }
    },
    async saveSetting() {
      let me = this;
      me.saveTheme();
      me.handleChangeAgentURL();
      await me.$tmCache.set(
        me.$tmEnum.cacheConfig.UserSettings,
        me.currentUserSetting,
      );
      me.$tmUtility.reloadApp();
    },
    handleChangeAgentURL() {
      let me = this;
      TMAutomation.setGlobalInfoBeforeRequest({
        agentURL: me.currentUserSetting.agentURL,
      });
    },
    saveTheme() {
      let me = this;
      me.$tmUtility.setTheme(me.currentUserSetting.theme);
    },
  },
  mounted() {},
};
</script>

<style lang="scss" scoped>
.tm-user-setting {
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
