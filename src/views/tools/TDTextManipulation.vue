<template>
  <div class="flex flex-col container">
    <TDTextarea
      :placeHolder="$t('i18nCommon.textManipulation.inputSource')"
      v-model="inputSource"
      class="mb-medium"
    ></TDTextarea>

    <TDTextarea
      :placeHolder="$t('i18nCommon.textManipulation.expressionSource')"
      v-model="expressionSource"
    ></TDTextarea>

    <div class="flex">
      <TDButton
        @click="manipulate"
        :label="$t('i18nCommon.textManipulation.manipulate')"
      ></TDButton>
      <TDButton
        @click="handleCopyResult"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.jsonToPostgreSQL.copy')"
      ></TDButton>
      <TDButton
        @click="applyExample"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.example')"
      ></TDButton>
    </div>
    <TDTextarea
      :placeHolder="$t('i18nCommon.textManipulation.outputSource')"
      v-model="outputSource"
    ></TDTextarea>
  </div>
</template>

<script>
import mock from "@/common/mock/TDMockTextManipulation.js";
export default {
  name: "TDTextManipulation",
  data() {
    return {
      inputSource: "",
      expressionSource: "",
      outputSource: "",
    };
  },
  created() {
    let me = this;
  },
  methods: {
    manipulate() {},
    handleCopyResult() {
      this.$tdUtility.copyToClipboard(this.similarity);
    },
    applyExample() {
      this.inputSource = mock.inputSource;
      this.expressionSource = mock.expressionSource;
      this.outputSource = "";
      this.$tdToast.success(
        this.$t("i18nCommon.toastMessage.applyMockSuccess")
      );
    },
  },
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}
</style>
