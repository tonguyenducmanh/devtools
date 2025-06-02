/**
 * class handle nén bằng thuật toán Gzip
 */
class TDCompressGzip {
  constructor() {}
  /**
   * Chuyển ArrayBuffer -> Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }

  /**
   * Chuyển Base64 string -> ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
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
    let resultText = this.arrayBufferToBase64(result);
    return resultText;
  }

  /**
   * giải nén text
   */
  async decompressText(inputSource) {
    let buffer = this.base64ToArrayBuffer(inputSource);
    const decompressedStream = new Response(buffer).body.pipeThrough(
      new DecompressionStream("gzip")
    );

    const decompressedResponse = new Response(decompressedStream);
    const text = await decompressedResponse.text();
    return text;
  }
}

export default new TDCompressGzip();
