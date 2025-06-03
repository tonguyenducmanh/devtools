import { EnumCacheConfig } from "@/common/cache/TDEnumCacheConfig.js";

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
  buttonType = {
    primary: "primary",
    secondary: "secondary",
  };
  // loại radio option
  radioGroupType = {
    horizontal: "horizontal",
    vertical: "vertical",
  };
  // loại nén
  compressType = {
    gzip: "gzip",
    deflate: "deflate",
    deflateRaw: "deflate-raw",
  };
}

export default new TDEnum();
