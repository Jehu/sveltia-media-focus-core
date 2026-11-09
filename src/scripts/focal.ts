import { computeObjectPosition } from '../lib/focal-geometry';
import {
  computeBackgroundPosition,
  computeDecorationTranslation,
} from '../lib/focal-crop-geometry';

let dispose: (() => void) | undefined;

/** Opt-in only. Restoring inline values also restores the stylesheet fallback. */
export function initFocalImages(): void {
  dispose?.();
  const points = JSON.parse(
    document.getElementById('media-focus-data')?.textContent ?? '{}',
  ) as Record<string, { x: number; y: number }>;
  const elements = [
    ...document.querySelectorAll<HTMLElement>(
      '[data-original-image]',
    ),
  ];
  const updates = new Map<HTMLElement, () => void>();
  const cleanups: (() => void)[] = [];
  for (const element of elements) {
    const focal = points[element.dataset.originalImage ?? ''];
    if (!focal) continue;
    const isImage = element instanceof HTMLImageElement;
    const previous = isImage ? element.style.objectPosition : element.style.backgroundPosition;
    const decorationFrame = element.hasAttribute('data-focal-decoration')
      ? element.parentElement
      : null;
    const previousTranslate = element.style.translate;
    const restore = () => {
      if (isImage) element.style.objectPosition = previous;
      else element.style.backgroundPosition = previous;
      if (decorationFrame) element.style.translate = previousTranslate;
    };
    const update = () => {
      if (!element.isConnected) return;
      restore();
      const frame = { width: element.clientWidth, height: element.clientHeight };
      const style = getComputedStyle(element);
      if (isImage) {
        if (!element.complete || !element.naturalWidth) return;
        if (decorationFrame) {
          const rect = element.getBoundingClientRect();
          const parent = decorationFrame.getBoundingClientRect();
          const translation = computeDecorationTranslation(
            focal,
            frame,
            { width: decorationFrame.clientWidth, height: decorationFrame.clientHeight },
            { x: rect.left - parent.left, y: rect.top - parent.top },
          );
          if (translation.x !== undefined || translation.y !== undefined) {
            element.style.translate = `${translation.x ?? 0}px ${translation.y ?? 0}px`;
          }
          return;
        }
        if (style.objectFit !== 'cover') return;
        const position = computeObjectPosition(
          focal,
          { width: element.naturalWidth, height: element.naturalHeight },
          frame,
        );
        if (position) element.style.objectPosition = position;
      } else if (element.hasAttribute('data-focal-background')) {
        const position = computeBackgroundPosition(
          focal,
          {
            width: Number(element.dataset.originalWidth),
            height: Number(element.dataset.originalHeight),
          },
          frame,
          style.backgroundSize,
        );
        if (position.x !== undefined) element.style.backgroundPositionX = position.x;
        if (position.y !== undefined) element.style.backgroundPositionY = position.y;
      }
    };
    updates.set(element, update);
    if (decorationFrame) updates.set(decorationFrame, update);
    if (isImage) element.addEventListener('load', update);
    cleanups.push(() => {
      if (isImage) element.removeEventListener('load', update);
      restore();
    });
  }
  const observer = new ResizeObserver((entries) => {
    for (const { target } of entries) updates.get(target as HTMLElement)?.();
  });
  for (const [element, update] of updates) {
    observer.observe(element);
    update();
  }
  const removals = new MutationObserver(() => {
    for (const element of elements) if (!element.isConnected) observer.unobserve(element);
  });
  if (elements.length) removals.observe(document.body, { childList: true, subtree: true });
  dispose = () => {
    observer.disconnect();
    removals.disconnect();
    cleanups.forEach((cleanup) => cleanup());
    dispose = undefined;
  };
}

document.addEventListener('astro:before-swap', () => dispose?.());
document.addEventListener('astro:page-load', initFocalImages);
