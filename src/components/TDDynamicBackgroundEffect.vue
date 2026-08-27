<template>
  <component :is="currentComponent" />
</template>

<script setup>
import { shallowRef } from "vue";

// 1. Import các components
import TDGridLinesEffect from "./backgroundEffect/TDGridLinesEffect.vue";
import TDParticleShapeEffect from "./backgroundEffect/TDParticleShapeEffect.vue";
import TDRetro3DGridEffect from "./backgroundEffect/TDRetro3DGridEffect.vue";
import TDNeonWaveEffect from "./backgroundEffect/TDNeonWaveEffect.vue";

defineOptions({
  name: "TDDynamicBackgroundEffect",
});

// 2. Sử dụng shallowRef để tối ưu hiệu năng, tránh Vue scan deep reactive vào component
const effects = shallowRef([
  TDGridLinesEffect,
  TDParticleShapeEffect,
  TDRetro3DGridEffect,
  TDNeonWaveEffect,
]);

// 3. Mỗi lần mount chọn ngẫu nhiên 1 effect, không cần settimeout/interval
const currentComponent = effects.value[
  Math.floor(Math.random() * effects.value.length)
];
</script>
