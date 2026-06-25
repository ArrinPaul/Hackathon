import { Shape, Viewport, ShapeType } from './shapes';

export function screenToWorld(sx: number, sy: number, viewport: Viewport) {
  return { x: sx / viewport.zoom + viewport.x, y: sy / viewport.zoom + viewport.y };
}

export function worldToScreen(wx: number, wy: number, viewport: Viewport) {
  return { x: (wx - viewport.x) * viewport.zoom, y: (wy - viewport.y) * viewport.zoom };
}

export function worldToScreenShape(shape: Shape, viewport: Viewport) {
  return {
    x: (shape.x - viewport.x) * viewport.zoom,
    y: (shape.y - viewport.y) * viewport.zoom,
    w: shape.width * viewport.zoom,
    h: shape.height * viewport.zoom,
    cx: (shape.x + shape.width / 2 - viewport.x) * viewport.zoom,
    cy: (shape.y + shape.height / 2 - viewport.y) * viewport.zoom,
  };
}

export function drawGrid(ctx: CanvasRenderingContext2D, viewport: Viewport, w: number, h: number) {
  const step = 20 * viewport.zoom;
  if (step < 4) return;

  const offX = (-viewport.x * viewport.zoom) % step;
  const offY = (-viewport.y * viewport.zoom) % step;

  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = offX; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
  for (let y = offY; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
  ctx.stroke();

  const majorStep = step * 5;
  if (majorStep > 10) {
    const mOffX = (-viewport.x * viewport.zoom) % majorStep;
    const mOffY = (-viewport.y * viewport.zoom) % majorStep;
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = mOffX; x < w; x += majorStep) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = mOffY; y < h; y += majorStep) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
  }
}

const imageCache: Record<string, HTMLImageElement> = {};

function drawPen(ctx: CanvasRenderingContext2D, shape: Shape, viewport: Viewport) {
  if (!shape.points || shape.points.length === 0) return;
  ctx.beginPath();
  // Render points relative to shape.x, shape.y
  const start = worldToScreen(shape.x + shape.points[0].x, shape.y + shape.points[0].y, viewport);
  ctx.moveTo(start.x, start.y);
  for (let i = 1; i < shape.points.length; i++) {
    const pt = worldToScreen(shape.x + shape.points[i].x, shape.y + shape.points[i].y, viewport);
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.strokeStyle = shape.stroke;
  ctx.lineWidth = shape.strokeWidth * viewport.zoom;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function drawImageShape(ctx: CanvasRenderingContext2D, s: ReturnType<typeof worldToScreenShape>, shape: Shape, viewport: Viewport) {
  if (!shape.imageData) return;
  const cached = imageCache[shape.id];
  if (cached) {
    if (cached.complete && cached.naturalWidth !== 0) {
      ctx.drawImage(cached, s.x, s.y, s.w, s.h);
    }
  } else {
    const img = new Image();
    img.src = shape.imageData;
    imageCache[shape.id] = img;
  }
}

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, viewport: Viewport) {
  const s = worldToScreenShape(shape, viewport);
  ctx.save();
  ctx.globalAlpha = shape.opacity;

  switch (shape.type) {
    case 'rect': drawRect(ctx, s, shape, viewport); break;
    case 'rrect': drawRRect(ctx, s, shape, viewport); break;
    case 'ellipse': drawEllipse(ctx, s, shape, viewport); break;
    case 'diamond': drawDiamond(ctx, s, shape, viewport); break;
    case 'text': drawTextShape(ctx, s, shape, viewport); break;
    case 'sticky': drawSticky(ctx, s, shape, viewport); break;
    case 'pen': drawPen(ctx, shape, viewport); break;
    case 'image': drawImageShape(ctx, s, shape, viewport); break;
  }

  if (shape.text && shape.type !== 'text' && shape.type !== 'pen' && shape.type !== 'image') {
    drawTextInShape(ctx, s, shape, viewport.zoom);
  }

  ctx.restore();
}

function drawRect(ctx: CanvasRenderingContext2D, s: ReturnType<typeof worldToScreenShape>, shape: Shape, viewport: Viewport) {
  ctx.fillStyle = shape.fill;
  ctx.fillRect(s.x, s.y, s.w, s.h);
  if (shape.strokeWidth > 0 && shape.stroke !== 'transparent') {
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth * viewport.zoom;
    ctx.strokeRect(s.x, s.y, s.w, s.h);
  }
}

function drawRRect(ctx: CanvasRenderingContext2D, s: ReturnType<typeof worldToScreenShape>, shape: Shape, viewport: Viewport) {
  const r = Math.min(12 * viewport.zoom, s.w / 4, s.h / 4);
  ctx.beginPath();
  roundRect(ctx, s.x, s.y, s.w, s.h, r);
  ctx.fillStyle = shape.fill;
  ctx.fill();
  if (shape.strokeWidth > 0 && shape.stroke !== 'transparent') {
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth * viewport.zoom;
    roundRect(ctx, s.x, s.y, s.w, s.h, r);
    ctx.stroke();
  }
}

function drawEllipse(ctx: CanvasRenderingContext2D, s: ReturnType<typeof worldToScreenShape>, shape: Shape, viewport: Viewport) {
  ctx.beginPath();
  ctx.ellipse(s.cx, s.cy, s.w / 2, s.h / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = shape.fill;
  ctx.fill();
  if (shape.strokeWidth > 0 && shape.stroke !== 'transparent') {
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth * viewport.zoom;
    ctx.stroke();
  }
}

function drawDiamond(ctx: CanvasRenderingContext2D, s: ReturnType<typeof worldToScreenShape>, shape: Shape, viewport: Viewport) {
  ctx.beginPath();
  ctx.moveTo(s.cx, s.y);
  ctx.lineTo(s.x + s.w, s.cy);
  ctx.lineTo(s.cx, s.y + s.h);
  ctx.lineTo(s.x, s.cy);
  ctx.closePath();
  ctx.fillStyle = shape.fill;
  ctx.fill();
  if (shape.strokeWidth > 0 && shape.stroke !== 'transparent') {
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth * viewport.zoom;
    ctx.stroke();
  }
}

function drawTextShape(ctx: CanvasRenderingContext2D, s: ReturnType<typeof worldToScreenShape>, shape: Shape, viewport: Viewport) {
  ctx.font = (shape.fontSize * viewport.zoom) + 'px ' + shape.fontFamily;
  ctx.fillStyle = shape.fill === 'transparent' ? '#333' : shape.fill;
  ctx.textAlign = shape.textAlign || 'center';
  ctx.textBaseline = 'middle';
  const lines = wrapText(ctx, shape.text || 'Text', s.w - 16 * viewport.zoom);
  const lineH = shape.fontSize * 1.3 * viewport.zoom;
  const startY = s.cy - (lines.length - 1) * lineH / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, s.cx, startY + i * lineH);
  });
}

