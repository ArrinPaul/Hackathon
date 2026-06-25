import { describe, it, expect, vi } from 'vitest';
import {
  screenToWorld, worldToScreen, worldToScreenShape,
  hitTestShape, hitTestHandle, resizeShape, serializeCanvasForAI,
  drawGrid, drawShape, drawArrow, drawSelectionHandles,
} from '../lib/canvas-utils';
import { createShape, type Shape, type Viewport } from '../lib/shapes';

function makeCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    ellipse: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 50 })),
    setLineDash: vi.fn(),
    globalAlpha: 1,
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    lineCap: '',
  } as unknown as CanvasRenderingContext2D;
}

const vp: Viewport = { x: 0, y: 0, zoom: 1 };

describe('screenToWorld', () => {
  it('identity transform at zoom=1, no offset', () => {
    expect(screenToWorld(100, 200, { x: 0, y: 0, zoom: 1 })).toEqual({ x: 100, y: 200 });
  });

  it('applies zoom', () => {
    const r = screenToWorld(200, 100, { x: 0, y: 0, zoom: 2 });
    expect(r.x).toBe(100);
    expect(r.y).toBe(50);
  });

  it('applies viewport offset', () => {
    const r = screenToWorld(100, 100, { x: 50, y: 30, zoom: 1 });
    expect(r.x).toBe(150);
    expect(r.y).toBe(130);
  });

  it('applies both zoom and offset', () => {
    const r = screenToWorld(200, 200, { x: 10, y: 20, zoom: 2 });
    expect(r.x).toBe(110);
    expect(r.y).toBe(120);
  });
});

describe('worldToScreen', () => {
  it('identity transform', () => {
    expect(worldToScreen(100, 200, { x: 0, y: 0, zoom: 1 })).toEqual({ x: 100, y: 200 });
  });

  it('applies zoom', () => {
    const r = worldToScreen(50, 30, { x: 0, y: 0, zoom: 2 });
    expect(r.x).toBe(100);
    expect(r.y).toBe(60);
  });

  it('applies viewport offset', () => {
    const r = worldToScreen(150, 130, { x: 50, y: 30, zoom: 1 });
    expect(r.x).toBe(100);
    expect(r.y).toBe(100);
  });
});

describe('worldToScreenShape', () => {
  it('converts shape coordinates to screen', () => {
    const shape = createShape('rect', { x: 10, y: 20, width: 100, height: 50 });
    const r = worldToScreenShape(shape, vp);
    expect(r.x).toBe(10);
    expect(r.y).toBe(20);
    expect(r.w).toBe(100);
    expect(r.h).toBe(50);
    expect(r.cx).toBe(60);
    expect(r.cy).toBe(45);
  });

  it('applies zoom', () => {
    const shape = createShape('rect', { x: 10, y: 20, width: 100, height: 50 });
    const r = worldToScreenShape(shape, { x: 0, y: 0, zoom: 2 });
    expect(r.x).toBe(20);
    expect(r.y).toBe(40);
    expect(r.w).toBe(200);
    expect(r.h).toBe(100);
  });
});

describe('hitTestShape', () => {
  const shapes: Shape[] = [
    createShape('rect', { id: 'a', x: 10, y: 10, width: 100, height: 100 }),
    createShape('rect', { id: 'b', x: 200, y: 200, width: 50, height: 50 }),
  ];

  it('returns null for empty array', () => {
    expect(hitTestShape(50, 50, [])).toBeNull();
  });

  it('finds shape at point', () => {
    const hit = hitTestShape(50, 50, shapes);
    expect(hit?.id).toBe('a');
  });

  it('returns null when no shape at point', () => {
    expect(hitTestShape(500, 500, shapes)).toBeNull();
  });

  it('skips arrow shapes', () => {
    const arrow = createShape('arrow', { id: 'arr', x: 0, y: 0, width: 100, height: 100 });
    expect(hitTestShape(50, 50, [arrow])).toBeNull();
  });

  it('skips line shapes', () => {
    const line = createShape('line', { id: 'ln', x: 0, y: 0, width: 100, height: 100 });
    expect(hitTestShape(50, 50, [line])).toBeNull();
  });

  it('returns last matching shape (z-order)', () => {
    const top = createShape('rect', { id: 'top', x: 10, y: 10, width: 100, height: 100 });
    const bottom = createShape('rect', { id: 'bottom', x: 10, y: 10, width: 100, height: 100 });
    const hit = hitTestShape(50, 50, [bottom, top]);
    expect(hit?.id).toBe('top');
  });

  it('matches boundary points', () => {
    const hit = hitTestShape(10, 10, shapes);
    expect(hit?.id).toBe('a');
  });
});

