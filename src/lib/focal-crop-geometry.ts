import { computeObjectPosition, type FocalPoint } from './focal-geometry.ts';

interface Dimensions {
  width: number;
  height: number;
}

/** Fix the other axis at original size so cover neither rescales nor downscales. */
function offsets(focal: FocalPoint, rendered: Dimensions, frame: Dimensions) {
  const axis = (key: 'width' | 'height', index: number) => {
    const overflow = rendered[key] - frame[key];
    if (overflow <= 0.000001) return undefined;
    const position = computeObjectPosition(focal, rendered, { ...rendered, [key]: frame[key] });
    return position ? (parseFloat(position.split(' ')[index]) / 100) * overflow : undefined;
  };
  return {
    x: axis('width', 0),
    y: axis('height', 1),
  };
}

export function computeBackgroundPosition(
  focal: FocalPoint,
  intrinsic: Dimensions,
  frame: Dimensions,
  backgroundSize: string,
): { x?: string; y?: string } {
  if (!computeObjectPosition(focal, intrinsic, frame)) return {};
  let rendered: Dimensions;
  if (backgroundSize === 'cover' || backgroundSize === 'contain') {
    const scale = Math[backgroundSize === 'cover' ? 'max' : 'min'](
      frame.width / intrinsic.width,
      frame.height / intrinsic.height,
    );
    rendered = { width: intrinsic.width * scale, height: intrinsic.height * scale };
  } else {
    const [x, y = 'auto'] = backgroundSize.trim().split(/\s+/);
    const length = (value: string, available: number) =>
      /^\d+(?:\.\d+)?%$/.test(value)
        ? (parseFloat(value) / 100) * available
        : /^\d+(?:\.\d+)?px$/.test(value)
          ? parseFloat(value)
          : undefined;
    let width = length(x, frame.width);
    let height = length(y, frame.height);
    if (x === 'auto' && height !== undefined) width = (height * intrinsic.width) / intrinsic.height;
    if (y === 'auto' && width !== undefined) height = (width * intrinsic.height) / intrinsic.width;
    if (x === 'auto' && y === 'auto') ({ width, height } = intrinsic);
    if (!width || !height) return {};
    rendered = { width, height };
  }
  const offset = offsets(focal, rendered, frame);
  const px = (n: number) => `${-Math.round(n * 1000000) / 1000000}px`;
  return {
    ...(offset.x === undefined ? {} : { x: px(offset.x) }),
    ...(offset.y === undefined ? {} : { y: px(offset.y) }),
  };
}

export function computeCropRectangle(focal: FocalPoint, intrinsic: Dimensions, frame: Dimensions) {
  if (!computeObjectPosition(focal, intrinsic, frame)) return undefined;
  const scale = Math.max(frame.width / intrinsic.width, frame.height / intrinsic.height);
  const size = {
    width: Math.max(1, Math.min(intrinsic.width, Math.round(frame.width / scale))),
    height: Math.max(1, Math.min(intrinsic.height, Math.round(frame.height / scale))),
  };
  const offset = offsets(focal, intrinsic, size);
  return { left: Math.round(offset.x ?? 0), top: Math.round(offset.y ?? 0), ...size };
}

export function computeDecorationTranslation(
  focal: FocalPoint,
  rendered: Dimensions,
  frame: Dimensions,
  current: { x: number; y: number },
) {
  const position = computeBackgroundPosition(focal, rendered, frame, 'auto auto');
  return {
    ...(position.x === undefined ? {} : { x: parseFloat(position.x) - current.x }),
    ...(position.y === undefined ? {} : { y: parseFloat(position.y) - current.y }),
  };
}
