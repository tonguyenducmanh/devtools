import { EnumCacheConfig } from "@/common/cache/TDEnumCacheConfig.js";
import { TDEnumEventBus } from "@/common/event/TDEnumEventBus.js";

class TDEnum {
  // cài đặt chủ đề của app
  theme = {
    dark: "dark",
    light: "light",
  };
  // loại cache
  cacheType = {
    local: 0,
    session: 1,
    indexedDB: 2,
    inMemory: 3,
  };
  // config cache
  cacheConfig = EnumCacheConfig;
  // loại event global
  eventGlobal = TDEnumEventBus;
  buttonType = {
    primary: "primary",
    secondary: "secondary",
  };
  // loại radio option
  coordinateAxes = {
    horizontal: "horizontal",
    vertical: "vertical",
  };
  // loại nén
  compressType = {
    gzip: "gzip",
    deflate: "deflate",
    deflateRaw: "deflate-raw",
  };
  // typeofcode
  typeOfCode = {
    postgresql: 1,
    mysql: 2,
  };
  // loại ngôn ngữ
  language = {
    vi: "vi",
    en: "en",
  };
  checkboxType = {
    checkbox: 1,
    switch: 2,
  };
  /**
   * Thông tin info của câu lệnh
   */
  APIInfoOption = {
    header: 1,
    body: 2,
  };
  /**
   * Các hướng mũi tên
   */
  Direction = {
    top: 1,
    left: 2,
    bottom: 3,
    right: 4,
  };
  /**
   * Các chế độ của tool API
   */
  APIMode = {
    Normal: 1,
    ProMode: 3,
  };
  /**
   * Các chế độ absolute style chung
   */
  AbsolutePositionStyle = {
    Unset: 1,
    TopLeft: 2,
    TopRight: 3,
    BottomLeft: 4,
    BottomRight: 5,
    Top100Left: 6,
    Top100Right: 7,
    Bottom100Left: 8,
    Bottom100Right: 9,
  };
  BorderRadiusPosition = {
    TopLeft: 1,
    TopRight: 2,
    BottomLeft: 3,
    BottomRight: 4,
  };
  APISidebarOption = {
    Help: 0,
    Collection: 1,
    History: 2,
    Setting: 3,
  };
  ToolSidebarOption = {
    Help: 0,
    Setting: 1,
    History: 2,
  };
  RemoteDesktopSidebarOption = {
    Help: 0,
    Collection: 1,
    Setting: 2,
  };
  MindMapSidebarOption = {
    Setting: 0,
    History: 1,
  };
  PostgreSQLTemplateSidebarOption = {
    Template: 0,
    Setting: 1,
  };
  TerminalSidebarOption = {
    Help: 0,
    Collection: 1,
    Setting: 2,
  };
  LoadingType = {
    Normal: "normal",
    Meme: "meme",
  };
  PostgreSQLQuerySidebarOption = {
    Help: 0,
    Setting: 1,
    Connection: 2,
    SQLSave: 3,
  };
  PostreSQLConnectionImportType = {
    NpgSQLDotNet: 0,
    PgxGo: 1,
  };
  // danh sách theme monaco editor
  monacoThemeList = [
    { label: "Blender", value: "blender" },
    { label: "Monokai", value: "monokai" },
    { label: "VS", value: "vs" },
    { label: "VS Dark", value: "vs-dark" },
    { label: "GitHub Light", value: "github-light" },
    { label: "GitHub Dark", value: "github-dark" },
    { label: "Solarized Light", value: "solarized-light" },
    { label: "Solarized Dark", value: "solarized-dark" },
    { label: "One Light", value: "one-light" },
    { label: "One Dark", value: "one-dark" },
    { label: "Gruvbox Light", value: "gruvbox-light" },
    { label: "Gruvbox Dark", value: "gruvbox-dark" },
    { label: "Catppuccin Latte", value: "catppuccin-light" },
    { label: "Catppuccin Mocha", value: "catppuccin-dark" },
    { label: "Synthwave84", value: "synthwave84" },
    { label: "Tokyo Night", value: "tokyo-night" },
    { label: "Dracula", value: "dracula" },
  ];
  // danh sách hiệu ứng nền
  backgroundEffectList = [
    {
      labelKey: "i18nUserSettings.backgroundEffect.shuffle",
      value: "shuffle",
    },
    {
      labelKey: "i18nUserSettings.backgroundEffect.gridLines",
      value: "gridLines",
    },
    {
      labelKey: "i18nUserSettings.backgroundEffect.particleShape",
      value: "particleShape",
    },
    {
      labelKey: "i18nUserSettings.backgroundEffect.neonWave",
      value: "neonWave",
    },
    {
      labelKey: "i18nUserSettings.backgroundEffect.cellularAutomata",
      value: "cellularAutomata",
    },
    {
      labelKey: "i18nUserSettings.backgroundEffect.wireframeCube3D",
      value: "wireframeCube3D",
    },
    {
      labelKey: "i18nUserSettings.backgroundEffect.sphereGlobe",
      value: "sphereGlobe",
    },
  ];
}

export default new TDEnum();
