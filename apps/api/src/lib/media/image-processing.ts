import sharp from 'sharp';
import { encode as encodeBlurhash } from 'blurhash';
import { config } from '../../env';

export interface ProcessOriginalOptions {
  maxWidth: number;
  maxHeight: number;
  format: 'webp' | 'avif';
  quality: number;
}

export interface ProcessedOriginal {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: string;
  blurhash: string | null;
}

/**
 * Process original image:
 * - Auto-rotate based on EXIF
 * - Remove EXIF/metadata for privacy
 * - Resize to max dimensions (preserving aspect ratio)
 * - Convert to target format (webp/avif)
 * - Generate blurhash
 */
export async function processOriginalImage(
  inputBuffer: Buffer,
  opts: ProcessOriginalOptions
): Promise<ProcessedOriginal> {
  let pipeline = sharp(inputBuffer, { failOn: 'none' });

  // Auto-rotate based on EXIF orientation
  pipeline = pipeline.rotate();

  // Get metadata before processing
  const metadata = await pipeline.metadata();

  // Resize if needed (preserving aspect ratio)
  pipeline = pipeline.resize(opts.maxWidth, opts.maxHeight, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Remove all metadata for privacy
  pipeline = pipeline.withMetadata({
    exif: {},
    icc: undefined,
  });

  // Convert to target format
  if (opts.format === 'webp') {
    pipeline = pipeline.webp({ quality: opts.quality, effort: 4 });
  } else if (opts.format === 'avif') {
    pipeline = pipeline.avif({ quality: opts.quality, effort: 4 });
  }

  // Process image
  const buffer = await pipeline.toBuffer();

  // Get final dimensions
  const finalMetadata = await sharp(buffer).metadata();
  const width = finalMetadata.width || metadata.width || 0;
  const height = finalMetadata.height || metadata.height || 0;

  // Generate blurhash
  let blurhash: string | null = null;
  try {
    blurhash = await generateBlurhash(buffer, width, height);
  } catch (error) {
    console.error('Failed to generate blurhash:', error);
  }

  const mimeType = opts.format === 'webp' ? 'image/webp' : 'image/avif';

  return {
    buffer,
    width,
    height,
    mimeType,
    blurhash,
  };
}

export interface VariantOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'inside';
  format?: 'webp' | 'jpeg';
  quality?: number;
}

/**
 * Process image variant (resize/crop)
 */
export async function processImageVariant(
  inputBuffer: Buffer,
  opts: VariantOptions
): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: string;
}> {
  // Enforce max limits
  const maxWidth = Math.min(
    opts.width || config.imageMaxWidth,
    config.imageMaxWidth
  );
  const maxHeight = Math.min(
    opts.height || config.imageMaxHeight,
    config.imageMaxHeight
  );

  let pipeline = sharp(inputBuffer, { failOn: 'none' });

  // Resize
  if (opts.width || opts.height) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: opts.fit || 'cover',
      position: 'center',
      withoutEnlargement: false,
    });
  }

  // Convert format
  const format = opts.format || config.imageFormat;
  const quality = opts.quality || config.imageQuality;

  if (format === 'webp') {
    pipeline = pipeline.webp({ quality, effort: 4 });
  } else if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  }

  const buffer = await pipeline.toBuffer();

  // Get final dimensions
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';

  return {
    buffer,
    width,
    height,
    mimeType,
  };
}

/**
 * Generate blurhash from image buffer
 */
async function generateBlurhash(
  buffer: Buffer,
  width: number,
  height: number
): Promise<string | null> {
  if (!width || !height) {
    return null;
  }

  // Resize to small size for blurhash (faster)
  const small = await sharp(buffer)
    .resize(32, 32, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = small;

  // Generate blurhash (4x3 components is a good balance)
  const hash = encodeBlurhash(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4,
    3
  );

  return hash;
}

/**
 * Validate if buffer is a valid image
 */
export async function validateImage(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer, { failOn: 'none' }).metadata();
    return !!(metadata.width && metadata.height && metadata.format);
  } catch {
    return false;
  }
}

/**
 * Get image metadata without processing
 */
export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
} | null> {
  try {
    const metadata = await sharp(buffer, { failOn: 'none' }).metadata();
    if (!metadata.width || !metadata.height || !metadata.format) {
      return null;
    }
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size || buffer.length,
    };
  } catch {
    return null;
  }
}
