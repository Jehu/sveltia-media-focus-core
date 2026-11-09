import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEDIA_FOCUS_MANIFEST_PATH, parseMediaFocusManifest } from './media-focus.ts';

/** Server-only entry point; the shared parser and resolver never touch files. */
export async function loadMediaFocusManifest(websiteRoot: URL) {
  const root = fileURLToPath(websiteRoot);
  let source: string;
  try {
    source = await readFile(
      resolve(root, MEDIA_FOCUS_MANIFEST_PATH.slice('website/'.length)),
      'utf8',
    );
  } catch (error) {
    throw new Error(
      `Bildfokus-Manifest ${MEDIA_FOCUS_MANIFEST_PATH} konnte nicht gelesen werden.`,
      { cause: error },
    );
  }
  const manifest = parseMediaFocusManifest(source);
  const actualRoot = await realpath(root);
  for (const original of Object.keys(manifest.images)) {
    try {
      const actual = await realpath(resolve(root, original.slice('website/'.length)));
      const path = relative(actualRoot, actual).split(sep).join('/');
      if (!/^(src\/assets|public)\//.test(path) || !(await stat(actual)).isFile()) {
        throw new Error('Keine reguläre Datei in einem lokalen Bildbereich.');
      }
    } catch (error) {
      throw new Error(
        `Bildfokus-Manifest ${MEDIA_FOCUS_MANIFEST_PATH}: Original „${original}“ fehlt oder ist unzulässig.`,
        { cause: error },
      );
    }
  }
  return manifest;
}
