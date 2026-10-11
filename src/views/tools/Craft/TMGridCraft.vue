<!-- Tool Bảng tính — web app GridCraft (Rust → WebAssembly), xem src_wasm/gridcraft -->
<template>
  <TMCraftApp app-key="gridcraft" app-name="GridCraft" />
</template>

<script>
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMCraftApp from "@/views/tools/Craft/TMCraftApp.vue";

export default {
  name: "TMGridCraft",
  extends: TMToolBase,
  components: { TMCraftApp },
};
</script>