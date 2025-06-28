import jsQR from "jsqr";
import QrScanner from "qr-scanner";

/**
 * Enhanced configuration for QR scanning optimization
 */
const QR_CONFIG = {
  // QrScanner options for better performance
  qrScannerOptions: {
    returnDetailedScanResult: true,
    highlightScanRegion: false,
    highlightCodeOutline: false,
    preferredCamera: "environment",
    maxScansPerSecond: 5,
  },

  // Canvas optimization for jsQR
  canvasOptions: {
    maxWidth: 2048,
    maxHeight: 2048,
    minWidth: 200,
    minHeight: 200,
    quality: 1.0,
  },

  // Image preprocessing options
  preprocessOptions: {
    enableSharpening: true,
    enableNoiseReduction: true,
    enableContrastEnhancement: true,
    enableBinarization: true,
    enableRotationCorrection: true,
  },

  // Supported image formats
  supportedFormats: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/gif",
  ],

  // Retry configuration
  retryOptions: {
    maxRetries: 3,
    retryDelay: 0,
  },
};

/**
 * Utility function to validate file format
 */
function isValidImageFormat(file) {
  return QR_CONFIG.supportedFormats.includes(file.type.toLowerCase());
}

/**
 * Apply image sharpening filter
 */
function applySharpenFilter(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new Uint8ClampedArray(data);

  // Sharpening kernel
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        // RGB channels only
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const idx = (y * width + x) * 4 + c;
        output[idx] = Math.max(0, Math.min(255, sum));
      }
    }
  }

  return new ImageData(output, width, height);
}

/**
 * Apply noise reduction using median filter
 */
function applyNoiseReduction(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const values = [];
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            values.push(data[idx]);
          }
        }
        values.sort((a, b) => a - b);
        const idx = (y * width + x) * 4 + c;
        output[idx] = values[4]; // median of 9 values
      }
    }
  }

  return new ImageData(output, width, height);
}

/**
 * Enhance contrast using histogram stretching
 */
function enhanceContrast(imageData) {
  const data = imageData.data;
  const length = data.length;

  // Find min and max values for each channel
  let minR = 255,
    maxR = 0,
    minG = 255,
    maxG = 0,
    minB = 255,
    maxB = 0;

  for (let i = 0; i < length; i += 4) {
    minR = Math.min(minR, data[i]);
    maxR = Math.max(maxR, data[i]);
    minG = Math.min(minG, data[i + 1]);
    maxG = Math.max(maxG, data[i + 1]);
    minB = Math.min(minB, data[i + 2]);
    maxB = Math.max(maxB, data[i + 2]);
  }

  // Stretch histogram
  const rangeR = maxR - minR || 1;
  const rangeG = maxG - minG || 1;
  const rangeB = maxB - minB || 1;

  for (let i = 0; i < length; i += 4) {
    data[i] = Math.round(((data[i] - minR) / rangeR) * 255);
    data[i + 1] = Math.round(((data[i + 1] - minG) / rangeG) * 255);
    data[i + 2] = Math.round(((data[i + 2] - minB) / rangeB) * 255);
  }

  return imageData;
}

/**
 * Apply adaptive binarization (Otsu's method)
 */
function applyAdaptiveBinarization(imageData) {
  const data = imageData.data;
  const length = data.length;

  // Convert to grayscale and build histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < length; i += 4) {
    const gray = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    );
    histogram[gray]++;
  }

  // Otsu's method to find optimal threshold
  let total = length / 4;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let mB = 0;
  let mF = 0;
  let max = 0;
  let between = 0;
  let threshold1 = 0;
  let threshold2 = 0;

  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;

    sumB += i * histogram[i];
    mB = sumB / wB;
    mF = (sum - sumB) / wF;
    between = wB * wF * (mB - mF) * (mB - mF);

    if (between >= max) {
      threshold1 = i;
      if (between > max) {
        threshold2 = i;
      }
      max = between;
    }
  }

  const threshold = (threshold1 + threshold2) / 2;

  // Apply binarization
  for (let i = 0; i < length; i += 4) {
    const gray = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    );
    const binary = gray > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = binary;
  }

  return imageData;
}

/**
 * Preprocess image for better QR detection
 */
