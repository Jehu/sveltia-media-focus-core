import assert from 'node:assert/strict';
import test from 'node:test';
import { bindEntryImages, captureImageReferences, originalImage, originalPathOf } from '../src/lib/media-focus-assets.ts';

const metadata = { src: '/_astro/opaque.hash.webp', width: 1200, height: 800, format: 'webp' as const };

test('keeps original identity through nested collection fields without interpreting the derivative URL', () => {
  const raw = { hero: { image: { src: '../../../assets/photo.jpg' } }, gallery: ['/assets/photo.jpg'] };
  const entry = bindEntryImages({
    filePath: 'src/content/blog/en/article.mdx',
    data: { hero: { image: { src: metadata } }, gallery: [metadata], __imageSources: captureImageReferences(raw) },
  });
  assert.equal(originalPathOf(entry.data.hero.image.src), 'website/src/assets/photo.jpg');
  assert.equal(originalPathOf(entry.data.gallery[0]), 'website/public/assets/photo.jpg');
  assert.notEqual(entry.data.hero.image.src, entry.data.gallery[0]);
  assert.equal(entry.data.hero.image.src.src, metadata.src);
  assert.equal(originalPathOf(metadata), undefined);
});

test('preserves image behaviour and separates identical imports by explicit original path', () => {
  const image = new Proxy(metadata, { get: (target, key) => key === 'tracking' ? 'preserved' : Reflect.get(target, key) });
  const a = originalImage(image, '/src/assets/a.jpg');
  const b = originalImage(image, '/src/assets/b.jpg');
  assert.equal(originalPathOf(a), 'website/src/assets/a.jpg');
  assert.equal(originalPathOf(b), 'website/src/assets/b.jpg');
  assert.equal(Reflect.get(a, 'tracking'), 'preserved');
  assert.equal(a.width, 1200);
  assert.throws(() => originalImage(image, '/_astro/opaque.hash.webp'), /Derivat/);
});

test('binds callable SVG imports as well as raster metadata', () => {
  const svg = Object.assign(() => 'svg component', { ...metadata, format: 'svg' as const });
  const entry = bindEntryImages({ filePath: 'src/content/treatments/test.yaml', data: {
    image: svg, __imageSources: captureImageReferences({ image: '../../assets/placeholder.svg' }),
  } });
  assert.equal(originalPathOf(entry.data.image), 'website/src/assets/placeholder.svg');
  assert.equal(entry.data.image(), 'svg component');
});

test('does not treat remote URLs, dates or ordinary strings as local image metadata', () => {
  const date = new Date('2026-11-05');
  const references = captureImageReferences({ remote: 'https://example.org/image.jpg', text: 'Text', image: '../../assets/a.jpg' });
  assert.equal(Object.keys(references).length, 1);
  const entry = bindEntryImages({ filePath: 'src/content/blog/article.mdx', data: { date, remote: metadata, __imageSources: references } });
  assert.equal(entry.data.date, date);
  assert.equal(entry.data.remote, metadata);
});
