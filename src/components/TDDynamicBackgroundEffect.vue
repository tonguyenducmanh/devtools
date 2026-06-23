<!-- component wrap việc hiển thị mỗi effect 1 ngày -->
<template>
  <component :is="currentComponent" />
</template>

<script>
import TDCodeMoveEffect from "./backgroundEffect/TDCodeMoveEffect.vue";
import TDParticleShapeEffect from "./backgroundEffect/TDParticleShapeEffect.vue";

const effects = [TDCodeMoveEffect, TDParticleShapeEffect];

export default {
  name: "TDDynamicBackgroundEffect",
  computed: {
    currentComponent() {
      const now = new Date();
      const day = Math.floor(
        (now - new Date(now.getFullYear(), 0, 0)) / 86400000,
      );
      return effects[day % effects.length];
    },
  },
};
</script>
