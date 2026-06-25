'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Shape, Viewport, ToolId, createShape } from '../lib/shapes';
import {
  screenToWorld, hitTestShape, hitTestHandle, resizeShape,
  drawGrid, drawShape, drawArrow, drawSelectionHandles, worldToScreenShape,
} from '../lib/canvas-utils';

interface DragState {
  mode: 'pan' | 'move' | 'resize' | 'create' | 'arrow';
  startX: number;
  startY: number;
  offsetX?: number;
  offsetY?: number;
  handleIndex?: number;
  origBounds?: { x: number; y: number; w: number; h: number };
  tempShape?: Shape | null;
}

const MAX_HISTORY = 50;

export function useCanvasEngine() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolId>('select');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#333333');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(14);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [zoomPercent, setZoomPercent] = useState(100);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const shapesRef = useRef<Shape[]>(shapes);
  const viewportRef = useRef<Viewport>(viewport);
  const spaceHeld = useRef(false);

  // History managed via refs to avoid stale closures
  const historyRef = useRef<Shape[][]>([[]]);
  const historyIndexRef = useRef(0);

  shapesRef.current = shapes;
  viewportRef.current = viewport;

  const selectedShape = shapes.find(s => s.id === selectedId) || null;

  const pushHistory = useCallback((newShapes: Shape[]) => {
    const snap = JSON.parse(JSON.stringify(newShapes));
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    trimmed.push(snap);
    if (trimmed.length > MAX_HISTORY) trimmed.shift();
    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const snap = historyRef.current[historyIndexRef.current];
    setShapes(JSON.parse(JSON.stringify(snap)));
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const snap = historyRef.current[historyIndexRef.current];
    setShapes(JSON.parse(JSON.stringify(snap)));
  }, []);

  const addShapes = useCallback((newShapes: Shape[]) => {
    setShapes(prev => {
      const updated = [...prev, ...newShapes];
      pushHistory(updated);
      return updated;
    });
  }, [pushHistory]);

  const clearCanvas = useCallback(() => {
    setShapes([]);
    pushHistory([]);
    setSelectedId(null);
  }, [pushHistory]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setShapes(prev => {
      const updated = prev.filter(s => s.id !== selectedId);
      pushHistory(updated);
      return updated;
    });
    setSelectedId(null);
  }, [selectedId, pushHistory]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;

    if (e.code === 'Space' && !e.repeat) {
      spaceHeld.current = true;
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
      e.preventDefault();
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      e.preventDefault();
      deleteSelected();
    }
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
    if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
    if (!e.ctrlKey && !e.altKey) {
      const keyMap: Record<string, ToolId> = {
        v: 'select', r: 'rect', e: 'ellipse', d: 'diamond',
        t: 'text', a: 'arrow', s: 'sticky',
      };
      if (keyMap[e.key]) setTool(keyMap[e.key]);
    }
  }, [selectedId, deleteSelected, undo, redo]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      spaceHeld.current = false;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = tool === 'select' ? 'default' : tool === 'text' ? 'text' : 'crosshair';
      }
    }
  }, [tool]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const v = viewportRef.current;
    const s = shapesRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, v, canvas.width, canvas.height);

    for (const shape of s) {
      if (shape.type === 'arrow' || shape.type === 'line') {
        drawArrow(ctx, shape, s, v);
      } else {
        drawShape(ctx, shape, v);
      }
    }

    const sel = s.find(sh => sh.id === selectedId);
    if (sel && sel.type !== 'arrow' && sel.type !== 'line') {
      drawSelectionHandles(ctx, sel, v);
    }

    const ds = dragRef.current;
    if (ds?.mode === 'create' && ds.tempShape) {
      const ts = worldToScreenShape(ds.tempShape, v);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#4a90d9';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ts.x, ts.y, ts.w, ts.h);
      ctx.setLineDash([]);
      drawShape(ctx, ds.tempShape, v);
    }
  }, [selectedId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const area = canvas.parentElement;
    if (!area) return;

    const resize = () => {
      canvas.width = area.clientWidth;
      canvas.height = area.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(area);

    let frameId: number;
    const loop = () => { render(); frameId = requestAnimationFrame(loop); };
    loop();

    return () => { ro.disconnect(); cancelAnimationFrame(frameId); };
  }, [render]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const v = viewportRef.current;
    const native = e.nativeEvent;
    const wp = screenToWorld(native.offsetX, native.offsetY, v);

    if (spaceHeld.current || e.button === 1) {
      dragRef.current = { mode: 'pan', startX: e.clientX, startY: e.clientY };
      canvas.style.cursor = 'grabbing';
      return;
    }

    if (tool === 'select') {
      const hit = hitTestShape(wp.x, wp.y, shapesRef.current);
      if (hit) {
        setSelectedId(hit.id);
        const handle = hitTestHandle(wp.x, wp.y, hit, v.zoom);
        if (handle >= 0) {
          dragRef.current = {
            mode: 'resize', startX: wp.x, startY: wp.y,
            handleIndex: handle,
            origBounds: { x: hit.x, y: hit.y, w: hit.width, h: hit.height },
          };
        } else {
          dragRef.current = {
            mode: 'move', startX: wp.x, startY: wp.y,
            offsetX: wp.x - hit.x, offsetY: wp.y - hit.y,
          };
        }
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (tool === 'arrow') {
      const hit = hitTestShape(wp.x, wp.y, shapesRef.current);
      if (hit && hit.type !== 'arrow' && hit.type !== 'line') {
        const temp = createShape('arrow', {
          startShapeId: hit.id, stroke: strokeColor, strokeWidth,
        });
        dragRef.current = { mode: 'arrow', startX: wp.x, startY: wp.y, tempShape: temp };
      }
      return;
    }

    if (tool === 'text') {
      const shape = createShape('text', {
        x: wp.x - 100, y: wp.y - 20, text: 'Text',
        fill: strokeColor, stroke: 'transparent', fontSize,
      });
      addShapes([shape]);
      setSelectedId(shape.id);
      return;
    }

    if (tool === 'sticky') {
      const shape = createShape('sticky', { x: wp.x - 80, y: wp.y - 80, text: 'Note' });
      addShapes([shape]);
      setSelectedId(shape.id);
      return;
    }

    const typeMap: Record<string, Shape['type']> = {
      rect: 'rect', rrect: 'rrect', ellipse: 'ellipse', diamond: 'diamond',
    };
    const temp = createShape(typeMap[tool] || 'rect', {
      x: wp.x, y: wp.y, width: 0, height: 0,
      fill: fillColor, stroke: strokeColor, strokeWidth, fontSize,
    });
    dragRef.current = { mode: 'create', startX: wp.x, startY: wp.y, tempShape: temp };
  }, [tool, fillColor, strokeColor, strokeWidth, fontSize, addShapes]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const v = viewportRef.current;
    const native = e.nativeEvent;
    const wp = screenToWorld(native.offsetX, native.offsetY, v);
    setCursorPos({ x: Math.round(wp.x), y: Math.round(wp.y) });

    const ds = dragRef.current;
    if (!ds) return;

    if (ds.mode === 'pan') {
      const dx = (e.clientX - ds.startX) / v.zoom;
      const dy = (e.clientY - ds.startY) / v.zoom;
      setViewport(prev => {
        const nv = { ...prev, x: viewportRef.current.x - dx, y: viewportRef.current.y - dy };
        viewportRef.current = nv;
        return nv;
      });
      return;
    }

    if (ds.mode === 'move' && selectedId) {
      setShapes(prev => prev.map(s => {
        if (s.id !== selectedId) return s;
        return { ...s, x: wp.x - (ds.offsetX || 0), y: wp.y - (ds.offsetY || 0) };
      }));
      return;
    }

    if (ds.mode === 'resize' && selectedId && ds.handleIndex !== undefined && ds.origBounds) {
      setShapes(prev => prev.map(s => {
        if (s.id !== selectedId) return s;
        const cloned = { ...s };
        resizeShape(cloned, ds.handleIndex!, wp.x, wp.y, ds.origBounds!);
        return cloned;
      }));
      return;
    }

    if ((ds.mode === 'create' || ds.mode === 'arrow') && ds.tempShape) {
      const updated = { ...ds.tempShape };
      if (ds.mode === 'create') {
        updated.x = Math.min(ds.startX, wp.x);
        updated.y = Math.min(ds.startY, wp.y);
        updated.width = Math.abs(wp.x - ds.startX);
        updated.height = Math.abs(wp.y - ds.startY);
      } else {
        const hit = hitTestShape(wp.x, wp.y, shapesRef.current);
        updated.endShapeId = hit && hit.id !== updated.startShapeId ? hit.id : null;
      }
      ds.tempShape = updated;
    }
  }, [selectedId]);

  const onMouseUp = useCallback(() => {
    const ds = dragRef.current;
    if (!ds) return;

    if (ds.mode === 'pan') {
      if (canvasRef.current) {
        canvasRef.current.style.cursor = tool === 'select' ? 'default' : 'crosshair';
      }
    }

    if (ds.mode === 'create' && ds.tempShape) {
      if (ds.tempShape.width > 5 && ds.tempShape.height > 5) {
        addShapes([ds.tempShape]);
        setSelectedId(ds.tempShape.id);
      }
    }

    if (ds.mode === 'arrow' && ds.tempShape) {
      if (ds.tempShape.endShapeId) {
        addShapes([ds.tempShape]);
        setSelectedId(ds.tempShape.id);
      }
    }

    if (ds.mode === 'move' || ds.mode === 'resize') {
      pushHistory(shapesRef.current);
    }

    dragRef.current = null;
  }, [tool, addShapes, pushHistory]);

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const native = e.nativeEvent;
    setViewport(prev => {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.1, Math.min(5, prev.zoom * zoomFactor));
      const wx = native.offsetX / prev.zoom + prev.x;
      const wy = native.offsetY / prev.zoom + prev.y;
      const nv = { x: wx - native.offsetX / newZoom, y: wy - native.offsetY / newZoom, zoom: newZoom };
      viewportRef.current = nv;
      setZoomPercent(Math.round(newZoom * 100));
      return nv;
    });
  }, []);

  const onDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const v = viewportRef.current;
    const native = e.nativeEvent;
    const wp = screenToWorld(native.offsetX, native.offsetY, v);
    const hit = hitTestShape(wp.x, wp.y, shapesRef.current);
    if (hit) {
      const newText = prompt('Edit text:', hit.text || '');
      if (newText !== null) {
        setShapes(prev => {
          const updated = prev.map(s => s.id === hit.id ? { ...s, text: newText } : s);
          pushHistory(updated);
          return updated;
        });
      }
    }
  }, [pushHistory]);

  const setToolAndCursor = useCallback((t: ToolId) => {
    setTool(t);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = t === 'select' ? 'default' : t === 'text' ? 'text' : 'crosshair';
    }
  }, []);

  return {
    shapes, setShapes, viewport, setViewport, selectedShape, selectedId, setSelectedId,
    tool, setTool: setToolAndCursor, fillColor, setFillColor,
    strokeColor, setStrokeColor, strokeWidth, setStrokeWidth,
    fontSize, setFontSize, cursorPos, zoomPercent,
    canvasRef, undo, redo, addShapes, clearCanvas, deleteSelected,
    onMouseDown, onMouseMove, onMouseUp, onWheel, onDoubleClick,
  };
}
