/**
 * Server-side image compression utility.
 * Lazily loads Sharp when available, with graceful raw image fallback for serverless (Vercel) environments.
 */

let sharpModule: any = null;
let sharpChecked = false;

async function getSharp() {
  if (!sharpChecked) {
    sharpChecked = true;
    try {
      const m = await import("sharp");
      sharpModule = m.default || m;
    } catch (e) {
      console.warn("[ServerImageCompression] Sharp native module unavailable in serverless runtime, using raw image fallback.");
      sharpModule = null;
    }
  }
  return sharpModule;
}

export async function compressServerImageBase64(
  dataUrlOrBase64: string | null | undefined,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 60,
  format: "webp" | "jpeg" = "webp"
): Promise<string> {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== "string") return "";

  // If it's a URL or SVG, return as is
  if (dataUrlOrBase64.startsWith("http://") || dataUrlOrBase64.startsWith("https://") || dataUrlOrBase64.startsWith("/assets/")) {
    return dataUrlOrBase64;
  }
  if (dataUrlOrBase64.includes("image/svg+xml")) {
    return dataUrlOrBase64;
  }

  // Extract base64 payload
  const match = dataUrlOrBase64.match(/^data:([^;]+);base64,(.+)$/);
  const base64Data = match ? match[2] : dataUrlOrBase64;

  // If tiny (< 1.5 KB), don't process
  if (base64Data.length < 1500) {
    return dataUrlOrBase64;
  }

  try {
    const sharp = await getSharp();
    if (!sharp) {
      return dataUrlOrBase64;
    }

    const inputBuffer = Buffer.from(base64Data, "base64");
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    const pipeline = image.resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true
    });

    let outputBuffer: Buffer;
    let outMime: string;

    if (format === "webp") {
      outputBuffer = await pipeline.webp({ quality, effort: 4 }).toBuffer();
      outMime = "image/webp";
    } else {
      outputBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      outMime = "image/jpeg";
    }

    if (outputBuffer.length < inputBuffer.length) {
      return `data:${outMime};base64,${outputBuffer.toString("base64")}`;
    }

    if ((metadata.width || 0) <= maxWidth && (metadata.height || 0) <= maxHeight) {
      return dataUrlOrBase64;
    }

    return `data:${outMime};base64,${outputBuffer.toString("base64")}`;
  } catch (err) {
    console.warn("[ServerImageCompression] Warning: Compression fallback:", err);
    return dataUrlOrBase64;
  }
}

export async function compressEmployeeRecord<T extends Record<string, any>>(emp: T): Promise<T> {
  if (!emp || typeof emp !== "object") return emp;
  const result: any = { ...emp };

  if (result.photoUrl && typeof result.photoUrl === "string" && result.photoUrl.startsWith("data:image")) {
    result.photoUrl = await compressServerImageBase64(result.photoUrl, 260, 260, 60, "webp");
  }

  if (result.passportOrNationalCardUrl && typeof result.passportOrNationalCardUrl === "string" && result.passportOrNationalCardUrl.startsWith("data:image")) {
    result.passportOrNationalCardUrl = await compressServerImageBase64(result.passportOrNationalCardUrl, 800, 800, 58, "webp");
  }

  if (result.iqamaUrl && typeof result.iqamaUrl === "string" && result.iqamaUrl.startsWith("data:image")) {
    result.iqamaUrl = await compressServerImageBase64(result.iqamaUrl, 800, 800, 58, "webp");
  }

  return result;
}
