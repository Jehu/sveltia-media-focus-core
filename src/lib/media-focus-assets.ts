import type { ImageMetadata } from 'astro';
import { resolveOriginalImagePath } from './asset-path.ts';

/** Captured before image() resolves a collection's source strings. */
export function captureImageReferences(data: unknown): Record<string, string> {
  const references: Record<string, string> = {};
  const visit = (value: unknown, path: string[]) => {
    if (typeof value === 'string') {
      if (
        !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value) &&
        /\.(?:apng|avif|gif|jpe?g|png|svg|tiff|webp)$/i.test(value)
      ) {
        references[JSON.stringify(path)] = value;
      }
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      for (const [key, child] of Object.entries(value)) visit(child, [...path, key]);
    }
  };
  visit(data, []);
  return references;
}

export function originalPathOf(image: ImageMetadata): string | undefined {
  return (image as ImageMetadata & { originalPath?: string }).originalPath;
}

/** Preserve Astro's imported-image proxy, including its asset-use tracking. */
export function originalImage(
  image: ImageMetadata,
  reference: string,
  sourceFile?: string,
): ImageMetadata {
  const originalPath = resolveOriginalImagePath(reference, sourceFile);
  return new Proxy(image, {
    get: (target, key, receiver) =>
      key === 'originalPath' ? originalPath : Reflect.get(target, key, receiver),
  });
}

/** Bind after getEntry/getCollection, before passing any image to astro:assets. */
export function bindEntryImages<
  T extends { data: Record<string, unknown>; filePath?: string } | undefined,
>(entry: T): T {
  if (!entry) return entry;
  const references = entry.data.__imageSources as Record<string, string> | undefined;
  if (!references)
    throw new Error(
      `Bild-Originalpfade fehlen: ${entry.filePath ?? 'unbekannter Inhalt'}. Content-Cache neu aufbauen.`,
    );
  const visit = (value: unknown, path: string[]): unknown => {
    if (
      !value ||
      (typeof value !== 'object' && typeof value !== 'function') ||
      value instanceof Date
    )
      return value;
    const reference = references[JSON.stringify(path)];
    if ('src' in value && 'width' in value && 'height' in value && 'format' in value) {
      return reference ? originalImage(value as ImageMetadata, reference, entry.filePath) : value;
    }
    if (Array.isArray(value))
      return value.map((child, index) => visit(child, [...path, String(index)]));
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        key === '__imageSources' ? child : visit(child, [...path, key]),
      ]),
    );
  };
  return { ...entry, data: visit(entry.data, []) } as T;
}
