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
  QRHistory: {
    KeyFormat: "QRHistory",
    CacheLevel: tdEnum.cacheType.indexedDB,
    ExpireTime: 0,
    Note: "lịch sử quét mã",
  },
  APIHistory: {
    KeyFormat: "APIHistory",
    CacheLevel: tdEnum.cacheType.indexedDB,
    ExpireTime: 0,
    Note: "lịch sử gọi API",
  },
  APIPromodeHistory: {
    KeyFormat: "APIPromodeHistory",
    CacheLevel: tdEnum.cacheType.indexedDB,
    ExpireTime: 0,
    Note: "lịch sử gọi API",
  },
  JSONToExcelHistory: {
    KeyFormat: "JSONToExcelHistory",
    CacheLevel: tdEnum.cacheType.indexedDB,
    ExpireTime: 0,
    Note: "lịch sử json xuất ra excel",
  },
  JSONToPostgreSQLHistory: {
    KeyFormat: "JSONToPostgreSQLHistory",
    CacheLevel: tdEnum.cacheType.indexedDB,
    ExpireTime: 0,
    Note: "lịch sử json convert thành postgresql",
  },
  CodeFormatterHistory: {
    KeyFormat: "CodeFormatterHistory",
    CacheLevel: tdEnum.cacheType.indexedDB,
    ExpireTime: 0,
    Note: "lịch sử format code",
  },
  HTMLPreviewHistory: {
    KeyFormat: "HTMLPreviewHistory",
    CacheLevel: tdEnum.cacheType.indexedDB,
    ExpireTime: 0,
    Note: "lịch sử preview HTML",
  },
  APICollection: {
    KeyFormat: "APICollection",
    CacheLevel: tdEnum.cacheType.indexedDB,
    ExpireTime: 0,
    Note: "collection API được lưu bởi user",
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
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "mật khẩu đăng nhập xác thực theo user, chỉ được phép lưu trong mem",
  },
  APIConfigLayout: {
    KeyFormat: "APIConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool api",
  },
  APIMockConfigLayout: {
    KeyFormat: "APIMockConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool mock api",
  },
  UserSettings: {
    KeyFormat: "UserSettings",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình thiết lập của user",
  },
  QRCodeToTextConfigLayout: {
    KeyFormat: "QRCodeToTextConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool QR code to text",
  },
  TextToQRCodeConfigLayout: {
    KeyFormat: "TextToQRCodeConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool text to QR code",
  },
  TextGeneratorConfigLayout: {
    KeyFormat: "TextGeneratorConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool text generator",
  },
  TextManipulationConfigLayout: {
    KeyFormat: "TextManipulationConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool text manipulation",
  },
  TextCompressConfigLayout: {
    KeyFormat: "TextCompressConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool text compress",
  },
  CodeFormatterConfigLayout: {
    KeyFormat: "CodeFormatterConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool code formatter",
  },
  CompareCodeConfigLayout: {
    KeyFormat: "CompareCodeConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool compare code",
  },
  CosinSimilarityConfigLayout: {
    KeyFormat: "CosinSimilarityConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool cosin similarity",
  },
  ColorPickerConfigLayout: {
    KeyFormat: "ColorPickerConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool color picker",
  },
  JSONToExcelConfigLayout: {
    KeyFormat: "JSONToExcelConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool JSON to Excel",
  },
  JSONToModelConfigLayout: {
    KeyFormat: "JSONToModelConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool JSON to Model",
  },
  JSONToOneLineStringConfigLayout: {
    KeyFormat: "JSONToOneLineStringConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool JSON to One Line String",
  },
  JSONToPostgreSQLConfigLayout: {
    KeyFormat: "JSONToPostgreSQLConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool JSON to PostgreSQL",
  },
  Base64ToImageConfigLayout: {
    KeyFormat: "Base64ToImageConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool Base64 to Image",
  },
  ImageToBase64ConfigLayout: {
    KeyFormat: "ImageToBase64ConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool Image to Base64",
  },
  OneTimePasswordConfigLayout: {
    KeyFormat: "OneTimePasswordConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool One Time Password",
  },
  OpticalCharacterRecognitionConfigLayout: {
    KeyFormat: "OpticalCharacterRecognitionConfigLayout",
    CacheLevel: tdEnum.cacheType.local,
    ExpireTime: 0,
    Note: "cache cấu hình layout tool Optical Character Recognition",
  },
};
