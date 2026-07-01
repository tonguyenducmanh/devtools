<template>
  <TDPopup :visible="true" :showHeader="false" @close="handleClose">
    <div class="flex flex-col td-api-import-curl">
      <TDTextEditor
        :isLabelTop="true"
        v-model="curlContent"
        :enableHighlight="true"
        language="shell"
        ref="inputCURL"
        :placeHolder="$t('i18nCommon.apiTesting.contentCURL')"
      ></TDTextEditor>
      <!-- các nút dưới ô nhập curl -->
      <div class="flex">
        <TDButton
          @click="importCURL"
          :label="$t('i18nCommon.apiTesting.importCURL')"
        ></TDButton>
        <TDButton
          @click="handleClose"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.cancel')"
        ></TDButton>
      </div>
    </div>
  </TDPopup>
</template>

<script>
export default {
  name: "TDAPIImportCURLPopup",

  props: {
    ownerForm: {
      type: Object,
      required: true,
    },
    currentConfigLayout: {
      type: Object,
      default: {},
    },
  },

  data() {
    return {
      curlContent: "",
    };
  },
  computed: {},
  mounted() {
    let me = this;
    me.$nextTick(() => {
      if (me.$refs.inputCURL) {
        me.$refs.inputCURL.focus();
      }
    });
  },
  methods: {
    show(param) {
      let me = this;
    },
    handleClose() {
      this.$emit("close"); // popup chỉ emit
    },

    async importCURL() {
      let me = this;
      if (me.curlContent) {
        me.ownerForm.curlContent = me.curlContent;
        me.ownerForm.importCURL();
      }
      me.handleClose();
    },
  },
};
</script>
<style scoped lang="scss">
.td-api-import-curl {
  height: 500px;
}
</style>
