<!-- Tool Ảnh vector — web app VectorCraft (Rust → WebAssembly), xem src_wasm/vectorcraft -->
<template>
  <TMCraftApp app-key="vectorcraft" app-name="VectorCraft" />
</template>

<script>
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMCraftApp from "@/views/tools/Craft/TMCraftApp.vue";

export default {
  name: "TMVectorCraft",
  extends: TMToolBase,
  components: { TMCraftApp },
};
</script>