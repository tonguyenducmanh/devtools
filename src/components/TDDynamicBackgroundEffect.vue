<template>
  <component :is="currentComponent" />
</template>

<script setup>
import { computed } from "vue";
import TDCodeMoveEffect from "./backgroundEffect/TDCodeMoveEffect.vue";
import TDGridLinesEffect from "./backgroundEffect/TDGridLinesEffect.vue";
import TDPixelTunnelEffect from "./backgroundEffect/TDPixelTunnelEffect.vue";
import TDParticleShapeEffect from "./backgroundEffect/TDParticleShapeEffect.vue";
import TDRetro3DGridEffect from "./backgroundEffect/TDRetro3DGridEffect.vue";

defineOptions({
  name: "TDDynamicBackgroundEffect",
});

const effects = [
  TDCodeMoveEffect,
  TDGridLinesEffect,
  TDPixelTunnelEffect,
  TDParticleShapeEffect,
  TDRetro3DGridEffect,
];

const currentComponent = computed(() => {
  const now = new Date();
  const hours = now.getHours(); // Lấy số giờ hiện tại từ 0 - 23

  return effects[hours % effects.length];
});
</script>
