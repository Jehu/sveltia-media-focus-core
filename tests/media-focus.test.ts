import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMediaFocusManifest, getMediaFocus } from '../src/lib/media-focus.ts';

const path = 'website/src/assets/uploads/photo.jpg';
const record = { sourceSha: 'a'.repeat(40), focal: { x: 0, y: 1 } };
const json = (images: unknown) => JSON.stringify({ version: 1, images });

test('loads an empty manifest and returns no focus for an unregistered image', () => {
  const manifest = parseMediaFocusManifest(json({}));
  assert.deepEqual(manifest, { version: 1, images: {} });
  assert.equal(getMediaFocus(manifest, '/src/assets/uploads/photo.jpg'), undefined);
});

test('resolves the original before optimization and preserves exact edge coordinates', () => {
  const manifest = parseMediaFocusManifest(json({ [path]: record }));
  assert.deepEqual(manifest.images[path], record);
  assert.deepEqual(
    getMediaFocus(
      manifest,
      '../../assets/uploads/photo.jpg',
      'website/src/content/treatments/example.yaml',
    ),
    { x: 0, y: 1 },
  );
  assert.equal(getMediaFocus(manifest, '/assets/uploads/photo.jpg'), undefined);
});

test('does not merge equal bytes or names under different paths', () => {
  const other = 'website/src/assets/other/photo.jpg';
  const manifest = parseMediaFocusManifest(
    json({ [path]: record, [other]: { ...record, focal: { x: 0.2, y: 0.3 } } }),
  );
  assert.deepEqual(getMediaFocus(manifest, path), { x: 0, y: 1 });
  assert.deepEqual(getMediaFocus(manifest, other), { x: 0.2, y: 0.3 });
});

test('rejects invalid JSON, versions, containers and incomplete records', () => {
  for (const source of [
    '{',
    'version: 1\nimages: {}',
    'null',
    '[]',
    '{}',
    '{"version":2,"images":{}}',
    '{"version":1,"images":[]}',
    json({ [path]: null }),
    json({ [path]: { focal: record.focal } }),
    json({ [path]: { ...record, sourceSha: 'invalid' } }),
    json({ [path]: { ...record, focal: { x: 0 } } }),
    json({ [path]: { ...record, focal: { x: -0.1, y: 1 } } }),
    json({ [path]: { ...record, focal: { x: 0, y: 1.1 } } }),
    json({ [path]: { ...record, focal: { x: '0.5', y: 1 } } }),
    json({ [path]: { ...record, focal: { x: null, y: 1 } } }),
    `{"version":1,"images":{"${path}":{"sourceSha":"${record.sourceSha}","focal":{"x":1e400,"y":0}}}}`,
    json({ '/website/src/content/photo.jpg': record }),
  ]) {
    assert.throws(() => parseMediaFocusManifest(source), /Bildfokus.*media-focus\.json/);
  }
});

test('rejects duplicate JSON keys before JSON.parse can silently choose the last value', () => {
  for (const source of [
    '{"version":1,"version":1,"images":{}}',
    '{"version":1,"images":{},"im\\u0061ges":{}}',
    `{"version":1,"images":{"${path}":${JSON.stringify(record)},"${path}":${JSON.stringify(record)}}}`,
  ]) {
    assert.throws(() => parseMediaFocusManifest(source), /[Dd]oppelt/);
  }
});

test('rejects multiple spellings of one original instead of choosing a focus', () => {
  assert.throws(
    () =>
      parseMediaFocusManifest(
        json({ [path]: record, '/src/assets/uploads/other/../photo.jpg': record }),
      ),
    /[Dd]oppelt.*photo\.jpg/,
  );
});
