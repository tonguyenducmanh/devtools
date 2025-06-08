import tdEnum from "@/common/TDEnum.js";

/**
 * Cấu hình cache
 * @typedef {Object} CacheConfig
 * @property {string} KeyFormat - Định dạng khóa (có thể chứa {id})
 * @property {number} CacheLevel - Cấp độ cache (local, session, indexedDB)
 * @property {number} ExpireTime - Thời gian hết hạn (0 là không hết hạn)
 * @property {string} Note - Ghi chú về cache
 */

export const TDCacheConfig = {
  Theme: {
    KeyFormat: "Theme",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cài đặt chủ đề của app",
  },
  QRHistory: {
    KeyFormat: "QRHistory",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "lịch sử quét mã",
  },
  JSONToExcelHistory: {
    KeyFormat: "JSONToExcelHistory",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "lịch sử json xuất ra excel",
  },
  IsShowSidebar: {
    KeyFormat: "IsShowSidebar",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cài đặt hiển thị sidebar",
  },
  OneTimeAuthen: {
    KeyFormat: "OneTimeAuthen_{id}",
    CacheLevel: tdEnum.cacheType.indexedDB,
    ExpireTime: 0,
    Note: "cài đặt xác thực",
  },
  LastOneTimeAuthenUserName: {
    KeyFormat: "LastOneTimeAuthenUserName",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "tên đăng nhập xác thực một lần cuối cùng",
  },
  LastOneTimeAuthenPassword: {
    KeyFormat: "LastOneTimeAuthenPassword",
    CacheLevel: tdEnum.cacheType.inMemory,
    ExpireTime: 0,
    Note: "mật khẩu đăng nhập xác thực theo user, chỉ được phép lưu trong mem",
  },
};
