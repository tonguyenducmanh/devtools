<template>
  <TDCodeTemplateTool
    :language="'powershell'"
    :templatesFull="getTemplate()"
  ></TDCodeTemplateTool>
</template>

<script>
import TDCodeTemplateTool from "@/views/tools/codeTemplateTools/TDCodeTemplateTool.vue";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import templates from "@/templates/powershell/templates.js";

export default {
  extends: TDToolBase,
  name: "TDCodeTemplatePowerShell",
  components: { TDCodeTemplateTool },
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
