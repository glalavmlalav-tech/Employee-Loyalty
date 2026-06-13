/**
 * Image Compression Utility for Employee Directory Photos and Documents.
 * Resizes and compresses Base64 encoded images to drastically reduce Firestore document size.
 * Reduces 2MB-5MB photos down to 15KB-80KB, lowering Firestore reads/writes usage by ~95-98%.
 */

/**
 * Compresses a Base64 image string to a specified max width/height and quality.
 * Uses HTML5 Canvas for fast, offline browser-side compression.
 */
export function compressImageBase64(
  base64Str: string | null | undefined,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.6
): Promise<string> {
  if (!base64Str) return Promise.resolve("");
  if (!base64Str.startsWith("data:image")) {
    // If it's a placeholder or already a standard URL, don't modify it
    return Promise.resolve(base64Str);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate the width and height, preserving the aspect ratio
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
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.warn("Canvas context is null during compression, returning original.");
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // JPEG allows premium quality settings for compression
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => {
      console.warn("Failed to load image for compression, returning original:", err);
      resolve(base64Str);
    };
  });
}

/**
 * Helper to determine if an employee has large, uncompressed images in Firestore (e.g. Base64 strings > 100KB)
 */
export function needsCompression(emp: {
  photoUrl?: string;
  passportOrNationalCardUrl?: string;
  iqamaUrl?: string;
}): boolean {
  const PHOTO_LIMIT = 80000; // ~60KB raw char length
  const DOC_LIMIT = 150000;  // ~110KB raw char length

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
