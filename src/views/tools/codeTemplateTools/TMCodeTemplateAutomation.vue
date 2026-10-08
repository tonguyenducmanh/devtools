<template>
  <TMCodeTemplateTool
    :language="'javascript'"
    :templatesFull="getTemplate()"
  ></TMCodeTemplateTool>
</template>

<script>
import TMCodeTemplateTool from "@/views/tools/codeTemplateTools/TMCodeTemplateTool.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import templates from "@/templates/apiTesting/templates.js";

export default {
  extends: TMToolBase,
  name: "TMCodeTemplateAutomation",
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
