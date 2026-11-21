<template>
  <TMCodeTemplateTool
    :language="'powershell'"
    :templatesFull="getTemplate()"
    :i18nNamespace="'i18nTemplate.PowerShellTemplate'"
  ></TMCodeTemplateTool>
</template>

<script>
import TMCodeTemplateTool from "@/views/tools/codeTemplateTools/TMCodeTemplateTool.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import templates from "@/templates/powershell/templates.js";

export default {
  extends: TMToolBase,
  name: "TMCodeTemplatePowerShell",
  components: { TMCodeTemplateTool },
  created() {},
  computed: {},
  methods: {
    getTemplate() {
      return templates || [];
    },
  },
  data() {
    return {};
  },
};
</script>

<style scoped lang="scss"></style>
