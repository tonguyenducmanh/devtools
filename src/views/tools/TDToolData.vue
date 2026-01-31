<template>

</template>

<script>
import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

export default {
    name: "TDToolData",
    components: {
    },

    data() {
        return {
            agentAPI: null,

        };
    },

    computed: {
    },

    async mounted() {
        this.agentAPI = new TDAgentAPI();
    },

    methods: {
    },
};
</script>

<style scoped lang="scss"></style>
