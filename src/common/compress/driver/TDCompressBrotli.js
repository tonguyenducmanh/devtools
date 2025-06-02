import tdUtility from "@/common/TDUtility.js";

/**
 * class handle nén bằng thuật toán Brotli
 */
class TDCompressBrotli {
  constructor() {}

  /**
   * nén text
   */
  async compressText(inputSource) {
    const encoder = new TextEncoder();
    const inputStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(inputSource));
        controller.close();
      },
    });

    const compressedStream = inputStream.pipeThrough(
      new CompressionStream("gzip")
    );
    const compressedResponse = new Response(compressedStream);
    let result = await compressedResponse.arrayBuffer();
    let resultText = tdUtility.arrayBufferToBase64(result);
    return resultText;
  }

  /**
   * giải nén text
   */
  async decompressText(inputSource) {
    let buffer = tdUtility.base64ToArrayBuffer(inputSource);
    const decompressedStream = new Response(buffer).body.pipeThrough(
      new DecompressionStream("gzip")
    );

    const decompressedResponse = new Response(decompressedStream);
    const text = await decompressedResponse.text();
    return text;
  }
}

export default new TDCompressBrotli();
