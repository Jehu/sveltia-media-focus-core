import { parseDocument } from 'yaml';
import { resolveOriginalImagePath } from './asset-path.ts';
import type { FocalPoint } from './focal-geometry.ts';

export const MEDIA_FOCUS_MANIFEST_PATH = 'website/src/data/media-focus.json';

export interface MediaFocusRecord {
  /** Git blob SHA, including the blob header; used by the CMS conflict check. */
  sourceSha: string;
  focal: FocalPoint;
}

export interface MediaFocusManifest {
  version: 1;
  images: Record<string, MediaFocusRecord>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isFocalPoint(value: unknown): value is FocalPoint {
  return (
    isRecord(value) &&
    [value.x, value.y].every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1)
  );
}

/** Parse the raw text so duplicate keys cannot disappear through JSON.parse. */
export function parseMediaFocusManifest(
  source: string,
  sourceFile = MEDIA_FOCUS_MANIFEST_PATH,
): MediaFocusManifest {
  const fail = (message: string): never => {
    throw new Error(`Bildfokus-Manifest ${sourceFile}: ${message}`);
  };
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch (error) {
    return fail(`Ungültiges JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  // JSON is a YAML subset. Its existing parser also checks decoded duplicate keys.
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length) {
    return fail(
      document.errors.some((error) => error.code === 'DUPLICATE_KEY')
        ? 'Doppelte JSON-Schlüssel sind nicht erlaubt.'
        : document.errors[0].message,
    );
  }
  if (!isRecord(data) || data.version !== 1 || !isRecord(data.images)) {
    return fail('version: 1 und images als Objekt erwartet.');
  }
  const images: Record<string, MediaFocusRecord> = {};
  const owners = new Map<string, string>();
  for (const [path, record] of Object.entries(data.images)) {
    let original: string;
    try {
      original = resolveOriginalImagePath(path, sourceFile);
    } catch (error) {
      return fail(error instanceof Error ? error.message : String(error));
    }
    if (owners.has(original)) {
      return fail(`Doppelte Bildpfade „${owners.get(original)}“ und „${path}“ für „${original}“.`);
    }
    if (
      !isRecord(record) ||
      typeof record.sourceSha !== 'string' ||
      !/^[a-f0-9]{40}$/i.test(record.sourceSha) ||
      !isFocalPoint(record.focal)
    ) {
      return fail(
        `„${path}“ benötigt eine 40-stellige Git-Blob-SHA und focal mit x/y von 0 bis 1.`,
      );
    }
    owners.set(original, path);
    images[original] = {
      sourceSha: record.sourceSha.toLowerCase(),
      focal: { x: record.focal.x, y: record.focal.y },
    };
  }
  return { version: 1, images };
}

export function getMediaFocus(
  manifest: MediaFocusManifest,
  originalPath: string,
  sourceFile?: string,
): FocalPoint | undefined {
  return manifest.images[resolveOriginalImagePath(originalPath, sourceFile)]?.focal;
}
