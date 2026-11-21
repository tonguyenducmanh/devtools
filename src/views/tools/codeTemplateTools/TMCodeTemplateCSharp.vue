<template>
  <TMCodeTemplateTool
    :language="'csharp'"
    :templatesFull="getTemplate()"
    :i18nNamespace="'i18nTemplate.CSharpTemplate'"
  ></TMCodeTemplateTool>
</template>

<script>
import TMCodeTemplateTool from "@/views/tools/codeTemplateTools/TMCodeTemplateTool.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import templates from "@/templates/csharp/templates.js";

export default {
  extends: TMToolBase,
  name: "TMCodeTemplateCSharp",
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
