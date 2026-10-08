export function hexToRgb(value) {
  if (!value) return "0,0,0";
  let v = String(value).trim();

  let rgbMatch = v.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgbMatch) {
    return `${Math.round(rgbMatch[1])},${Math.round(rgbMatch[2])},${Math.round(rgbMatch[3])}`;
  }

  if (v.startsWith("#")) {
    v = v.slice(1);
    if (v.length === 3) {
      v = v
        .split("")
        .map(function (c) {
          return c + c;
        })
        .join("");
    }
    const num = parseInt(v, 16);
    if (isNaN(num)) return "0,0,0";
    return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`;
  }

  return "0,0,0";
}

function getLuminance(value) {
  const rgb = hexToRgb(value).split(",").map(Number);
  const normalized = rgb.map(function (c) {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return (
    0.2126 * normalized[0] + 0.7152 * normalized[1] + 0.0722 * normalized[2]
  );
}

function readVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getThemeEffectColors() {
  const bg = readVar("--bg-main-color") || "#282828";
  const primary =
    readVar("--text-primary-color") || readVar("--text-color") || "#f2f2f2";
  const secondary =
    readVar("--text-secondary-color") || readVar("--text-tertiary-color") || "#969696";
  const accent =
    readVar("--focus-color") ||
    readVar("--trail-cursor-color") ||
    readVar("--btn-primary-bg") ||
    "#58a6ff";

  const trail =
    readVar("--trail-cursor-color") ||
    readVar("--focus-color") ||
    readVar("--btn-primary-bg") ||
    "#58a6ff";

  return {
    bg,
    primary,
    secondary,
    accent,
    trail,
    isDark: getLuminance(bg) < 0.5,
    rgb: {
      bg: hexToRgb(bg),
      primary: hexToRgb(primary),
      secondary: hexToRgb(secondary),
      accent: hexToRgb(accent),
      trail: hexToRgb(trail),
    },
  };
}
