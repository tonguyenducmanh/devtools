import jsQR from "jsqr";
import QrScanner from "qr-scanner";

/**
 * Đọc QR code từ một file ảnh sử dụng jsQR
 * @param {File} file - File ảnh chứa QR code
 * @returns {Promise<string|null>} - Text của QR code hoặc null
 */
async function readQRWithJsQR(file) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          const imageData = event.target.result;
          const img = new Image();
          img.onload = function () {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0);
              const imageDataObj = ctx.getImageData(
                0,
                0,
                img.width,
                img.height
              );
              const code = jsQR(
                imageDataObj.data,
                imageDataObj.width,
                imageDataObj.height
              );
              resolve(code ? code.data : null);
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
 * Đọc QR code từ một file ảnh sử dụng QrScanner
 * @param {File} file - File ảnh chứa QR code
 * @returns {Promise<string|null>} - Text của QR code hoặc null
 */
async function readQRWithQrScanner(file) {
  try {
    // QrScanner.scanImage có thể nhận File object trực tiếp
    const result = await QrScanner.scanImage(file);
    return result || null;
  } catch (error) {
    console.warn("QrScanner error:", error);
    return null;
  }
}

/**
 * Đọc QR code từ một file ảnh, thử jsQR trước, nếu không được thì dùng QrScanner
 * @param {File} file - File ảnh chứa QR code
 * @returns {Promise<string|null>} - Text của QR code hoặc null
 */
async function readQRFromFile(file) {
  // Thử jsQR trước
  let result = await readQRWithJsQR(file);

  // Nếu jsQR không có kết quả, thử QrScanner
  if (!result) {
    console.log("jsQR failed, trying QrScanner for file:", file.name);
    result = await readQRWithQrScanner(file);
  }

  return result;
}

/**
 * Đọc ra text từ danh sách ảnh QR
 * @param uploadArea ref trỏ tới TDUpload
 * @returns {Promise<string[]>} - Mảng các text QR code đã đọc được
 */
export async function imagesQRToText(uploadArea) {
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

    // Xử lý từng file một cách tuần tự để tránh quá tải
    const results = [];

    for (const file of allFiles) {
      console.log(`Đang xử lý file: ${file.name}`);
      const qrText = await readQRFromFile(file);

      if (qrText) {
        results.push(qrText);
        console.log(`Đọc thành công QR từ ${file.name}:`, qrText);
      } else {
        console.warn(`Không thể đọc QR từ file: ${file.name}`);
      }
    }

    console.log(
      `Kết quả: đọc được ${results.length}/${allFiles.length} QR codes`
    );
    return results;
  } catch (error) {
    console.error("Lỗi trong quá trình xử lý:", error);
    return [];
  }
}
