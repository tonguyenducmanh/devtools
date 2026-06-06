<template>
  <TDTemplateCodeTool
    :language="'pgsql'"
    :templatesFull="getTemplate()"
  ></TDTemplateCodeTool>
</template>

<script>
import TDTemplateCodeTool from "@/views/tools/codeTemplateTools/TDTemplateCodeTool.vue";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import templates from "./templates.js";

export default {
  extends: TDToolBase,
  name: "TDPostgreSQLTemplate",
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
