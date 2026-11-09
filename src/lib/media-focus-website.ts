import type { ImageMetadata } from 'astro';
import manifestSource from '../data/media-focus.json?raw';
import { parseMediaFocusManifest, getMediaFocus } from './media-focus.ts';
import { originalPathOf } from './media-focus-assets.ts';
import type { FocalPoint } from './focal-geometry.ts';

const manifest = parseMediaFocusManifest(manifestSource);

export const focusForOriginal = (originalPath: string) => getMediaFocus(manifest, originalPath);

export function imageFocus(image: ImageMetadata): FocalPoint | undefined {
  const original = originalPathOf(image);
  if (!original) throw new Error(`Bild ohne ausdrücklichen Originalpfad: ${image.src}`);
  return focusForOriginal(original);
}

export function focusAttributes(image: ImageMetadata) {
  const focal = imageFocus(image);
  return {
    'data-original-image': originalPathOf(image),
    'data-focal-x': focal?.x,
    'data-focal-y': focal?.y,
  };
}

export function backgroundFocusAttributes(image: ImageMetadata) {
  return {
    ...focusAttributes(image),
    'data-focal-background': '',
    'data-original-width': image.width,
    'data-original-height': image.height,
  };
}

/** A page contains only points for its explicit original markers, never the full manifest. */
export function pageImageFocus(html: string): Record<string, FocalPoint> {
  const points: Record<string, FocalPoint> = {};
  for (const [, encoded] of html.matchAll(/\bdata-original-image="([^"]*)"/g)) {
    const original = encoded.replace(
      /&(?:amp|quot|apos|lt|gt|#(\d+)|#x([\da-f]+));/gi,
      (entity, decimal, hex) => {
        if (decimal || hex)
          return String.fromCodePoint(parseInt(decimal ?? hex, decimal ? 10 : 16));
        return (
          (
            { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' } as Record<
              string,
              string
            >
          )[entity] ?? entity
        );
      },
    );
    const focal = manifest.images[original]?.focal;
    if (focal) points[original] = focal;
  }
  return points;
}
