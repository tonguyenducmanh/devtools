<template>
  <component v-if="currentComponent" :is="currentComponent" />
</template>

<script setup>
import { shallowRef, onMounted, onBeforeUnmount, getCurrentInstance } from "vue";
import {
  cursorEffectMap,
  cursorEffectComponents,
  CURSOR_EFFECT_SHUFFLE,
  CURSOR_EFFECT_OFF,
} from "@/views/cursorEffect/helpers/TMCursorEffectMap.js";
import eventBus from "@/common/event/TMEventBus.js";
import { TMEnumEventBus } from "@/common/event/TMEnumEventBus.js";

defineOptions({
  name: "TMDynamicCursorEffect",
});

const tmUtility = getCurrentInstance()?.proxy?.$tmUtility;
const currentComponent = shallowRef(null);

function pickRandomEffect() {
  return cursorEffectComponents[
    Math.floor(Math.random() * cursorEffectComponents.length)
  ];
}

function applyEffect(value) {
  if (value === CURSOR_EFFECT_OFF || value == null) {
    currentComponent.value = null;
  } else if (value === CURSOR_EFFECT_SHUFFLE) {
    currentComponent.value = pickRandomEffect();
  } else {
    currentComponent.value = cursorEffectMap[value] || null;
  }
}

let unsubscribe = null;

onMounted(async () => {
  let saved = null;
  if (tmUtility?.getUserSettings) {
    try {
      saved = await tmUtility.getUserSettings("cursorEffect");
    } catch (e) {
      // ignore
    }
  }
  // Nếu chưa có setting -> mặc định off (mặc định trong default settings)
  applyEffect(saved);

  // Lắng nghe để đổi hiệu ứng tức thì khi chọn trên header/settings
  unsubscribe = eventBus.on(TMEnumEventBus.cursorEffectChanged, (value) => {
    applyEffect(value);
  });
});

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
});
</script>
