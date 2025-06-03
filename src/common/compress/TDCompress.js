import tdEnum from "@/common/TDEnum.js";
import tdUtility from "@/common/TDUtility.js";

/**
 * class handle nghiệp vụ nén text
 */
class TDCompress {
  /**
   * nén text
   */
  async compressText(inputSource, typeCompress = tdEnum.compressType.gzip) {
    const encoder = new TextEncoder();
    const inputStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(inputSource));
        controller.close();
      },
    });

    const compressedStream = inputStream.pipeThrough(
      new CompressionStream(typeCompress)
    );
    const compressedResponse = new Response(compressedStream);
    let result = await compressedResponse.arrayBuffer();
    let resultText = tdUtility.arrayBufferToBase64(result);
    return resultText;
  }

  /**
   * giải nén text
   */
  async decompressText(inputSource, typeCompress = tdEnum.compressType.gzip) {
    let buffer = tdUtility.base64ToArrayBuffer(inputSource);
    const decompressedStream = new Response(buffer).body.pipeThrough(
      new DecompressionStream(typeCompress)
    );

    const decompressedResponse = new Response(decompressedStream);
    const text = await decompressedResponse.text();
    return text;
  }
}

export default new TDCompress();
