import TMCursorTrailEffect from "@/views/cursorEffect/effects/TMCursorTrailEffect.vue";
import TMCursorRingEffect from "@/views/cursorEffect/effects/TMCursorRingEffect.vue";
import TMCursorSparklesEffect from "@/views/cursorEffect/effects/TMCursorSparklesEffect.vue";
import TMCursorPyramidEffect from "@/views/cursorEffect/effects/TMCursorPyramidEffect.vue";
import TMCursorStarEffect from "@/views/cursorEffect/effects/TMCursorStarEffect.vue";
import TMCursorConfettiEffect from "@/views/cursorEffect/effects/TMCursorConfettiEffect.vue";
import TMCursorHexagonEffect from "@/views/cursorEffect/effects/TMCursorHexagonEffect.vue";

/**
 * Map giá trị cursorEffect (xem TMEnum.cursorEffectList) sang component hiệu ứng chuột.
 * Dùng chung cho TMDynamicCursorEffect.
 */
export const cursorEffectMap = {
  trail: TMCursorTrailEffect,
  ring: TMCursorRingEffect,
  sparkles: TMCursorSparklesEffect,
  pyramid: TMCursorPyramidEffect,
  star: TMCursorStarEffect,
  confetti: TMCursorConfettiEffect,
  hexagon: TMCursorHexagonEffect,
};

/**
 * Giá trị đặc biệt: tắt hiệu ứng chuột
 */
export const CURSOR_EFFECT_OFF = "off";

/**
 * Giá trị đặc biệt: luân phiên thay đổi ngẫu nhiên giữa các hiệu ứng chuột
 */
export const CURSOR_EFFECT_SHUFFLE = "shuffle";

/**
 * Danh sách các component hiệu ứng chuột (không tính off/shuffle)
 */
export const cursorEffectComponents = Object.values(cursorEffectMap);
