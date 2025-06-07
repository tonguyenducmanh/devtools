import jsQR from "jsqr";

/**
 * Tạo QR code từ text
 * @param uploadArea ref trỏ tới TDUpload
 */
export async function convertQRCode(uploadArea) {
  // Lazy-load module
  if (uploadArea && typeof uploadArea.getFileSelected === "function") {
    let allFiles = uploadArea.getFileSelected();
    let decodePromises = Array.from(allFiles).map((file) => {
      return new Promise((resolve) => {
        let reader = new FileReader();
        reader.onload = function (event) {
          let imageData = event.target.result;
          let img = new Image();
          img.onload = function () {
            let canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            let imageDataObj = ctx.getImageData(0, 0, img.width, img.height);
            let code = jsQR(
              imageDataObj.data,
              imageDataObj.width,
              imageDataObj.height
            );
            resolve(code ? code.data : null);
          };
          img.src = imageData;
        };
        reader.readAsDataURL(file);
      });
    });

    // Đợi tất cả ảnh xử lý xong
    let results = await Promise.all(decodePromises);
    // Lọc kết quả hợp lệ
    let resultSucess = results.filter(Boolean);
    return resultSucess;
  }
}
