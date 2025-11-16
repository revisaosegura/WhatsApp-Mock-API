import { storagePut } from "./storage";
import crypto from "crypto";
import path from "path";

export interface UploadedMedia {
  url: string;
  key: string;
  mimeType: string;
  size: number;
  filename: string;
}

/**
 * Upload media file to S3
 */
export async function uploadMediaToS3(
  userId: number,
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadedMedia> {
  // Generate unique key to prevent enumeration
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  const safeFilename = `${baseName}-${randomSuffix}${ext}`;
  
  const fileKey = `user_${userId}/media/${safeFilename}`;

  // Upload to S3
  const { url } = await storagePut(fileKey, fileBuffer, mimeType);

  return {
    url,
    key: fileKey,
    mimeType,
    size: fileBuffer.length,
    filename: safeFilename,
  };
}

/**
 * Validate file type for WhatsApp
 */
export function validateMediaType(mimeType: string): {
  valid: boolean;
  type: "image" | "video" | "audio" | "document" | null;
  error?: string;
} {
  // Image types
  if (mimeType.startsWith("image/")) {
    const allowedImages = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedImages.includes(mimeType)) {
      return { valid: true, type: "image" };
    }
    return { valid: false, type: null, error: "Tipo de imagem não suportado" };
  }

  // Video types
  if (mimeType.startsWith("video/")) {
    const allowedVideos = ["video/mp4", "video/3gpp", "video/quicktime"];
    if (allowedVideos.includes(mimeType)) {
      return { valid: true, type: "video" };
    }
    return { valid: false, type: null, error: "Tipo de vídeo não suportado" };
  }

  // Audio types
  if (mimeType.startsWith("audio/")) {
    const allowedAudios = [
      "audio/mpeg",
      "audio/mp4",
      "audio/ogg",
      "audio/aac",
      "audio/amr",
    ];
    if (allowedAudios.includes(mimeType)) {
      return { valid: true, type: "audio" };
    }
    return { valid: false, type: null, error: "Tipo de áudio não suportado" };
  }

  // Document types
  const allowedDocuments = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/zip",
    "application/x-rar-compressed",
  ];

  if (allowedDocuments.includes(mimeType)) {
    return { valid: true, type: "document" };
  }

  return { valid: false, type: null, error: "Tipo de arquivo não suportado" };
}

/**
 * Validate file size (max 16MB for WhatsApp)
 */
export function validateFileSize(size: number): { valid: boolean; error?: string } {
  const MAX_SIZE = 16 * 1024 * 1024; // 16MB
  if (size > MAX_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: 16MB`,
    };
  }
  return { valid: true };
}
