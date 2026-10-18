import QrScanner from "qr-scanner";
import { QR_CONFIG } from "./TMQRCodeConfig.js";
import { scanQRFiles } from "./TMQRCodeWorkerClient.js";

/**
 * Tiện ích đọc QR từ ảnh.
 *
 * Kiến trúc sau khi tách phần nặng sang Web Worker:
 *   - jsQR + tiền xử lý ảnh (nhiều tỉ lệ / nhiều bộ lọc / xoay ảnh) chạy trong
 *     `TMQRCodeWorker` → main thread không bị đứng hình, vẫn click/switch tab được.
 *   - QrScanner và ZXing giữ làm fallback chạy trên main thread vì cần DOM
 *     (`HTMLImageElement`/canvas). Chúng chỉ chạy khi worker không đọc được,
 *     và QrScanner bản thân đã có worker jsQR riêng nên cũng khá nhẹ.
 */

/**
 * Utility function to validate file format
 */
function isValidImageFormat(file) {
  return QR_CONFIG.supportedFormats.includes(file.type.toLowerCase());
}

/**
 * Helper function to create image element from file
 */
function createImageElementFromFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Delay function for retry mechanism
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Đọc 1 ảnh bằng QrScanner (fallback, cần DOM)
 */
async function readQRWithQrScanner(file) {
  try {
    if (!isValidImageFormat(file)) {
      throw new Error(`Unsupported file format: ${file.type}`);
    }

    // Try different scan options
    const scanOptions = [
      { returnDetailedScanResult: true },
      {
        returnDetailedScanResult: true,
        scanRegion: { x: 0, y: 0, width: 1, height: 1 },
      },
      { returnDetailedScanResult: false },
    ];

    for (const options of scanOptions) {
      try {
        const result = await QrScanner.scanImage(file, options);

        const qrData = result?.data || result;
        if (qrData && typeof qrData === "string" && qrData.trim()) {
          return qrData;
        }
      } catch (optionError) {
        console.error(`QrScanner option failed:`, optionError.message);
      }
    }

    return null;
  } catch (error) {
    console.error("QrScanner error:", error.message || error);
    throw error;
  }
}

/**
 * ZXing-js fallback with multiple attempts (fallback, cần DOM)
 */
async function readQRWithZXing(file) {
  try {
    const { BrowserQRCodeReader, BrowserMultiFormatReader } = await import(
      "@zxing/library"
    );

    const readers = [new BrowserQRCodeReader(), new BrowserMultiFormatReader()];

    const img = await createImageElementFromFile(file);

    for (const reader of readers) {
      try {
        const result = await reader.decodeFromImageElement(img);
        if (result && result.getText()) {
          return result.getText();
        }
      } catch (readerError) {
        console.warn(`ZXing reader failed:`, readerError.message);
      }
    }

    return null;
  } catch (error) {
    console.warn("ZXing error:", error);
    return null;
  }
}

/**
 * Thử lần lượt các fallback trên main thread (QrScanner → ZXing)
 * @param {Blob|File} blob
 * @returns {Promise<string|null>}
 */
async function readQRWithFallback(blob) {
  const scanMethods = [
    { name: "QrScanner", fn: readQRWithQrScanner },
    { name: "ZXing", fn: readQRWithZXing },
  ];

  for (const method of scanMethods) {
    try {
      const result = await method.fn(blob);
      if (result && typeof result === "string" && result.trim()) {
        return result.trim();
      }
    } catch (error) {
      console.warn(`${method.name} error:`, error.message || error);
    }
  }
  return null;
}

/**
 * Đọc QR bằng pipeline nặng (jsQR + tiền xử lý) chạy trong Web Worker.
 * @param {Blob|File} blob
 * @returns {Promise<{text: string|null, blob: Blob}>} text hoặc blob để chạy fallback
 */
async function decodeInWorker(blob) {
  try {
    const { results } = await scanQRFiles([blob], { scanMultiple: false });
    const part = results?.[0]?.parts?.[0];
    if (part) {
      return { text: part.text, blob: part.fallback ? part.fallback.blob : null };
    }
  } catch (error) {
    console.warn("Worker đọc QR lỗi:", error);
  }
  return { text: null, blob };
}

/**
 * Đọc QR từ 1 file: ưu tiên worker (jsQR), sau đó mới tới fallback main thread.
 * @param {File|Blob} file
 * @returns {Promise<string|null>}
 */
async function readQRFromFile(file) {
  const { maxRetries, retryDelay } = QR_CONFIG.retryOptions;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { text, blob } = await decodeInWorker(file);
    if (text) {
      return text;
    }
    const fallbackText = await readQRWithFallback(blob || file);
    if (fallbackText) {
      return fallbackText;
    }
    if (attempt < maxRetries) {
      await delay(retryDelay);
    }
  }
  return null;
}

