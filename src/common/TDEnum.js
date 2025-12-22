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
    CURL: 2,
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
    Collection: 1,
    History: 2,
    Setting: 3,
  };
}

export default new TDEnum();
