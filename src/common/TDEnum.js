import { EnumCacheConfig } from "@/common/TDEnumCacheConfig.js";

class TDEnum {
  // cài đặt chủ đề của app
  theme = {
    dark: "dark",
    light: "light",
  };
  cacheType = {
    local: 0,
    session: 1,
    indexedDB: 2,
  };
  cacheConfig = EnumCacheConfig;
  buttonType = {
    primary: "primary",
    secondary: "secondary",
  };
  radioGroupType = {
    horizontal: "horizontal",
    vertical: "vertical",
  };
}

export default new TDEnum();
