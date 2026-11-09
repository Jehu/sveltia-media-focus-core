import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadMediaFocusManifest } from '../src/lib/media-focus-build.ts';

const image = 'src/assets/uploads/photo.jpg';
const record = { sourceSha: 'a'.repeat(40), focal: { x: 0.4, y: 0.6 } };

async function fixture(t: TestContext, images: Record<string, unknown> = {}) {
  const root = await mkdtemp(join(tmpdir(), 'media-focus-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src/data'), { recursive: true });
  await mkdir(join(root, 'src/assets/uploads'), { recursive: true });
  await mkdir(join(root, 'public/assets'), { recursive: true });
  await writeFile(join(root, 'src/data/media-focus.json'), JSON.stringify({ version: 1, images }));
  return { root, url: pathToFileURL(root + '/') };
}

test('loads an empty manifest without inventing a focus', async (t) => {
  const { url } = await fixture(t);
  assert.deepEqual(await loadMediaFocusManifest(url), { version: 1, images: {} });
});

test('checks source and public originals without changing bytes or resetting a focus', async (t) => {
  const { root, url } = await fixture(t, {
    ['website/' + image]: record,
    'website/public/assets/photo.jpg': { ...record, focal: { x: 0, y: 1 } },
  });
  const bytes = Buffer.from('new image bytes, deliberately different from the recorded sourceSha');
  await writeFile(join(root, image), bytes);
  await writeFile(join(root, 'public/assets/photo.jpg'), bytes);
  const result = await loadMediaFocusManifest(url);
  assert.deepEqual(result.images['website/' + image], record);
  assert.deepEqual(result.images['website/public/assets/photo.jpg'].focal, { x: 0, y: 1 });
  assert.deepEqual(await readFile(join(root, image)), bytes);
  assert.deepEqual(await readFile(join(root, 'public/assets/photo.jpg')), bytes);
});

test('reports a missing original with manifest and image path', async (t) => {
  const { url } = await fixture(t, { ['website/' + image]: record });
  await assert.rejects(loadMediaFocusManifest(url), /media-focus\.json.*photo\.jpg/);
});

test('requires a regular local file, not a directory or an escaping symlink', async (t) => {
  const { root, url } = await fixture(t, { ['website/' + image]: record });
  await mkdir(join(root, image));
  await assert.rejects(loadMediaFocusManifest(url), /photo\.jpg/);
  await rm(join(root, image), { recursive: true });
  const outside = join(root, 'outside.jpg');
  await writeFile(outside, 'not inside an allowed image directory');
  await symlink(outside, join(root, image));
  await assert.rejects(loadMediaFocusManifest(url), /photo\.jpg/);
});

test('does not turn an unreadable or broken manifest into an empty one', async (t) => {
  const { root, url } = await fixture(t);
  const path = join(root, 'src/data/media-focus.json');
  await writeFile(path, '{');
  await assert.rejects(loadMediaFocusManifest(url), /Bildfokus.*media-focus\.json/);
  await rm(path);
  await assert.rejects(loadMediaFocusManifest(url), /media-focus\.json/);
});
