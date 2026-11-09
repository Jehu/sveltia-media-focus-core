import test from 'node:test';
import assert from 'node:assert/strict';
import { computeObjectPosition } from '../src/lib/focal-geometry.ts';
import { computeBackgroundPosition, computeCropRectangle, computeDecorationTranslation } from '../src/lib/focal-crop-geometry.ts';

test('centres the original point rather than treating its coordinates as CSS alignment', () => {
  assert.equal(computeObjectPosition({ x: 0.6, y: 0.5 }, { width: 1000, height: 500 }, { width: 500, height: 500 }), '70% 50%');
  assert.equal(computeObjectPosition({ x: 0.5, y: 0.6 }, { width: 500, height: 1000 }, { width: 500, height: 500 }), '50% 70%');
});

test('clamps edge points without exposing empty borders', () => {
  assert.equal(computeObjectPosition({ x: 0, y: 0 }, { width: 1000, height: 500 }, { width: 500, height: 500 }), '0% 50%');
  assert.equal(computeObjectPosition({ x: 1, y: 1 }, { width: 500, height: 1000 }, { width: 500, height: 500 }), '50% 100%');
});

test('equal aspect ratios need no translation', () => {
  assert.equal(computeObjectPosition({ x: 0.1, y: 0.9 }, { width: 1000, height: 500 }, { width: 200, height: 100 }), '50% 50%');
});

test('rejects unmeasurable frames and invalid original coordinates', () => {
  assert.equal(computeObjectPosition({ x: 0.5, y: 0.5 }, { width: 1000, height: 500 }, { width: 0, height: 500 }), undefined);
  assert.equal(computeObjectPosition({ x: Number.NaN, y: 0.5 }, { width: 1000, height: 500 }, { width: 500, height: 500 }), undefined);
  assert.equal(computeObjectPosition({ x: 1.1, y: 0.5 }, { width: 1000, height: 500 }, { width: 500, height: 500 }), undefined);
});

test('positions only cropped background axes using the actual scale', () => {
  const image = { width: 1000, height: 500 };
  const frame = { width: 500, height: 500 };
  assert.deepEqual(computeBackgroundPosition({ x: 0.6, y: 0.5 }, image, frame, 'auto 118%'), { x: '-458px', y: '-45px' });
  assert.deepEqual(computeBackgroundPosition({ x: 0.6, y: 0.1 }, image, frame, 'auto 78%'), { x: '-218px' });
  assert.deepEqual(computeBackgroundPosition({ x: 1, y: 0 }, image, frame, 'contain'), {});
  assert.deepEqual(computeBackgroundPosition({ x: 1, y: 0 }, image, frame, 'cover'), { x: '-500px' });
  assert.deepEqual(computeBackgroundPosition({ x: 1, y: 0 }, image, { width: 1000, height: 200 }, 'auto 118%'), { y: '0px' });
});

test('calculates bounded source pixels for the server-side crop', () => {
  assert.deepEqual(computeCropRectangle({ x: 0.6, y: 0.5 }, { width: 1000, height: 500 }, { width: 500, height: 500 }), { left: 350, top: 0, width: 500, height: 500 });
  assert.deepEqual(computeCropRectangle({ x: 0, y: 1 }, { width: 500, height: 1000 }, { width: 500, height: 500 }), { left: 0, top: 500, width: 500, height: 500 });
  assert.equal(computeCropRectangle({ x: 0.5, y: 0.5 }, { width: 0, height: 500 }, { width: 500, height: 500 }), undefined);
});

test('moves oversized decorative images inside their clipping parent without changing their scale', () => {
  assert.deepEqual(computeDecorationTranslation({ x: 0.6, y: 0.7 }, { width: 1200, height: 600 }, { width: 500, height: 500 }, { x: -600, y: -20 }), { x: 130, y: -80 });
  assert.deepEqual(computeDecorationTranslation({ x: 0.6, y: 0.7 }, { width: 300, height: 200 }, { width: 500, height: 500 }, { x: -40, y: -30 }), {});
});