function preprocessImage(canvas, ctx, options = QR_CONFIG.preprocessOptions) {
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (options.enableNoiseReduction) {
    imageData = applyNoiseReduction(imageData);
    ctx.putImageData(imageData, 0, 0);
  }

  if (options.enableSharpening) {
    imageData = applySharpenFilter(imageData);
    ctx.putImageData(imageData, 0, 0);
  }

  if (options.enableContrastEnhancement) {
    imageData = enhanceContrast(imageData);
    ctx.putImageData(imageData, 0, 0);
  }

  return imageData;
}

/**
 * Get optimal dimensions with multiple scale factors
 */
function getMultipleScales(img) {
  const { maxWidth, maxHeight, minWidth, minHeight } = QR_CONFIG.canvasOptions;
  const { width, height } = img;

  const scales = [];

  // Original size (if within limits)
  if (
    width <= maxWidth &&
    height <= maxHeight &&
    width >= minWidth &&
    height >= minHeight
  ) {
    scales.push({ width, height, scale: 1 });
  }

  // Scaled down versions
  const maxScale = Math.min(maxWidth / width, maxHeight / height);
  const minScale = Math.max(minWidth / width, minHeight / height);

  [1.0, 0.8, 0.6, 0.5, 0.4, 0.3].forEach((factor) => {
    const scale = Math.min(maxScale, factor);
    if (scale >= minScale && scale !== 1) {
      scales.push({
        width: Math.floor(width * scale),
        height: Math.floor(height * scale),
        scale,
      });
    }
  });

  // Ensure we have at least one scale
  if (scales.length === 0) {
    const scale = Math.min(maxScale, Math.max(minScale, 0.5));
    scales.push({
      width: Math.floor(width * scale),
      height: Math.floor(height * scale),
      scale,
    });
  }

  return scales;
}

/**
 * Try multiple rotations of the image
 */
function tryRotations(canvas, ctx, originalImageData) {
  const rotations = [0, 90, 180, 270];
  const results = [];

  for (const rotation of rotations) {
    try {
      // Reset canvas
      ctx.putImageData(originalImageData, 0, 0);

      if (rotation !== 0) {
        // Apply rotation
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);

        // Redraw
        ctx.putImageData(originalImageData, 0, 0);
      }

      const rotatedImageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      results.push({ rotation, imageData: rotatedImageData });

      // Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } catch (error) {
      console.warn(`Rotation ${rotation}° failed:`, error);
    }
  }

  return results;
}

/**
 * Enhanced QR code reader using jsQR with advanced preprocessing
 */
