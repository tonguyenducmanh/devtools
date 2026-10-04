<template>
  <TMCodeTemplateTool
    :language="'shell'"
    :templatesFull="getTemplate()"
  ></TMCodeTemplateTool>
</template>

<script>
import TMCodeTemplateTool from "@/views/tools/codeTemplateTools/TMCodeTemplateTool.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import templates from "@/templates/git/templates.js";

export default {
  extends: TMToolBase,
  name: "TMCodeTemplateGit",
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
