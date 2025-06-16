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
  // typeofcode
  typeOfCode = {
    postgresql: 1,
    mysql: 2,
  };
  // loại ngôn ngữ
  language = {
    vi: "vi",
    en: "en",
    zh: "zh",
    ja: "ja",
    ko: "ko",
    ru: "ru",
  };
}

export default new TDEnum();