async function readQRWithJsQR(file) {
  return new Promise((resolve) => {
    try {
      if (!isValidImageFormat(file)) {
        console.warn(`Unsupported file format: ${file.type}`);
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          const imageData = event.target.result;
          const img = new Image();

          img.onload = function () {
            try {
              const scales = getMultipleScales(img);

              // Try different scales
              for (const scale of scales) {
                console.log(
                  `Trying jsQR with scale: ${scale.scale} (${scale.width}x${scale.height})`
                );

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d", {
                  willReadFrequently: true,
                });

                canvas.width = scale.width;
                canvas.height = scale.height;

                // High quality rendering
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                // Draw resized image
                ctx.drawImage(img, 0, 0, scale.width, scale.height);

                // Store original for rotation attempts
                const originalImageData = ctx.getImageData(
                  0,
                  0,
                  scale.width,
                  scale.height
                );

                // Try without preprocessing first
                const attempts = [
                  {
                    name: "original",
                    preprocess: false,
                    options: { inversionAttempt: "attemptBoth" },
                  },
                  {
                    name: "original-invert",
                    preprocess: false,
                    options: { inversionAttempt: "onlyInvert" },
                  },
                  {
                    name: "original-no-invert",
                    preprocess: false,
                    options: { inversionAttempt: "dontInvert" },
                  },
                ];

                // Add preprocessing attempts
                if (QR_CONFIG.preprocessOptions.enableContrastEnhancement) {
                  attempts.push(
                    {
                      name: "contrast",
                      preprocess: { enableContrastEnhancement: true },
                      options: { inversionAttempt: "attemptBoth" },
                    },
                    {
                      name: "contrast-invert",
                      preprocess: { enableContrastEnhancement: true },
                      options: { inversionAttempt: "onlyInvert" },
                    }
                  );
                }

                if (QR_CONFIG.preprocessOptions.enableSharpening) {
                  attempts.push(
                    {
                      name: "sharpen",
                      preprocess: { enableSharpening: true },
                      options: { inversionAttempt: "attemptBoth" },
                    },
                    {
                      name: "sharpen-contrast",
                      preprocess: {
                        enableSharpening: true,
                        enableContrastEnhancement: true,
                      },
                      options: { inversionAttempt: "attemptBoth" },
                    }
                  );
                }

                if (QR_CONFIG.preprocessOptions.enableBinarization) {
                  attempts.push(
                    {
                      name: "binary",
                      preprocess: { enableBinarization: true },
                      options: { inversionAttempt: "dontInvert" },
                    },
                    {
                      name: "binary-invert",
                      preprocess: { enableBinarization: true },
                      options: { inversionAttempt: "onlyInvert" },
                    }
                  );
                }

                // Try each preprocessing method
                for (const attempt of attempts) {
                  try {
                    // Reset to original
                    ctx.putImageData(originalImageData, 0, 0);

                    let processedImageData = originalImageData;

                    if (attempt.preprocess) {
                      processedImageData = preprocessImage(
                        canvas,
                        ctx,
                        attempt.preprocess
                      );
                    } else {
                      processedImageData = ctx.getImageData(
                        0,
                        0,
                        scale.width,
                        scale.height
                      );
                    }

                    // Try normal orientation
                    const code = jsQR(
                      processedImageData.data,
                      processedImageData.width,
                      processedImageData.height,
                      attempt.options
                    );
                    if (code && code.data) {
                      console.log(
                        `✅ jsQR success with ${attempt.name} at scale ${scale.scale}:`,
                        code.data
                      );
                      resolve(code.data);
                      return;
                    }

                    // Try rotations if enabled
                    if (QR_CONFIG.preprocessOptions.enableRotationCorrection) {
                      const rotations = tryRotations(
                        canvas,
                        ctx,
                        processedImageData
                      );
                      for (const rotation of rotations) {
                        if (rotation.rotation === 0) continue; // Already tried

                        const rotatedCode = jsQR(
                          rotation.imageData.data,
                          rotation.imageData.width,
                          rotation.imageData.height,
                          attempt.options
                        );
                        if (rotatedCode && rotatedCode.data) {
                          console.log(
                            `✅ jsQR success with ${attempt.name} + ${rotation.rotation}° rotation at scale ${scale.scale}:`,
                            rotatedCode.data
                          );
                          resolve(rotatedCode.data);
                          return;
                        }
                      }
                    }
                  } catch (error) {
                    console.warn(`jsQR ${attempt.name} attempt failed:`, error);
                  }
                }
              }

              resolve(null);
            } catch (error) {
              console.warn("jsQR processing error:", error);
              resolve(null);
            }
          };

          img.onerror = () => {
            console.warn("Image load error for jsQR");
            resolve(null);
          };

          img.src = imageData;
        } catch (error) {
          console.warn("jsQR setup error:", error);
          resolve(null);
        }
      };

      reader.onerror = () => {
        console.warn("FileReader error for jsQR");
        resolve(null);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.warn("jsQR general error:", error);
      resolve(null);
    }
  });
}

/**
 * Enhanced QR code reader using QrScanner with better options
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
        console.log(`Trying QrScanner with options:`, options);
        const result = await QrScanner.scanImage(file, options);

        const qrData = result?.data || result;
        if (qrData && typeof qrData === "string" && qrData.trim()) {
          console.log("✅ QrScanner success:", qrData);
          return qrData;
        }
      } catch (optionError) {
        console.warn(`QrScanner option failed:`, optionError.message);
      }
    }

    return null;
  } catch (error) {
    console.warn("QrScanner error:", error.message || error);
    throw error;
  }
}

/**
 * ZXing-js fallback with multiple attempts
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
          console.log("✅ ZXing success:", result.getText());
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
 * Enhanced QR code reader with multiple fallback methods and advanced retry logic
 */
