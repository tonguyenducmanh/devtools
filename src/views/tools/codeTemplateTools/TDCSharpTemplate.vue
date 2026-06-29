<template>
  <TDTemplateCodeTool
    :language="'csharp'"
    :templatesFull="getTemplate()"
  ></TDTemplateCodeTool>
</template>

<script>
import TDTemplateCodeTool from "@/views/tools/codeTemplateTools/TDTemplateCodeTool.vue";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import templates from "@/templates/csharp/templates.js";

export default {
  extends: TDToolBase,
  name: "TDCSharpTemplate",
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
