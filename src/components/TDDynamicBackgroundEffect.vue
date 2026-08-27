<template>
  <component :is="currentComponent" />
</template>

<script setup>
import { shallowRef } from "vue";

// 1. Import các components
import TDGridLinesEffect from "./backgroundEffect/TDGridLinesEffect.vue";
import TDParticleShapeEffect from "./backgroundEffect/TDParticleShapeEffect.vue";
import TDNeonWaveEffect from "./backgroundEffect/TDNeonWaveEffect.vue";
import TDCellularAutomataEffect from "./backgroundEffect/TDCellularAutomataEffect.vue";
import TDWireframeCube3DEffect from "./backgroundEffect/TDWireframeCube3DEffect.vue";

defineOptions({
  name: "TDDynamicBackgroundEffect",
});

// 2. Sử dụng shallowRef để tối ưu hiệu năng, tránh Vue scan deep reactive vào component
const effects = shallowRef([
  TDGridLinesEffect,
  TDParticleShapeEffect,
  TDNeonWaveEffect,
  TDCellularAutomataEffect,
  TDWireframeCube3DEffect,
]);

// 3. Mỗi lần mount chọn ngẫu nhiên 1 effect, không cần settimeout/interval
const currentComponent = effects.value[
  Math.floor(Math.random() * effects.value.length)
];
</script>
