<!-- Tool Ảnh pixel — web app PhotoCraft (Rust → WebAssembly), xem src_wasm/photocraft -->
<template>
  <TMCraftApp app-key="photocraft" app-name="PhotoCraft" />
</template>

<script>
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMCraftApp from "@/views/tools/Craft/TMCraftApp.vue";

export default {
  name: "TMPhotoCraft",
  extends: TMToolBase,
  components: { TMCraftApp },
};
</script>