import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeRepoAssetPath, resolveOriginalImagePath } from '../src/lib/asset-path.ts';

test('normalizes canonical Sveltia CMS asset paths to Astro-root-relative', () => {
  assert.equal(
    normalizeRepoAssetPath('/website/src/assets/uploads/treatments/foo.jpg'),
    '/src/assets/uploads/treatments/foo.jpg',
  );
});

test('normalizes dotted repo-asset spellings to Astro-root-relative', () => {
  assert.equal(
    normalizeRepoAssetPath('./website/src/assets/uploads/team.jpg'),
    '/src/assets/uploads/team.jpg',
  );
  assert.equal(
    normalizeRepoAssetPath('./src/assets/uploads/team.jpg'),
    '/src/assets/uploads/team.jpg',
  );
});

test('keeps already root-relative asset paths untouched', () => {
  assert.equal(normalizeRepoAssetPath('/src/assets/uploads/a.webp'), '/src/assets/uploads/a.webp');
});

test('passes existing entry-relative paths and non-asset strings through unchanged', () => {
  assert.equal(
    normalizeRepoAssetPath('../../assets/uploads/treatments/platzhalter.svg'),
    '../../assets/uploads/treatments/platzhalter.svg',
  );
  assert.equal(
    normalizeRepoAssetPath('https://cdn.example.com/a.jpg'),
    'https://cdn.example.com/a.jpg',
  );
  assert.equal(
    normalizeRepoAssetPath('/website/public/img/logo.svg'),
    '/website/public/img/logo.svg',
  );
});

test('passes non-string values through untouched (no fallback)', () => {
  const focal = { x: 0.5, y: 0.5 };
  assert.equal(normalizeRepoAssetPath(focal), focal);
  assert.equal(normalizeRepoAssetPath(undefined), undefined);
});

test('resolves repository, Astro and entry-relative references to the same original', () => {
  const expected = 'website/src/assets/uploads/photo.jpg';
  for (const path of [
    expected,
    '/website/src/assets/uploads/photo.jpg',
    './website/src/assets/uploads/photo.jpg',
    '/src/assets/uploads/photo.jpg',
    './src/assets/uploads/photo.jpg',
    '../../assets/uploads/photo.jpg',
    '../../assets/uploads/other/../photo.jpg',
  ]) {
    assert.equal(
      resolveOriginalImagePath(path, 'website/src/content/treatments/example.yaml'),
      expected,
    );
  }
  assert.equal(
    resolveOriginalImagePath('../../assets/uploads/photo.jpg', 'src/content/blog/example.mdx'),
    expected,
  );
});

test('uses the source file for relative paths and keeps distinct originals separate', () => {
  assert.equal(
    resolveOriginalImagePath('./photo.jpg', 'website/src/assets/one/example.md'),
    'website/src/assets/one/photo.jpg',
  );
  assert.equal(
    resolveOriginalImagePath('./photo.jpg', 'website/src/assets/two/example.md'),
    'website/src/assets/two/photo.jpg',
  );
  assert.throws(() => resolveOriginalImagePath('./photo.jpg'), /Quelldatei/);
});

test('resolves public images without merging historical copies into src/assets', () => {
  for (const path of [
    '/assets/photo.jpg',
    '/website/public/assets/photo.jpg',
    './website/public/assets/photo.jpg',
  ]) {
    assert.equal(resolveOriginalImagePath(path), 'website/public/assets/photo.jpg');
  }
  assert.equal(resolveOriginalImagePath('/og-default.jpg'), 'website/public/og-default.jpg');
  assert.notEqual(
    resolveOriginalImagePath('/assets/photo.jpg'),
    resolveOriginalImagePath('/src/assets/photo.jpg'),
  );
});

test('rejects remote, generated, non-image and out-of-scope references', () => {
  for (const path of [
    'https://example.org/a.jpg',
    '//example.org/a.jpg',
    'data:image/png;base64,AA',
    'file:///tmp/a.jpg',
    '/_astro/photo.hash.jpg',
    '/website/public/_astro/photo.hash.jpg',
    '/website/src/content/photo.jpg',
    '/src/assets/../../../outside.jpg',
    '/src/assets/script.js',
    '/src/assets/photo.jpg?width=100',
    '/src/assets/photo.jpg#fragment',
    '/src/assets/..\\outside.jpg',
    '',
  ]) {
    assert.throws(() => resolveOriginalImagePath(path), /Bildpfad/);
  }
});
