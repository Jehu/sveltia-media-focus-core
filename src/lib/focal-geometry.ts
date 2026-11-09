export interface FocalPoint {
  x: number;
  y: number;
}

interface Dimensions {
  width: number;
  height: number;
}

/** Position the original-image point centrally where the cover crop permits it. */
export function computeObjectPosition(
  focal: FocalPoint,
  intrinsic: Dimensions,
  frame: Dimensions,
): string | undefined {
  if (
    ![focal.x, focal.y].every((value) => Number.isFinite(value) && value >= 0 && value <= 1) ||
    ![intrinsic.width, intrinsic.height, frame.width, frame.height].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  ) return undefined;

  const scale = Math.max(frame.width / intrinsic.width, frame.height / intrinsic.height);
  const position = (point: number, original: number, available: number): number => {
    const rendered = original * scale;
    const overflow = rendered - available;
    if (overflow <= 0.000001) return 50;
    const offset = Math.min(overflow, Math.max(0, point * rendered - available / 2));
    return (offset / overflow) * 100;
  };
  return `${position(focal.x, intrinsic.width, frame.width)}% ${position(focal.y, intrinsic.height, frame.height)}%`;
}
