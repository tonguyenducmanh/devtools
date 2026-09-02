import TDGridLinesEffect from "@/views/backgroundEffect/effects/TDGridLinesEffect.vue";
import TDParticleShapeEffect from "@/views/backgroundEffect/effects/TDParticleShapeEffect.vue";
import TDNeonWaveEffect from "@/views/backgroundEffect/effects/TDNeonWaveEffect.vue";
import TDCellularAutomataEffect from "@/views/backgroundEffect/effects/TDCellularAutomataEffect.vue";
import TDWireframeCube3DEffect from "@/views/backgroundEffect/effects/TDWireframeCube3DEffect.vue";
import TDSphereGlobeEffect from "@/views/backgroundEffect/effects/TDSphereGlobeEffect.vue";

/**
 * Map giá trị backgroundEffect (xem TDEnum.backgroundEffectList) sang component hiệu ứng.
 * Dùng chung cho TDDynamicBackgroundEffect.
 */
export const backgroundEffectMap = {
  gridLines: TDGridLinesEffect,
  particleShape: TDParticleShapeEffect,
  neonWave: TDNeonWaveEffect,
  cellularAutomata: TDCellularAutomataEffect,
  wireframeCube3D: TDWireframeCube3DEffect,
  sphereGlobe: TDSphereGlobeEffect,
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
