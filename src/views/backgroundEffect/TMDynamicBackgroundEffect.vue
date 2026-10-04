<template>
  <component :is="currentComponent" />
</template>

<script setup>
import { shallowRef, onMounted, onBeforeUnmount, getCurrentInstance } from "vue";
import {
  backgroundEffectMap,
  backgroundEffectComponents,
  BACKGROUND_EFFECT_SHUFFLE,
  BACKGROUND_EFFECT_OFF,
} from "@/views/backgroundEffect/helpers/TMBackgroundEffectMap.js";
import eventBus from "@/common/event/TMEventBus.js";
import { TMEnumEventBus } from "@/common/event/TMEnumEventBus.js";

defineOptions({
  name: "TMDynamicBackgroundEffect",
});

const tmUtility = getCurrentInstance()?.proxy?.$tmUtility;
const currentComponent = shallowRef(null);

function pickRandomEffect() {
  return backgroundEffectComponents[
    Math.floor(Math.random() * backgroundEffectComponents.length)
  ];
}

function applyEffect(value) {
  if (value === BACKGROUND_EFFECT_OFF) {
    currentComponent.value = null;
  } else if (value === BACKGROUND_EFFECT_SHUFFLE) {
    currentComponent.value = pickRandomEffect();
  } else {
    currentComponent.value = backgroundEffectMap[value] || pickRandomEffect();
  }
}

let unsubscribe = null;

onMounted(async () => {
  let saved = null;
  if (tmUtility?.getUserSettings) {
    try {
      saved = await tmUtility.getUserSettings("backgroundEffect");
    } catch (e) {
      // ignore
    }
  }
  const mode = saved || BACKGROUND_EFFECT_OFF;

  // Luân phiên: mỗi lần mount chọn ngẫu nhiên 1 hiệu ứng (không đổi theo thời gian)
  applyEffect(mode);

  // Lắng nghe để đổi hiệu ứng tức thì khi chọn trên header
  unsubscribe = eventBus.on(
    TMEnumEventBus.backgroundEffectChanged,
    (value) => {
      applyEffect(value);
    },
  );
});

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
});
</script>
