/**
 * Image Compression Utility for Employee Directory Photos and Documents.
 * Resizes and compresses Base64 and File objects in the browser using HTML5 Canvas.
 * Produces crisp, lightweight WebP / JPEG images under 40-70KB.
 */

/**
 * Compresses an image File directly before uploading or saving.
 */
export async function compressImageFile(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.65,
  mimeType: string = "image/webp"
): Promise<string> {
  if (!file) return "";
  
  // If it's an SVG, read directly as base64
  if (file.type === "image/svg+xml") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawBase64 = e.target?.result as string;
      if (!rawBase64) {
        resolve("");
        return;
      }
      try {
        const compressed = await compressImageBase64(rawBase64, maxWidth, maxHeight, quality, mimeType);
        resolve(compressed);
      } catch (err) {
        console.warn("Fallback to raw image:", err);
        resolve(rawBase64);
      }
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses a Base64 image string to a specified max width/height and quality.
 * Prefers image/webp for maximum compression savings, falling back to image/jpeg.
 */
export function compressImageBase64(
  base64Str: string | null | undefined,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.65,
  preferredMime: string = "image/webp"
): Promise<string> {
  if (!base64Str) return Promise.resolve("");
  if (!base64Str.startsWith("data:image")) {
    return Promise.resolve(base64Str);
  }

  // If already an SVG or tiny data url, skip
  if (base64Str.includes("image/svg+xml") || base64Str.length < 2000) {
    return Promise.resolve(base64Str);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate width and height preserving aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        console.warn("Canvas context is null during compression, returning original.");
        resolve(base64Str);
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      try {
        // Try preferred format (webp)
        let output = canvas.toDataURL(preferredMime, quality);
        if (!output.startsWith(`data:${preferredMime}`)) {
          // Browser did not support preferred mime, fallback to JPEG
          output = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(output);
      } catch (e) {
        const fallback = canvas.toDataURL("image/jpeg", quality);
        resolve(fallback);
      }
    };

    img.onerror = (err) => {
      console.warn("Failed to load image for compression, returning original:", err);
      resolve(base64Str);
    };
  });
}

/**
 * Helper to determine if an employee has large, uncompressed images (e.g. Base64 strings > 60KB)
 */
export function needsCompression(emp: {
  photoUrl?: string;
  passportOrNationalCardUrl?: string;
  iqamaUrl?: string;
}): boolean {
  const PHOTO_LIMIT = 40000; // ~30KB raw char length
  const DOC_LIMIT = 80000;   // ~60KB raw char length

  if (emp.photoUrl && emp.photoUrl.startsWith("data:image") && emp.photoUrl.length > PHOTO_LIMIT) {
    return true;
  }
  if (
    emp.passportOrNationalCardUrl &&
    emp.passportOrNationalCardUrl.startsWith("data:image") &&
    emp.passportOrNationalCardUrl.length > DOC_LIMIT
  ) {
    return true;
  }
  if (emp.iqamaUrl && emp.iqamaUrl.startsWith("data:image") && emp.iqamaUrl.length > DOC_LIMIT) {
    return true;
  }

  return false;
}