describe('hitTestHandle', () => {
  const shape = createShape('rect', { x: 100, y: 100, width: 200, height: 100 });

  it('returns -1 when no handle hit', () => {
    expect(hitTestHandle(500, 500, shape, 1)).toBe(-1);
  });

  it('returns handle index for corner (top-left)', () => {
    const handle = hitTestHandle(100, 100, shape, 1);
    expect(handle).toBe(0);
  });

  it('returns handle index for corner (bottom-right)', () => {
    const handle = hitTestHandle(300, 200, shape, 1);
    expect(handle).toBe(3);
  });

  it('returns handle index for edge midpoint (top)', () => {
    const handle = hitTestHandle(200, 100, shape, 1);
    expect(handle).toBe(4);
  });

  it('returns handle index for edge midpoint (right)', () => {
    const handle = hitTestHandle(300, 150, shape, 1);
    expect(handle).toBe(7);
  });
});

describe('resizeShape', () => {
  const orig = { x: 100, y: 100, w: 200, h: 100 };

  it('handle 0: top-left corner', () => {
    const s = createShape('rect', { x: 100, y: 100, width: 200, height: 100 });
    resizeShape(s, 0, 120, 120, orig);
    expect(s.x).toBe(120);
    expect(s.y).toBe(120);
    expect(s.width).toBe(180);
    expect(s.height).toBe(80);
  });

  it('handle 3: bottom-right corner', () => {
    const s = createShape('rect', { x: 100, y: 100, width: 200, height: 100 });
    resizeShape(s, 3, 350, 250, orig);
    expect(s.width).toBe(250);
    expect(s.height).toBe(150);
  });

  it('handle 7: right edge', () => {
    const s = createShape('rect', { x: 100, y: 100, width: 200, height: 100 });
    resizeShape(s, 7, 400, 150, orig);
    expect(s.width).toBe(300);
    expect(s.height).toBe(100);
  });

  it('enforces minimum width of 20', () => {
    const s = createShape('rect', { x: 100, y: 100, width: 200, height: 100 });
    resizeShape(s, 7, 105, 150, orig);
    expect(s.width).toBe(20);
  });

  it('enforces minimum height of 20', () => {
    const s = createShape('rect', { x: 100, y: 100, width: 200, height: 100 });
    resizeShape(s, 5, 200, 105, orig);
    expect(s.height).toBe(20);
  });
});

describe('serializeCanvasForAI', () => {
  it('returns (empty canvas) for no shapes', () => {
    expect(serializeCanvasForAI([])).toBe('(empty canvas)');
  });

  it('serializes rect as Process', () => {
    const shapes = [createShape('rect', { text: 'Step 1' })];
    expect(serializeCanvasForAI(shapes)).toBe('Process: "Step 1"');
  });

  it('serializes ellipse as Start/End', () => {
    const shapes = [createShape('ellipse', { text: 'Start' })];
    expect(serializeCanvasForAI(shapes)).toBe('Start/End: "Start"');
  });

  it('serializes diamond as Decision', () => {
    const shapes = [createShape('diamond', { text: 'OK?' })];
    expect(serializeCanvasForAI(shapes)).toBe('Decision: "OK?"');
  });

  it('serializes arrow with connected shapes', () => {
    const a = createShape('rect', { id: 'a', text: 'From' });
    const b = createShape('rect', { id: 'b', text: 'To' });
    const arrow = createShape('arrow', { startShapeId: 'a', endShapeId: 'b', text: 'yes' });
    const result = serializeCanvasForAI([a, b, arrow]);
    expect(result).toContain('Arrow: "From" -> "To" [yes]');
  });

  it('serializes arrow without label', () => {
    const a = createShape('rect', { id: 'a', text: 'X' });
    const b = createShape('rect', { id: 'b', text: 'Y' });
    const arrow = createShape('arrow', { startShapeId: 'a', endShapeId: 'b' });
    const result = serializeCanvasForAI([a, b, arrow]);
    expect(result).toContain('Arrow: "X" -> "Y"');
  });

  it('handles unnamed shapes', () => {
    const a = createShape('rect', { id: 'a' });
    const b = createShape('rect', { id: 'b' });
    const arrow = createShape('arrow', { startShapeId: 'a', endShapeId: 'b' });
    const result = serializeCanvasForAI([a, b, arrow]);
    expect(result).toContain('Arrow: "(unnamed)" -> "(unnamed)"');
  });

  it('serializes sticky as Sticky Note', () => {
    const shapes = [createShape('sticky', { text: 'Note' })];
    expect(serializeCanvasForAI(shapes)).toBe('Sticky Note: "Note"');
  });
});

