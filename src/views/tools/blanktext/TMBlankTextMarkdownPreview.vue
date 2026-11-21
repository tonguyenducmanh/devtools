<template>
  <TMMarkdownViewer :source="source" :renderNonce="renderNonce" />
</template>

<script>
import TMMarkdownViewer from "@/common/markdown/TMMarkdownViewer.vue";

export default {
  name: "TMBlankTextMarkdownPreview",
  components: { TMMarkdownViewer },
  props: {
    source: {
      type: String,
      default: "",
    },
    renderNonce: {
      type: Number,
      default: 0,
    },
  },
};
</script>
