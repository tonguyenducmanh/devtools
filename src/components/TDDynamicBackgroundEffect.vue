<template>
  <component :is="currentComponent" />
</template>

<script setup>
import { shallowRef } from "vue";

// 1. Import các components
import TDCodeMoveEffect from "./backgroundEffect/TDCodeMoveEffect.vue";
import TDGridLinesEffect from "./backgroundEffect/TDGridLinesEffect.vue";
import TDPixelTunnelEffect from "./backgroundEffect/TDPixelTunnelEffect.vue";
import TDParticleShapeEffect from "./backgroundEffect/TDParticleShapeEffect.vue";
import TDRetro3DGridEffect from "./backgroundEffect/TDRetro3DGridEffect.vue";

defineOptions({
  name: "TDDynamicBackgroundEffect",
});

// 2. Sử dụng shallowRef để tối ưu hiệu năng, tránh Vue scan deep reactive vào component
const effects = shallowRef([
  TDCodeMoveEffect,
  TDGridLinesEffect,
  TDPixelTunnelEffect,
  TDParticleShapeEffect,
  TDRetro3DGridEffect,
]);

// 3. Mỗi lần mount chọn ngẫu nhiên 1 effect, không cần settimeout/interval
const currentComponent = effects.value[
  Math.floor(Math.random() * effects.value.length)
];
</script>