describe('drawGrid', () => {
  it('does nothing when step is too small (zoom too low)', () => {
    const ctx = makeCtx();
    drawGrid(ctx, { x: 0, y: 0, zoom: 0.01 }, 800, 600);
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  it('draws grid lines at normal zoom', () => {
    const ctx = makeCtx();
    drawGrid(ctx, vp, 800, 600);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('draws major grid lines at higher zoom', () => {
    const ctx = makeCtx();
    drawGrid(ctx, { x: 0, y: 0, zoom: 2 }, 800, 600);
    expect(ctx.stroke).toHaveBeenCalled();
  });
});

describe('drawShape', () => {
  it('draws a rect shape', () => {
    const ctx = makeCtx();
    const shape = createShape('rect', { x: 10, y: 10, width: 100, height: 50, fill: '#ff0000' });
    drawShape(ctx, shape, vp);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('draws an ellipse shape', () => {
    const ctx = makeCtx();
    const shape = createShape('ellipse', { x: 10, y: 10, width: 100, height: 50 });
    drawShape(ctx, shape, vp);
    expect(ctx.ellipse).toHaveBeenCalled();
  });

  it('draws a diamond shape', () => {
    const ctx = makeCtx();
    const shape = createShape('diamond', { x: 10, y: 10, width: 100, height: 80 });
    drawShape(ctx, shape, vp);
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
  });

  it('sets globalAlpha from shape opacity', () => {
    const ctx = makeCtx();
    const shape = createShape('rect', { opacity: 0.5 });
    drawShape(ctx, shape, vp);
    expect((ctx as any).globalAlpha).toBe(0.5);
  });

  it('draws text in shape when shape has text', () => {
    const ctx = makeCtx();
    const shape = createShape('rect', { text: 'Hello', x: 10, y: 10, width: 200, height: 100 });
    drawShape(ctx, shape, vp);
    expect(ctx.fillText).toHaveBeenCalled();
  });
});

describe('drawArrow', () => {
  it('returns early if source or target not found', () => {
    const ctx = makeCtx();
    const arrow = createShape('arrow', { startShapeId: 'missing', endShapeId: 'also-missing' });
    drawArrow(ctx, arrow, [], vp);
    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it('draws arrow between two shapes', () => {
    const ctx = makeCtx();
    const a = createShape('rect', { id: 'a', x: 0, y: 0, width: 100, height: 100 });
    const b = createShape('rect', { id: 'b', x: 300, y: 0, width: 100, height: 100 });
    const arrow = createShape('arrow', { startShapeId: 'a', endShapeId: 'b', stroke: '#000' });
    drawArrow(ctx, arrow, [a, b], vp);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('draws label text when arrow has text', () => {
    const ctx = makeCtx();
    const a = createShape('rect', { id: 'a', x: 0, y: 0, width: 100, height: 100 });
    const b = createShape('rect', { id: 'b', x: 300, y: 0, width: 100, height: 100 });
    const arrow = createShape('arrow', { startShapeId: 'a', endShapeId: 'b', text: 'label' });
    drawArrow(ctx, arrow, [a, b], vp);
    expect(ctx.fillText).toHaveBeenCalled();
  });
});

describe('drawSelectionHandles', () => {
  it('draws selection rectangle and handles', () => {
    const ctx = makeCtx();
    const shape = createShape('rect', { x: 100, y: 100, width: 200, height: 100 });
    drawSelectionHandles(ctx, shape, vp);
    expect(ctx.strokeRect).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('sets dashed line for selection outline', () => {
    const ctx = makeCtx();
    const shape = createShape('rect', { x: 100, y: 100, width: 200, height: 100 });
    drawSelectionHandles(ctx, shape, vp);
    expect(ctx.setLineDash).toHaveBeenCalledWith([4, 3]);
  });
});