function drawSticky(ctx: CanvasRenderingContext2D, s: ReturnType<typeof worldToScreenShape>, shape: Shape, viewport: Viewport) {
  ctx.fillStyle = shape.fill;
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.strokeStyle = shape.stroke;
  ctx.lineWidth = shape.strokeWidth * viewport.zoom;
  ctx.strokeRect(s.x, s.y, s.w, s.h);
  const fold = 12 * viewport.zoom;
  ctx.fillStyle = shadeColor(shape.fill, -15);
  ctx.beginPath();
  ctx.moveTo(s.x + s.w - fold, s.y + s.h);
  ctx.lineTo(s.x + s.w, s.y + s.h - fold);
  ctx.lineTo(s.x + s.w, s.y + s.h);
  ctx.closePath();
  ctx.fill();
}

function drawTextInShape(ctx: CanvasRenderingContext2D, s: ReturnType<typeof worldToScreenShape>, shape: Shape, zoom: number) {
  const pad = 10 * zoom;
  ctx.font = (shape.fontSize * zoom) + 'px ' + (shape.fontFamily || 'Arial');
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = wrapText(ctx, shape.text, s.w - pad * 2);
  const lineH = shape.fontSize * 1.3 * zoom;
  const startY = s.cy - (lines.length - 1) * lineH / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, s.cx, startY + i * lineH);
  });
}

export function drawArrow(ctx: CanvasRenderingContext2D, shape: Shape, shapes: Shape[], viewport: Viewport) {
  const from = shapes.find(s => s.id === shape.startShapeId);
  const to = shapes.find(s => s.id === shape.endShapeId);
  if (!from || !to) return;

  const fromCX = (from.x + from.width / 2 - viewport.x) * viewport.zoom;
  const fromCY = (from.y + from.height / 2 - viewport.y) * viewport.zoom;
  const toCX = (to.x + to.width / 2 - viewport.x) * viewport.zoom;
  const toCY = (to.y + to.height / 2 - viewport.y) * viewport.zoom;

  const angle = Math.atan2(toCY - fromCY, toCX - fromCX);
  const fromPt = edgeIntersection(from, angle, viewport);
  const toPt = edgeIntersection(to, angle + Math.PI, viewport);

  ctx.save();
  ctx.strokeStyle = shape.stroke;
  ctx.fillStyle = shape.stroke;
  ctx.lineWidth = shape.strokeWidth * viewport.zoom;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(fromPt.x, fromPt.y);
  ctx.lineTo(toPt.x, toPt.y);
  ctx.stroke();

  const headLen = 12 * viewport.zoom;
  ctx.beginPath();
  ctx.moveTo(toPt.x, toPt.y);
  ctx.lineTo(toPt.x - headLen * Math.cos(angle - 0.35), toPt.y - headLen * Math.sin(angle - 0.35));
  ctx.lineTo(toPt.x - headLen * Math.cos(angle + 0.35), toPt.y - headLen * Math.sin(angle + 0.35));
  ctx.closePath();
  ctx.fill();

  if (shape.text) {
    const mx = (fromPt.x + toPt.x) / 2;
    const my = (fromPt.y + toPt.y) / 2;
    ctx.font = (12 * viewport.zoom) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(shape.text, mx, my - 4 * viewport.zoom);
  }
  ctx.restore();
}