/**
 * Quét nhiều file, giữ nguyên thứ tự kết quả.
 * @param {File} file
 * @param {boolean} scanMultiple 1 ảnh có thể chứa nhiều QR
 * @returns {Promise<string[]>}
 */
async function readMultipleQRsFromFile(file, scanMultiple) {
  try {
    const { results } = await scanQRFiles([file], { scanMultiple: !!scanMultiple });
    const parts = results?.[0]?.parts || [];
    const texts = [];
    for (const part of parts) {
      if (part.text) {
        texts.push(part.text);
        continue;
      }
      // worker không đọc được phần này → chạy fallback cần DOM trên main thread
      const fallbackText = await readQRWithFallback(part.fallback?.blob || file);
      if (fallbackText) {
        texts.push(fallbackText);
      }
    }
    return texts;
  } catch (error) {
    console.error(`Error processing ${file.name}:`, error);
    throw error;
  }
}

/**
 * Xử lý nhiều file với progress tracking.
 *
 * Không tự chia batch ở đây nữa: `TMQRCodeWorkerClient` đã có worker pool tự
 * chia tải, thêm batch ở đây chỉ làm thêm một lớp queue không cần thiết.
 */
async function batchProcessQRFiles(files, options = {}, onProgress = null) {
  const total = files.length;

  return Promise.all(
    files.map(async (file, index) => {
      let result = null;
      let error = null;

      try {
        result = await readMultipleQRsFromFile(file, options.scanMultipleQR);
        if (!result || result.length === 0) {
          error = new Error("No QR code detected");
        }
      } catch (err) {
        error = err;
        console.error(`Error processing ${file.name}:`, err);
      }

      if (onProgress && typeof onProgress === "function") {
        onProgress({
          current: index + 1,
          total,
          file,
          result,
          error,
          progress: ((index + 1) / total) * 100,
        });
      }

      return { file, result, error };
    }),
  );
}

/**
 * Main function: Enhanced version of imagesQRToText
 */
export async function imagesQRToText(uploadArea, options = {}) {
  const {
    onProgress = null,
    returnDetailedResults = false,
    validateResults = true,
  } = options;

  if (!uploadArea || typeof uploadArea.getFileSelected !== "function") {
    console.warn(
      "uploadArea không hợp lệ hoặc không có method getFileSelected",
    );
    return [];
  }

  try {
    const allFiles = uploadArea.getFileSelected();

    if (!allFiles || allFiles.length === 0) {
      return [];
    }

    // Filter supported files
    const supportedFiles = allFiles.filter((file) => {
      if (!isValidImageFormat(file)) {
        console.warn(
          `Skipping unsupported file format: ${file.name} (${file.type})`,
        );
        return false;
      }
      return true;
    });

    if (supportedFiles.length === 0) {
      console.warn("Không có file nào có định dạng được hỗ trợ");
      return [];
    }

    // Process files (heavy work chạy trong worker)
    const batchResults = await batchProcessQRFiles(supportedFiles, options, onProgress);

    // Format results (sử dụng flatMap để trải phẳng mảng nếu 1 ảnh có nhiều result)
    const results = batchResults.flatMap(({ file, result, error }) => {
      // Nếu không tìm thấy QR nào hoặc bị lỗi
      if (!result || result.length === 0) {
        const baseResult = {
          file: file.name,
          success: false,
          text: null,
          error: error ? error.message : null,
        };
        return returnDetailedResults ? { ...baseResult, fileSize: file.size, fileType: file.type, lastModified: file.lastModified } : [baseResult];
      }

      // Nếu tìm thấy 1 hoặc nhiều QR, tách ra thành các item độc lập
      return result.map(text => {
        const baseResult = {
          file: file.name,
          success: true,
          text: text,
          error: null,
        };
        return returnDetailedResults ? { ...baseResult, fileSize: file.size, fileType: file.type, lastModified: file.lastModified } : baseResult;
      });
    });

    // Filter successful results if validation is enabled
    const successfulResults = validateResults
      ? results.filter((r) => r.success).map((r) => r.text)
      : results;
    return returnDetailedResults ? results : successfulResults;
  } catch (error) {
    console.error("❌ Lỗi trong quá trình xử lý:", error);
    throw error;
  }
}

/**
 * Utility function to get QR scanner statistics
 */
export function getQRScannerInfo() {
  return {
    supportedFormats: QR_CONFIG.supportedFormats,
    scannerMethods: ["jsQR (worker)", "QrScanner", "ZXing"],
    maxDimensions: QR_CONFIG.canvasOptions,
    retryOptions: QR_CONFIG.retryOptions,
    preprocessOptions: QR_CONFIG.preprocessOptions,
    version: "2.2.0",
  };
}

// Export individual methods for advanced usage
export {
  readQRFromFile,
  readMultipleQRsFromFile,
  readQRWithQrScanner,
  readQRWithZXing,
  readQRWithFallback,
  batchProcessQRFiles,
  QR_CONFIG,
};