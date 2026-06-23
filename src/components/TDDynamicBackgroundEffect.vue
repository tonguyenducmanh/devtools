<template>
  <keep-alive>
    <component :is="currentComponent" />
  </keep-alive>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, shallowRef } from "vue";

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

// 3. Biến reactive lưu số giờ hiện tại
const currentHour = ref(new Date().getHours());
let timer = null;

// 4. Computed tự động chạy lại ĐÚNG LÚC khi currentHour thay đổi
const currentComponent = computed(() => {
  return effects.value[currentHour.value % effects.value.length];
});

// 5. Quản lý Lifecycle để tracking thời gian thực và dọn dẹp bộ nhớ
onMounted(() => {
  // Check mỗi phút một lần (60000ms) để xem đã qua tiếng mới chưa.
  // Cách này vừa chính xác vừa cực kỳ nhẹ, không tốn CPU.
  timer = setInterval(() => {
    const nowHour = new Date().getHours();
    if (nowHour !== currentHour.value) {
      currentHour.value = nowHour; // Đổi giờ -> Computed kích hoạt -> Đổi effect ngay lập tức
    }
  }, 60000);
});

onUnmounted(() => {
  // Xóa bộ định thời khi component không còn hiển thị nữa
  if (timer) clearInterval(timer);
});
</script>
