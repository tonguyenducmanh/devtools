<!-- Tool Soạn thảo văn bản — web app WordCraft (Rust → WebAssembly), xem src_wasm/wordcraft -->
<template>
  <TMCraftApp app-key="wordcraft" app-name="WordCraft" bg-color="#e6e6e6" />
</template>

<script>
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMCraftApp from "@/views/tools/Craft/TMCraftApp.vue";

export default {
  name: "TMWordCraft",
  extends: TMToolBase,
  components: { TMCraftApp },
};
</script>