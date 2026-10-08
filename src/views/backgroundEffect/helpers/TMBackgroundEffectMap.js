import TMGridLinesEffect from "@/views/backgroundEffect/effects/TMGridLinesEffect.vue";
import TMParticleShapeEffect from "@/views/backgroundEffect/effects/TMParticleShapeEffect.vue";
import TMNeonWaveEffect from "@/views/backgroundEffect/effects/TMNeonWaveEffect.vue";

/**
 * Map giá trị backgroundEffect (xem TMEnum.backgroundEffectList) sang component hiệu ứng.
 * Dùng chung cho TMDynamicBackgroundEffect.
 */
export const backgroundEffectMap = {
  gridLines: TMGridLinesEffect,
  particleShape: TMParticleShapeEffect,
  neonWave: TMNeonWaveEffect,
};

/**
 * Giá trị đặc biệt: luân phiên thay đổi liên tục giữa các hiệu ứng
 */
export const BACKGROUND_EFFECT_SHUFFLE = "shuffle";

/**
 * Giá trị đặc biệt: tắt hiệu ứng nền (không render gì)
 */
export const BACKGROUND_EFFECT_OFF = "off";

/**
 * Danh sách các component hiệu ứng (chỉ các hiệu ứng đơn, không tính shuffle)
 */
export const backgroundEffectComponents = Object.values(backgroundEffectMap);
