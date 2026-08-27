<template>
  <component :is="currentComponent" />
</template>

<script setup>
import { shallowRef, onMounted, onBeforeUnmount, getCurrentInstance } from "vue";
import {
  backgroundEffectMap,
  backgroundEffectComponents,
  BACKGROUND_EFFECT_SHUFFLE,
} from "@/views/backgroundEffect/helpers/TDBackgroundEffectMap.js";
import eventBus from "@/common/event/TDEventBus.js";
import { TDEnumEventBus } from "@/common/event/TDEnumEventBus.js";

defineOptions({
  name: "TDDynamicBackgroundEffect",
});

const tdUtility = getCurrentInstance()?.proxy?.$tdUtility;
const currentComponent = shallowRef(null);

function pickRandomEffect() {
  return backgroundEffectComponents[
    Math.floor(Math.random() * backgroundEffectComponents.length)
  ];
}

function applyEffect(value) {
  if (value === BACKGROUND_EFFECT_SHUFFLE) {
    currentComponent.value = pickRandomEffect();
  } else {
    currentComponent.value = backgroundEffectMap[value] || pickRandomEffect();
  }
}

let unsubscribe = null;

onMounted(async () => {
  let saved = null;
  if (tdUtility?.getUserSettings) {
    try {
      saved = await tdUtility.getUserSettings("backgroundEffect");
    } catch (e) {
      // ignore
    }
  }
  const mode = saved || BACKGROUND_EFFECT_SHUFFLE;

  // Luân phiên: mỗi lần mount chọn ngẫu nhiên 1 hiệu ứng (không đổi theo thời gian)
  applyEffect(mode);

  // Lắng nghe để đổi hiệu ứng tức thì khi chọn trên header
  unsubscribe = eventBus.on(
    TDEnumEventBus.backgroundEffectChanged,
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
