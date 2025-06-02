import tdEnum from "@/common/TDEnum.js";
import TDCompressGzip from "@/common/compress/driver/TDCompressGzip.js";
import TDCompressBrotli from "@/common/compress/driver/TDCompressBrotli.js";

/**
 * class handle nghiệp vụ nén text
 */
class TDCompress {
  /**
   * lấy ra driver xử lý nén
   */
  getCompressType(typeCompress) {
    switch (typeCompress) {
      case tdEnum.compressType.gzip:
        return TDCompressGzip;
      case tdEnum.compressType.brotli:
        return TDCompressBrotli;
      default:
        return TDCompressGzip;
    }
  }

  /**
   * nén text
   */
  async compressText(inputSource, typeCompress = tdEnum.compressType.gzip) {
    let compressDriver = this.getCompressType(typeCompress);
    let result = null;
    if (compressDriver) {
      result = await compressDriver.compressText(inputSource);
    } else {
      result = inputSource;
    }
    return result;
  }

  /**
   * giải nén text
   */
  async decompressText(inputSource, typeCompress = tdEnum.compressType.gzip) {
    let compressDriver = this.getCompressType(typeCompress);
    let result = null;
    if (compressDriver) {
      result = await compressDriver.decompressText(inputSource);
    } else {
      result = inputSource;
    }
    return result;
  }
}

export default new TDCompress();
