/**
 * CMS-Bildpfade normalisieren, damit Astros `image()`-Resolver sie findet.
 *
 * Der CMS-Upload/Picker liefert Pfade, die absolut zum Repository gemeint
 * sind — z. B. `/website/src/assets/uploads/treatments/foo.jpg`. Astros
 * `image()` löst `/`-beginnende IDs aber relativ zum Astro-Root (`website/`)
 * auf (vite-plugin-content-assets.js übergibt die ID an Vites Resolver,
 * unterhalb des Roots nicht → `ImageNotFound`.
 *
 * Der CMS-Wert ist kanonisch `/website/src/assets/…`; die zusätzlichen
 * Schreibweisen bleiben für bestehende Daten akzeptiert und werden alle in die
 * root-relative Form `/src/assets/…` überführt. Eintragsrelative
 * `../../assets/…`, Remote-URLs und Nicht-Strings bleiben unverändert —
 * Markdown-/MDX-Bilder verwenden weiterhin ihren eigenen relativen Vertrag.
 */

/** Root-relativer Prefix, den Astros `image()`-Resolver akzeptiert. */
const REPO_ASSET_PREFIXES = [
  '/website/src/assets/',
  './website/src/assets/',
  '/src/assets/',
  './src/assets/',
] as const;

/**
 * Normalisiert einen Repository-Asset-Pfad nach `/src/assets/…`.
 * Strings ohne bekannten Asset-Prefix und alle anderen Werte bleiben unangetastet.
 */
export function normalizeRepoAssetPath<T>(value: T): T | string {
  if (typeof value !== 'string') return value;

  for (const prefix of REPO_ASSET_PREFIXES) {
    if (value.startsWith(prefix)) {
      return '/src/assets/' + value.slice(prefix.length);
    }
  }
  return value;
}

function localPath(value: string): string {
  if (!value || /[\\\x00-\x1f:?#]/.test(value) || value.startsWith('//')) {
    throw new Error(`Ungültiger Bildpfad „${value}“: lokaler Originalpfad erwartet.`);
  }
  return value.replace(/^(\.\/)+/, '');
}

function collapseSegments(value: string): string {
  const parts: string[] = [];
  for (const part of value.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!parts.length) throw new Error(`Bildpfad „${value}“ verlässt das Repository.`);
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join('/');
}

/** Logical repository paths, not host paths or optimized image URLs. */
export function resolveOriginalImagePath(value: string, sourceFile?: string): string {
  let path = localPath(value);
  if (/^\/?_astro\//.test(path)) {
    throw new Error(`Bildpfad „${value}“ ist ein generiertes Derivat, kein Original.`);
  }
  if (/^\/?website\//.test(path)) {
    path = path.replace(/^\//, '');
  } else if (/^\/?src\//.test(path)) {
    path = 'website/' + path.replace(/^\//, '');
  } else if (path.startsWith('/')) {
    path = 'website/public' + path;
  } else {
    if (!sourceFile) throw new Error(`Bildpfad „${value}“ benötigt eine Quelldatei.`);
    let source = localPath(sourceFile).replace(/^\//, '');
    if (source.startsWith('src/')) source = 'website/' + source;
    source = collapseSegments(source);
    if (!source.startsWith('website/') || sourceFile.endsWith('/')) {
      throw new Error(`Bildpfad „${value}“: ungültige Quelldatei „${sourceFile}“.`);
    }
    path = source.slice(0, source.lastIndexOf('/') + 1) + path;
  }
  const original = collapseSegments(path);
  if (
    !/^website\/(src\/assets|public)\//.test(original) ||
    original.startsWith('website/public/_astro/') ||
    !/\.(apng|avif|gif|jpe?g|png|svg|tiff|webp)$/i.test(original)
  ) {
    throw new Error(`Ungültiger Bildpfad „${value}“: Original in src/assets oder public erwartet.`);
  }
  return original;
}
