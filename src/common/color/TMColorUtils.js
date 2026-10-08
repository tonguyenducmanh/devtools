// Color utility functions for image color extraction and conversion

/**
 * chuyển đổi RGB sang HEX
 * @param {*} r màu đỏ
 * @param {*} g màu xanh lá
 * @param {*} b màu xanh dương
 * @returns
 */
export function rgbToHex(r, g, b) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
}

/**
 * chuyển đổi RGB sang HSL
 * @param {*} r màu đỏ
 * @param {*} g màu xanh lá
 * @param {*} b màu xanh dương
 * @returns
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * lấy khoảng cách giữa 2 màu RGB
 * @param {*} color1 màu 1
 * @param {*} color2 màu 2
 * @returns
 */
export function getColorDistance(color1, color2) {
  const rDiff = color1.r - color2.r;
  const gDiff = color1.g - color2.g;
  const bDiff = color1.b - color2.b;

  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

/**
 * trích xuất màu sắc từ hình ảnh
 * @param {*} image ảnh
 * @param {*} maxColors số lượng màu tối đa cần trích xuất
 * @returns danh sách màu sắc
 * @description Sử dụng k-means clustering để tìm màu sắc chủ đạo trong hình ảnh.
 *              Tối đa 7 màu sắc được trích xuất, đảm bảo ít nhất 3 màu.
 *              Hình ảnh được giảm kích thước để tăng tốc độ xử lý.
 *              Mỗi màu sắc được trả về dưới dạng đối tượng với các thuộc tính rgb, hex, hsl.
 */
export function extractImageColors(image, maxColors = 7) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Resize image for faster processing
    const maxSize = 200;
    const ratio = Math.min(maxSize / image.width, maxSize / image.height);
    canvas.width = image.width * ratio;
    canvas.height = image.height * ratio;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Sample pixels (every 4th pixel for performance)
    const colors = [];
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      // Skip transparent pixels
      if (a < 128) continue;

      colors.push({ r, g, b });
    }

    // Use k-means clustering to find dominant colors
    const dominantColors = kMeansColors(
      colors,
      Math.min(maxColors, colors.length)
    );

    // Convert to our color format
    const palette = dominantColors.map((color) => ({
      rgb: color,
      hex: rgbToHex(color.r, color.g, color.b),
      hsl: rgbToHsl(color.r, color.g, color.b),
    }));

    // Ensure minimum 3 colors
    while (palette.length < 3 && palette.length < colors.length) {
      // Add random colors from the original set
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      palette.push({
        rgb: randomColor,
        hex: rgbToHex(randomColor.r, randomColor.g, randomColor.b),
        hsl: rgbToHsl(randomColor.r, randomColor.g, randomColor.b),
      });
    }

    resolve(palette.slice(0, maxColors));
  });
}

/**
 * thuật toán k-means để phân cụm màu sắc
 * @param {*} colors danh sách màu sắc
 * @param {*} k số lượng cụm màu cần tìm
 * @returns
 */
function kMeansColors(colors, k) {
  if (colors.length === 0) return [];
  if (colors.length <= k) return colors;

  // Initialize centroids randomly
  let centroids = [];
  for (let i = 0; i < k; i++) {
    centroids.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  let iterations = 0;
  const maxIterations = 20;

  while (iterations < maxIterations) {
    // Assign each color to the nearest centroid
    const clusters = Array(k)
      .fill()
      .map(() => []);

    colors.forEach((color) => {
      let minDistance = Infinity;
      let nearestCentroid = 0;

      centroids.forEach((centroid, index) => {
        const distance = getColorDistance(color, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCentroid = index;
        }
      });

      clusters[nearestCentroid].push(color);
    });

    // Update centroids
    const newCentroids = clusters.map((cluster) => {
      if (cluster.length === 0) return centroids[0]; // fallback

      const sum = cluster.reduce(
        (acc, color) => ({
          r: acc.r + color.r,
          g: acc.g + color.g,
          b: acc.b + color.b,
        }),
        { r: 0, g: 0, b: 0 }
      );

      return {
        r: Math.round(sum.r / cluster.length),
        g: Math.round(sum.g / cluster.length),
        b: Math.round(sum.b / cluster.length),
      };
    });

    // Check for convergence
    let converged = true;
    for (let i = 0; i < k; i++) {
      if (getColorDistance(centroids[i], newCentroids[i]) > 1) {
        converged = false;
        break;
      }
    }

    centroids = newCentroids;
    iterations++;

    if (converged) break;
  }

  return centroids;
}