async function readQRFromFile(file) {
  const { maxRetries, retryDelay } = QR_CONFIG.retryOptions;

  // Define scanning methods in order of preference (QrScanner first for better performance)
  const scanMethods = [
    { name: "QrScanner", fn: readQRWithQrScanner },
    { name: "jsQR", fn: readQRWithJsQR },
    { name: "ZXing", fn: readQRWithZXing },
  ];

  console.log(
    `🔍 Starting QR scan for file: ${file.name} (${file.size} bytes, ${file.type})`
  );

  for (const method of scanMethods) {
    console.log(`📋 Trying ${method.name} for file: ${file.name}`);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await method.fn(file);

        if (result && typeof result === "string" && result.trim()) {
          console.log(
            `✅ ${method.name} success on attempt ${attempt + 1}:`,
            result.substring(0, 100) + (result.length > 100 ? "..." : "")
          );
          return result.trim();
        }

        if (attempt < maxRetries) {
          console.log(
            `${method.name} attempt ${
              attempt + 1
            } failed, retrying in ${retryDelay}ms...`
          );
          await delay(retryDelay);
        }
      } catch (error) {
        console.warn(
          `${method.name} attempt ${attempt + 1} error:`,
          error.message
        );

        if (attempt < maxRetries) {
          await delay(retryDelay);
        }
      }
    }

    console.log(`❌ ${method.name} failed after ${maxRetries + 1} attempts`);
  }

  console.log(`❌ All methods failed for file: ${file.name}`);
  return null;
}

/**
 * Batch process multiple files with progress tracking
 */
async function batchProcessQRFiles(files, onProgress = null) {
  const results = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let result = null;
    let error = null;

    try {
      console.log(`📄 Processing file ${i + 1}/${total}: ${file.name}`);
      result = await readQRFromFile(file);

      if (!result) {
        error = new Error("No QR code detected");
      }
    } catch (err) {
      error = err;
      console.error(`Error processing ${file.name}:`, err);
    }

    results.push({ file, result, error });

    // Call progress callback if provided
    if (onProgress && typeof onProgress === "function") {
      onProgress({
        current: i + 1,
        total,
        file,
        result,
        error,
        progress: ((i + 1) / total) * 100,
      });
    }
  }

  return results;
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
      "uploadArea không hợp lệ hoặc không có method getFileSelected"
    );
    return [];
  }

  try {
    const allFiles = uploadArea.getFileSelected();

    if (!allFiles || allFiles.length === 0) {
      console.log("Không có file nào được chọn");
      return [];
    }

    console.log(`🚀 Bắt đầu xử lý ${allFiles.length} files...`);

    // Filter supported files
    const supportedFiles = allFiles.filter((file) => {
      if (!isValidImageFormat(file)) {
        console.warn(
          `Skipping unsupported file format: ${file.name} (${file.type})`
        );
        return false;
      }
      return true;
    });

    if (supportedFiles.length === 0) {
      console.warn("Không có file nào có định dạng được hỗ trợ");
      return [];
    }

    // Process files in batch
    const batchResults = await batchProcessQRFiles(supportedFiles, onProgress);

    // Format results
    const results = batchResults.map(({ file, result, error }) => {
      const baseResult = {
        file: file.name,
        success: !!result,
        text: result || null,
        error: error ? error.message : null,
      };

      if (returnDetailedResults) {
        return {
          ...baseResult,
          fileSize: file.size,
          fileType: file.type,
          lastModified: file.lastModified,
        };
      }

      return baseResult;
    });

    // Filter successful results if validation is enabled
    const successfulResults = validateResults
      ? results.filter((r) => r.success).map((r) => r.text)
      : results;

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `✅ Hoàn thành: ${successCount}/${allFiles.length} QR codes đã được đọc thành công`
    );

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
    scannerMethods: ["QrScanner", "jsQR", "ZXing"],
    maxDimensions: QR_CONFIG.canvasOptions,
    retryOptions: QR_CONFIG.retryOptions,
    preprocessOptions: QR_CONFIG.preprocessOptions,
    version: "2.1.0",
  };
}

// Export individual methods for advanced usage
export {
  readQRFromFile,
  readQRWithJsQR,
  readQRWithQrScanner,
  batchProcessQRFiles,
  QR_CONFIG,
};
