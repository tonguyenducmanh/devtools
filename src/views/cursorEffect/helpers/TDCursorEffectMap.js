import TDCursorTrailEffect from "@/views/cursorEffect/effects/TDCursorTrailEffect.vue";
import TDCursorRingEffect from "@/views/cursorEffect/effects/TDCursorRingEffect.vue";
import TDCursorSparklesEffect from "@/views/cursorEffect/effects/TDCursorSparklesEffect.vue";

/**
 * Map giá trị cursorEffect (xem TDEnum.cursorEffectList) sang component hiệu ứng chuột.
 * Dùng chung cho TDDynamicCursorEffect.
 */
export const cursorEffectMap = {
  trail: TDCursorTrailEffect,
  ring: TDCursorRingEffect,
  sparkles: TDCursorSparklesEffect,
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
