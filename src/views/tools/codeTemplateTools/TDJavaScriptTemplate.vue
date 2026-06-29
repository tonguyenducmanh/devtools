<template>
  <TDTemplateCodeTool
    :language="'javascript'"
    :templatesFull="getTemplate()"
  ></TDTemplateCodeTool>
</template>

<script>
import TDTemplateCodeTool from "@/views/tools/codeTemplateTools/TDTemplateCodeTool.vue";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import templates from "@/templates/javascript/templates.js";

export default {
  extends: TDToolBase,
  name: "JavaScriptTemplate",
  components: { TDTemplateCodeTool },
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
