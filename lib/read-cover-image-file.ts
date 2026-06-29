export const MAX_COVER_IMAGE_BYTES = 2 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function isCoverImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.has(fileExtension(file.name));
}

function coverImageMime(file: File): string | null {
  if (file.type.startsWith("image/")) return file.type;
  return EXT_TO_MIME[fileExtension(file.name)] ?? null;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the image."));
    };
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

function dataUrlByteLength(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return dataUrl.length;
  const base64 = dataUrl.slice(comma + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image."));
    };
    img.src = url;
  });
}

async function compressImageToDataUrl(
  file: File,
  mime: string,
  maxBytes: number
): Promise<string> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image.");

  const outputMime =
    mime === "image/png" || mime === "image/webp" ? "image/jpeg" : mime;
  let maxSide = Math.min(
    Math.max(img.naturalWidth, img.naturalHeight),
    2400
  );
  let quality = 0.9;

  for (let attempt = 0; attempt < 24; attempt++) {
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = longest > 0 ? maxSide / longest : 1;
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const dataUrl =
      outputMime === "image/jpeg" || outputMime === "image/webp"
        ? canvas.toDataURL(outputMime, quality)
        : canvas.toDataURL(outputMime);

    if (dataUrlByteLength(dataUrl) <= maxBytes) return dataUrl;

    if (quality > 0.45) {
      quality -= 0.08;
      continue;
    }

    maxSide = Math.floor(maxSide * 0.85);
    quality = 0.85;
    if (maxSide < 320) {
      throw new Error(
        "Cover image must be at most 2 MB. Try a smaller or simpler image."
      );
    }
  }

  throw new Error(
    "Cover image must be at most 2 MB. Try a smaller or simpler image."
  );
}

/** Read a cover image as a data URL, resizing/compressing when needed to stay within 2 MB. */
export async function readCoverImageFile(
  file: File,
  maxBytes = MAX_COVER_IMAGE_BYTES
): Promise<string> {
  const mime = coverImageMime(file);
  if (!mime) {
    throw new Error("Please choose an image file (JPEG, PNG, WebP, or GIF).");
  }

  if (mime === "image/gif") {
    if (file.size > maxBytes) {
      throw new Error("Cover image must be at most 2 MB.");
    }
    return fileToDataUrl(file);
  }

  if (file.size <= maxBytes) {
    const dataUrl = await fileToDataUrl(file);
    if (dataUrlByteLength(dataUrl) <= maxBytes) return dataUrl;
  }

  return compressImageToDataUrl(file, mime, maxBytes);
}
