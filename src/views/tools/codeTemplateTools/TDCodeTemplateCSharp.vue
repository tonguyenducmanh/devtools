<template>
  <TDCodeTemplateTool
    :language="'csharp'"
    :templatesFull="getTemplate()"
  ></TDCodeTemplateTool>
</template>

<script>
import TDCodeTemplateTool from "@/views/tools/codeTemplateTools/TDCodeTemplateTool.vue";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import templates from "@/templates/csharp/templates.js";

export default {
  extends: TDToolBase,
  name: "TDCodeTemplateCSharp",
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
