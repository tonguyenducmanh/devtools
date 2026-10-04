import tmEnum from "@/common/TMEnum.js";
import tmUtility from "@/common/TMUtility.js";

/**
 * class handle nghiệp vụ nén text
 */
class TMCompress {
  /**
   * nén text
   */
  async compressText(inputSource, typeCompress = tmEnum.compressType.gzip) {
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
    let resultText = tmUtility.arrayBufferToBase64(result);
    return resultText;
  }

  /**
   * giải nén text
   */
  async decompressText(inputSource, typeCompress = tmEnum.compressType.gzip) {
    let buffer = tmUtility.base64ToArrayBuffer(inputSource);
    const decompressedStream = new Response(buffer).body.pipeThrough(
      new DecompressionStream(typeCompress)
    );

    const decompressedResponse = new Response(decompressedStream);
    const text = await decompressedResponse.text();
    return text;
  }
}

export default new TMCompress();
