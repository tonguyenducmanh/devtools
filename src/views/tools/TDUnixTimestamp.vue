<template>
  <div class="flex flex flex-col td-unix-timestamp-container">
    <div class="flex flex-col td-unix-timestamp">
      <div class="flex td-convert-group">
        <div class="flex-one">
          <TDInput
            v-model="unixTimeWantConvert"
            :placeHolder="$t('i18nCommon.unixTimestamp.unixTimeWantConvert')"
            :noMargin="true"
            inputType="number"
          ></TDInput>
        </div>
        <div>
          <TDButton
            :readOnly="!unixTimeWantConvert"
            @click="convertToDateTime"
            :label="$t('i18nCommon.unixTimestamp.convert')"
          ></TDButton>
        </div>
        <div class="flex-one">
          <TDDateTime
            v-model="datetimeConverted"
            readOnly
            :noMargin="true"
          ></TDDateTime>
        </div>
        <TDButton
          @click="copyResultDate"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.copy')"
        ></TDButton>
      </div>
      <div class="flex td-convert-group">
        <div class="flex-one">
          <TDDateTime
            v-model="datetimeWantConvert"
            :noMargin="true"
          ></TDDateTime>
        </div>
        <div>
          <TDButton
            :readOnly="!datetimeWantConvert"
            @click="convertToUnixTime"
            :label="$t('i18nCommon.unixTimestamp.convert')"
          ></TDButton>
        </div>
        <div class="flex-one">
          <TDInput
            v-model="unixTimeConverted"
            :placeHolder="$t('i18nCommon.unixTimestamp.result')"
            :noMargin="true"
            inputType="number"
            readOnly
          ></TDInput>
        </div>
        <TDButton
          @click="copyResultUnix"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.copy')"
        ></TDButton>
      </div>
    </div>
    <div class="td-convert-result"></div>
  </div>
</template>

<script>
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
export default {
  extends: TDToolBase,
  name: "TDUnixTimestamp",
  components: {},
  computed: {
    timeMut() {
      let me = this;
      return 1000;
    },
  },

  methods: {
    convertToDateTime() {
      let me = this;
      me.datetimeConverted = null;
      try {
        let date = new Date(me.unixTimeWantConvert * me.timeMut);
        me.datetimeConverted = date;
        this.$tdToast.success(this.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        this.$tdToast.error(this.$t("i18nCommon.toastMessage.error"));
      }
    },
    /**
     * copy kết quả
     */
    copyResultDate() {
      let me = this;
      me.$tdUtility.copyToClipboard(
        this.$tdUtility.formatFullDateTime(me.datetimeConverted),
      );
    },
    convertToUnixTime() {
      let me = this;
      me.unixTimeConverted = null;
      try {
        let dateUnix = me.datetimeWantConvert.getTime() / me.timeMut;
        me.unixTimeConverted = dateUnix;
        this.$tdToast.success(this.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        this.$tdToast.error(this.$t("i18nCommon.toastMessage.error"));
      }
    },
    copyResultUnix() {
      let me = this;
      me.$tdUtility.copyToClipboard(this.unixTimeConverted);
    },
  },

  data() {
    return {
      unixTimeWantConvert: null,
      datetimeConverted: null,
      datetimeWantConvert: new Date(),
      unixTimeConverted: null,
      dataConverted: [],
    };
  },
};
</script>

<style scoped lang="scss">
.td-unix-timestamp-container {
  width: 100%;
  height: 100%;
  .td-unix-timestamp {
    width: 100%;
    height: 300px;
    .td-convert-group {
      width: 100%;
      justify-content: space-between;
    }
  }
  .td-convert-result {
    width: 100%;
    flex: 1;
  }
}
</style>
