<template>
  <div class="td-app-data-miner-container"></div>
</template>

<script>
import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

export default {
  name: "TDAppDataMiner",
  components: {},
  mixins: [],

  data() {
    return {
      agentAPI: null,
    };
  },
  async mounted() {
    this.agentAPI = new TDAgentAPI();
  },
  computed: {},
  beforeUnmount() {},
  methods: {},
};
</script>

<style scoped lang="scss">
.td-app-data-miner-container {
}
</style>
