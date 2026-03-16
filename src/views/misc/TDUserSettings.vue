<template>
  <div class="flex td-user-setting">
    <div class="flex flex-col setting-group">
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
  </div>
</template>
<script>
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
      await me.$tdCache.set(
        me.$tdEnum.cacheConfig.UserSettings,
        me.currentUserSetting,
      );
      me.$tdUtility.reloadApp();
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
  align-items: flex-start;
  padding: var(--padding);
  gap: var(--padding);
  .setting-group {
    width: 100%;
    gap: var(--padding);
    .user-setting-item {
      width: 100%;
      justify-content: space-between;
    }
  }
}
</style>