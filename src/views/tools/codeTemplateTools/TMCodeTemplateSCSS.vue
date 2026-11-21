<template>
  <TMCodeTemplateTool
    :language="'scss'"
    :templatesFull="getTemplate()"
    :i18nNamespace="'i18nTemplate.scssTemplate'"
  >
    <template #preview="{ template }">
      <TMCodeTemplateSCSSPreview
        :previewHtml="template ? template.previewHtml : ''"
      ></TMCodeTemplateSCSSPreview>
    </template>
  </TMCodeTemplateTool>
</template>

<script>
import TMCodeTemplateTool from "@/views/tools/codeTemplateTools/TMCodeTemplateTool.vue";
import TMCodeTemplateSCSSPreview from "@/views/tools/codeTemplateTools/TMCodeTemplateSCSSPreview.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import templates from "@/templates/scss/templates.js";

export default {
  extends: TMToolBase,
  name: "TMCodeTemplateSCSS",
  components: { TMCodeTemplateTool, TMCodeTemplateSCSSPreview },
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
