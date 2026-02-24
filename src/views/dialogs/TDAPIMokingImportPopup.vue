<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    width="1000px"
    :title="$t('i18nCommon.APIMocking.ImportPlaceHolder')"
  >
    <div class="flex flex-col td-api-import-curl">
      <TDTextarea
        :isLabelTop="true"
        v-model="mockContent"
        :enableHighlight="currentConfigLayout.enableHighlight"
        language="shell"
        ref="mockContentInput"
        :placeHolder="$t('i18nCommon.apiTesting.contentCURL')"
      ></TDTextarea>
      <!-- các nút dưới ô nhập curl -->
      <div class="flex">
        <TDButton
          @click="importMock"
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
  name: "TDAPIMokingImportPopup",

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
      mockContent: "",
    };
  },
  computed: {},
  mounted() {
    let me = this;
    me.$nextTick(() => {
      if (me.$refs.mockContentInput) {
        me.$refs.mockContentInput.focus();
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

    async importMock() {
      let me = this;
      if (me.mockContent) {
        let mockData = JSON.parse(me.mockContent);
        if (mockData) {
          me.ownerForm.currentMockId = null;
          me.ownerForm.requestName = mockData.request_name ?? mockData.api_url;
          me.ownerForm.httpMethod = mockData.method;
          let pathname = new URL(mockData.api_url).pathname;
          me.ownerForm.apiUrl = pathname;
          me.ownerForm.bodyText = mockData.body_text;
          me.ownerForm.responseText = mockData.response_text;
        }
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
