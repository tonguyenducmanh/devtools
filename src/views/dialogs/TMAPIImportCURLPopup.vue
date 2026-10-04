<template>
  <TMPopup
    :visible="true"
    @close="handleClose"
    width="1000px"
    :title="$t('i18nCommon.apiTesting.contentCURL')"
  >
    <div class="flex flex-col tm-api-import-curl">
      <TMTextEditor
        :isLabelTop="true"
        v-model="curlContent"
        :enableHighlight="true"
        language="shell"
        ref="inputCURL"
        :placeHolder="$t('i18nCommon.apiTesting.contentCURL')"
      ></TMTextEditor>
      <!-- các nút dưới ô nhập curl -->
      <div class="flex">
        <TMButton
          @click="importCURL"
          :label="$t('i18nCommon.apiTesting.importCURL')"
        ></TMButton>
        <TMButton
          @click="handleClose"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.cancel')"
        ></TMButton>
      </div>
    </div>
  </TMPopup>
</template>

<script>
export default {
  name: "TMAPIImportCURLPopup",

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
.tm-api-import-curl {
  height: 100%;
}
</style>
