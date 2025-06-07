<template>
  <div class="container">
    <div class="title">
      <div>Download VSCode Extension from marketplace.visualstudio.com!</div>
      <div>For legacy download that microsoft is removed.</div>
    </div>
    <div class="flex flex-col">
      <div class="flex flex-wrap">
        <img class="td-img" src="@/assets/vscodeext.png" />
      </div>
      <TDInput label="Item name" type="text" v-model="itemName" />
      <TDInput label="Version" type="text" v-model="version" />
      <TDInput
        label="Download link"
        :readOnly="true"
        type="text"
        v-model="downloadLink"
      />
    </div>

    <div class="flex">
      <TDButton
        @click="handleBuildDownloadLink"
        label="Generate download link"
      ></TDButton>
      <TDButton
        @click="handleCopyDownloadLink"
        :type="$tdEnum.buttonType.secondary"
        label="Copy link"
      ></TDButton>
      <TDButton
        @click="applyMock"
        :type="$tdEnum.buttonType.secondary"
        label="Example"
      ></TDButton>
    </div>
  </div>
</template>
<script>
export default {
  name: "TDDownloadVSCodeExt",
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  data() {
    return {
      itemName: null,
      version: null,
      downloadLink: null,
    };
  },
  methods: {
    async applyMock() {
      // Lazy-load module
      const { TDMockDownloadVSCodeExt } = await import(
        /* webpackChunkName: "mock-download-vscode-ext" */
        "@/common/mock/TDMockDownloadVSCodeExt.js"
      );
      this.$tdUtility.applyMock(this, TDMockDownloadVSCodeExt);
    },
    handleBuildDownloadLink() {
      let me = this;
      if (me.itemName && me.version) {
        let parts = me.itemName.split(".");
        let publisher = parts[0];
        let extension = parts[1];
        me.downloadLink =
          "https://marketplace.visualstudio.com/_apis/public/gallery/publishers/{0}/vsextensions/{1}/{2}/vspackage".format(
            publisher.trim(),
            extension.trim(),
            me.version.trim()
          );
        window.open(me.downloadLink, "_blank").focus();
      }
    },
    handleCopyDownloadLink() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.downloadLink);
    },
  },
};
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
  padding: 2rem;
  border-radius: 0;
  min-height: 100vh;
  box-shadow: none;
}
.td-img {
  width: 100%;
  height: auto;
  padding: var(--padding);
}
</style>