function edgeIntersection(shape: Shape, angle: number, viewport: Viewport) {
  const cx = (shape.x + shape.width / 2 - viewport.x) * viewport.zoom;
  const cy = (shape.y + shape.height / 2 - viewport.y) * viewport.zoom;
  const hw = shape.width * viewport.zoom / 2;
  const hh = shape.height * viewport.zoom / 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  if (Math.abs(dx) * hh > Math.abs(dy) * hw) {
    const t = hw / Math.abs(dx);
    return { x: cx + dx * t, y: cy + dy * t };
  } else {
    const t = hh / Math.abs(dy);
    return { x: cx + dx * t, y: cy + dy * t };
  }
}

export function drawSelectionHandles(ctx: CanvasRenderingContext2D, shape: Shape, viewport: Viewport) {
  const s = worldToScreenShape(shape, viewport);
  const handleSize = 8 * viewport.zoom;

  ctx.strokeStyle = '#4a90d9';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4 * viewport.zoom, 3 * viewport.zoom]);
  ctx.strokeRect(s.x - 2, s.y - 2, s.w + 4, s.h + 4);
  ctx.setLineDash([]);

  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#4a90d9';
  ctx.lineWidth = 1.5;

  const handles = [
    [s.x - handleSize / 2, s.y - handleSize / 2],
    [s.x + s.w - handleSize / 2, s.y - handleSize / 2],
    [s.x - handleSize / 2, s.y + s.h - handleSize / 2],
    [s.x + s.w - handleSize / 2, s.y + s.h - handleSize / 2],
    [s.cx - handleSize / 2, s.y - handleSize / 2],
    [s.cx - handleSize / 2, s.y + s.h - handleSize / 2],
    [s.x - handleSize / 2, s.cy - handleSize / 2],
    [s.x + s.w - handleSize / 2, s.cy - handleSize / 2],
  ];

  for (const [hx, hy] of handles) {
    ctx.fillRect(hx, hy, handleSize, handleSize);
    ctx.strokeRect(hx, hy, handleSize, handleSize);
  }
}

export function hitTestShape(wx: number, wy: number, shapes: Shape[]): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    if (s.type === 'arrow' || s.type === 'line') continue;
    if (wx >= s.x && wx <= s.x + s.width && wy >= s.y && wy <= s.y + s.height) return s;
  }
  return null;
}

export function hitTestHandle(wx: number, wy: number, shape: Shape, zoom: number): number {
  const handleSize = 8 / zoom;
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const handles = [
    shape.x, shape.y,
    shape.x + shape.width, shape.y,
    shape.x, shape.y + shape.height,
    shape.x + shape.width, shape.y + shape.height,
    cx, shape.y,
    cx, shape.y + shape.height,
    shape.x, cy,
    shape.x + shape.width, cy,
  ];
  for (let i = 0; i < handles.length; i += 2) {
    if (Math.abs(wx - handles[i]) < handleSize && Math.abs(wy - handles[i + 1]) < handleSize) {
      return i / 2;
    }
  }
  return -1;
}

export function resizeShape(shape: Shape, handle: number, wx: number, wy: number, orig: { x: number; y: number; w: number; h: number }) {
  switch (handle) {
    case 0: shape.x = wx; shape.y = wy; shape.width = orig.x + orig.w - wx; shape.height = orig.y + orig.h - wy; break;
    case 1: shape.y = wy; shape.width = wx - orig.x; shape.height = orig.y + orig.h - wy; break;
    case 2: shape.x = wx; shape.width = orig.x + orig.w - wx; shape.height = wy - orig.y; break;
    case 3: shape.width = wx - orig.x; shape.height = wy - orig.y; break;
    case 4: shape.y = wy; shape.height = orig.y + orig.h - wy; break;
    case 5: shape.height = wy - orig.y; break;
    case 6: shape.x = wx; shape.width = orig.x + orig.w - wx; break;
    case 7: shape.width = wx - orig.x; break;
  }
  shape.width = Math.max(20, shape.width);
  shape.height = Math.max(20, shape.height);
}

export function serializeCanvasForAI(shapes: Shape[]): string {
  const lines: string[] = [];
  for (const shape of shapes) {
    if (shape.type === 'arrow' || shape.type === 'line') {
      const from = shapes.find(s => s.id === shape.startShapeId);
      const to = shapes.find(s => s.id === shape.endShapeId);
      if (from && to) {
        const edgeLabel = shape.text ? ` [${shape.text}]` : '';
        lines.push(`Arrow: "${from.text || '(unnamed)'}" -> "${to.text || '(unnamed)'}"${edgeLabel}`);
      }
    } else {
      const typeLabel: Record<string, string> = {
        rect: 'Process', rrect: 'Process', ellipse: 'Start/End',
        diamond: 'Decision', text: 'Note', sticky: 'Sticky Note',
      };
      lines.push(`${typeLabel[shape.type] || 'Shape'}: "${shape.text || '(empty)'}"`);
    }
  }
  return lines.length ? lines.join('\n') : '(empty canvas)';
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [''];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
