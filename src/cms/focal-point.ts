/** Shared focus picker and crop previews for the native Sveltia asset dialog. */

import { computeObjectPosition } from '../lib/focal-geometry.ts';

interface CropPreview {
  label?: string;
  width?: number;
  height?: number;
  aspect?: string;
  editable_height?: boolean;
}

/** Synthetic/DOM-Event-Minimum, das die Handler benutzen. */
interface DomLikeEvent {
  key?: string;
  shiftKey?: boolean;
  button?: number;
  target: EventTarget | null;
  clientX: number;
  clientY: number;
  preventDefault(): void;
}

/** React-Oberfläche, die Sveltia unter `CMS.React` freigibt. */
interface ReactApi {
  createElement: (tag: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => unknown;
  useState: <T>(initial: T | (() => T)) => [T, (value: T) => void];
  useEffect: (effect: () => void | (() => void), deps?: unknown[]) => void;
  useRef: <T>(initial: T) => { current: T };
}

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/** Fokus normiert: auf [0,1] begrenzt, drei Dezimalstellen. */
const normalize = (n: number): number => Math.round(clamp01(n) * 1000) / 1000;

const reactApi = (): ReactApi => {
  const react = (window as { CMS?: { React?: ReactApi } }).CMS?.React;
  if (!react?.createElement || !react.useState || !react.useEffect || !react.useRef) {
    throw new Error('focal-point: CMS.React (createElement/useState/useEffect/useRef) fehlt — Sveltia 0.250 vor diesem Skript laden.');
  }
  return react;
};

export const createFocalPointWidgets = (): { FocalPicker: unknown; CropPreviews: unknown } => {
  const { createElement: h, useState, useEffect, useRef } = reactApi();

  /**
   * Zahlenfeld für eine Achse: lokaler String-Draft während der Bearbeitung,
   * gesynct mit dem Prop, solange nicht editiert wird. Commit erst bei Blur
   * oder Enter (finite + Clamp auf [min,max]); Escape verwirft den Draft.
   */
  const AxisInput = ({ label, value, onCommit }: {
    label: string;
    value: number;
    onCommit: (percent: number) => void;
  }): unknown => {
    const [draft, setDraft] = useState<string | null>(null);
    const editing = draft !== null;
    const commit = () => {
      if (draft === null) return;
      if (draft.trim() === '') {
        setDraft(null);
        return;
      }
      const parsed = Number(draft);
      if (Number.isFinite(parsed)) {
        onCommit(Math.min(100, Math.max(0, parsed)));
      }
      setDraft(null);
    };
    return h('label', { className: 'focal-point__axis' },
      h('span', { className: 'focal-point__axis-label' }, label),
      h('input', {
        className: 'focal-point__axis-input',
        type: 'number',
        min: 0,
        max: 100,
        step: 1,
        value: editing ? draft : String(value),
        onChange: (event: DomLikeEvent) => {
          setDraft(String((event.target as HTMLInputElement).value ?? ''));
        },
        onBlur: commit,
        onKeyDown: (event: DomLikeEvent) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          } else if (event.key === 'Escape') {
            setDraft(null);
          }
        },
      }));
  };
  const FocalPicker = ({ url, size, focal, onPick, onRemove }: {
    url: string;
    size: { width: number; height: number } | undefined;
    focal: { x: number; y: number } | undefined;
    onPick: (x: number, y: number) => void;
    onRemove: () => void;
  }): unknown => {
    const frame = useRef<HTMLDivElement | null>(null);
    const [dragging, setDragging] = useState(false);

    const pointFromEvent = (event: DomLikeEvent): { x: number; y: number } | undefined => {
      const node = frame.current;
      if (!node) return undefined;
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return undefined;
      return {
        x: normalize((event.clientX - rect.left) / rect.width),
        y: normalize((event.clientY - rect.top) / rect.height),
      };
    };

    useEffect(() => {
      if (!dragging) return;
      const move = (event: PointerEvent) => {
        const point = pointFromEvent(event);
        if (point) onPick(point.x, point.y);
      };
      const up = () => setDragging(false);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      return () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };
    }, [dragging, onPick]);

    const onKeyDown = (event: DomLikeEvent) => {
      if (!event.key) return;
      if (event.key === 'Home') {
        onPick(0.5, 0.5);
        event.preventDefault();
        return;
      }
      if (!focal) return;
      const step = event.shiftKey ? 0.05 : 0.01;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const move = moves[event.key];
      if (move) {
        onPick(clamp01(focal.x + move[0]), clamp01(focal.y + move[1]));
        event.preventDefault();
      }
    };

    return h(
      'div',
      { className: 'focal-point__picker' },
      h('div', {
        className: `focal-point__frame${focal ? ' focal-point__frame--active' : ''}`,
        style: size ? { aspectRatio: `${size.width} / ${size.height}`, width: `min(100%, ${size.width / size.height * 52}vh)` } : undefined,
        ref: frame,
        role: 'group',
        tabIndex: 0,
        'aria-label': 'Bildfokus: Pfeiltasten bewegen (Umschalt für größere Schritte), Home zentriert — oder Fokus per Zahlenfeld setzen',
        onPointerDown: (event: DomLikeEvent) => {
          if (event.button !== undefined && event.button !== 0) return;
          event.preventDefault();
          frame.current?.focus();
          const point = pointFromEvent(event);
          if (point) onPick(point.x, point.y);
          setDragging(true);
        },
        onKeyDown,
      },
        h('img', { className: 'focal-point__image', src: url, alt: '', draggable: false }),
        size ? h('span', { className: 'focal-point__meta' }, `${size.width} × ${size.height} px Original`) : null,
          focal ? h('span', {
            className: 'focal-point__marker',
            style: { left: `${focal.x * 100}%`, top: `${focal.y * 100}%` },
            'aria-hidden': true,
          }) : null,
      ),
      h(
        'div',
        { className: 'focal-point__toolbar' },
        h('button', { type: 'button', className: 'focal-point__button', onClick: () => onPick(0.5, 0.5) }, 'Mitte'),
        h('button', {
          type: 'button',
          className: 'focal-point__button focal-point__button--remove',
          onClick: onRemove,
          disabled: !focal,
        }, 'Fokus entfernen'),
        h(AxisInput, {
          label: 'Fokus X (%)',
          value: Math.round((focal ? focal.x : 0.5) * 100),
          onCommit: (percent: number) => {
            const base = focal ?? { x: 0.5, y: 0.5 };
            onPick(clamp01(percent / 100), base.y);
          },
        }),
        h(AxisInput, {
          label: 'Fokus Y (%)',
          value: Math.round((focal ? focal.y : 0.5) * 100),
          onCommit: (percent: number) => {
            const base = focal ?? { x: 0.5, y: 0.5 };
            onPick(base.x, clamp01(percent / 100));
          },
        }),
      ),
    );
  };

  const CropPreviewFrame = ({ url, size, focal, crop }: {
    url: string;
    size: { width: number; height: number } | undefined;
    focal: { x: number; y: number } | undefined;
    crop: CropPreview;
  }): unknown => {
    const width = Math.max(1, Math.round(crop.width ?? 360));
    const aspect = (() => {
      const match = crop.aspect ? /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(crop.aspect) : undefined;
      if (match) return Number(match[1]) / Number(match[2]);
      return crop.height ? width / crop.height : undefined;
    })();
    const [height, setHeight] = useState(() => (aspect ? Math.round(width / aspect) : (crop.height ?? 240)));
    const position = focal && size ? computeObjectPosition(focal, size, { width, height }) : undefined;
    return h(
      'figure',
      { className: 'focal-point__crop' },
      h('div', {
        className: 'focal-point__crop-frame',
        style: { width: `${width}px`, aspectRatio: `${width} / ${height}` },
      },
        h('img', {
          className: 'focal-point__crop-image',
          src: url,
          alt: '',
          style: { objectPosition: position ?? '50% 50%' },
        }),
      ),
      h(
        'figcaption',
        { className: 'focal-point__crop-caption' },
        h('span', null, crop.label ?? `${width} × ${height}`),
        crop.editable_height
          ? h('label', { className: 'focal-point__crop-height' },
              'Rahmenhöhe ',
              h('input', {
                className: 'focal-point__crop-input',
                type: 'number',
                min: 80,
                max: 1600,
                step: 10,
                value: height,
                onChange: (event: DomLikeEvent) => {
                  const next = Number((event.target as HTMLInputElement).value);
                  if (Number.isFinite(next) && next >= 80 && next <= 1600) setHeight(Math.round(next));
                },
              }),
              ' px')
          : null,
      ),
    );
  };

  const CropPreviews = ({ url, size, focal, crops }: {
    url: string;
    size: { width: number; height: number } | undefined;
    focal: { x: number; y: number } | undefined;
    crops: CropPreview[];
  }): unknown => (crops.length && url
    ? h('div', { className: 'focal-point__crops' }, crops.map((crop, index) =>
        h(CropPreviewFrame, { key: String(crop.label ?? index), url, size, focal, crop }),
      ))
    : null);

  return { FocalPicker, CropPreviews };
};
