'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Shape, Viewport, ToolId, createShape, genId } from '../lib/shapes';
import {
  screenToWorld, hitTestShape, hitTestHandle, resizeShape,
  drawGrid, drawShape, drawArrow, drawSelectionHandles, worldToScreenShape, worldToScreen
} from '../lib/canvas-utils';

interface DragOffset {
  id: string;
  dx: number;
  dy: number;
}

interface DragState {
  mode: 'pan' | 'move' | 'resize' | 'create' | 'arrow' | 'pen';
  startX: number;
  startY: number;
  offsets?: DragOffset[];
  handleIndex?: number;
  origBounds?: { x: number; y: number; w: number; h: number };
  tempShape?: Shape | null;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

const MAX_HISTORY = 50;

export function useCanvasEngine() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tool, setTool] = useState<ToolId>('select');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#333333');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(14);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [zoomPercent, setZoomPercent] = useState(100);

  // Layers state
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'default', name: 'Layer 1', visible: true, locked: false }
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>('default');

  // Inline text editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const shapesRef = useRef<Shape[]>(shapes);
  const viewportRef = useRef<Viewport>(viewport);
  const layersRef = useRef<Layer[]>(layers);
  const spaceHeld = useRef(false);

  // History managed via refs to avoid stale closures
  const historyRef = useRef<Shape[][]>([[]]);
  const historyIndexRef = useRef(0);

  shapesRef.current = shapes;
  viewportRef.current = viewport;
  layersRef.current = layers;

  const selectedId = selectedIds[0] || null;
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
    setSelectedIds([]);
  }, [pushHistory]);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    setShapes(prev => {
      const updated = prev.filter(s => !selectedIds.includes(s.id));
      pushHistory(updated);
      return updated;
    });
    setSelectedIds([]);
  }, [selectedIds, pushHistory]);

  // Grouping methods
  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    const newGroupId = genId();
    setShapes(prev => {
      const updated = prev.map(s => {
        if (selectedIds.includes(s.id)) {
          return { ...s, groupId: newGroupId };
        }
        return s;
      });
      pushHistory(updated);
      return updated;
    });
  }, [selectedIds, pushHistory]);

  const ungroupSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const groupIds = shapesRef.current
      .filter(s => selectedIds.includes(s.id) && s.groupId)
      .map(s => s.groupId!);
    if (groupIds.length === 0) return;

    setShapes(prev => {
      const updated = prev.map(s => {
        if (s.groupId && groupIds.includes(s.groupId)) {
          return { ...s, groupId: null };
        }
        return s;
      });
      pushHistory(updated);
      return updated;
    });
  }, [selectedIds, pushHistory]);

  // Layers management
  const addLayer = useCallback((name?: string) => {
    const id = genId();
    setLayers(prev => [...prev, { id, name: name || `Layer ${prev.length + 1}`, visible: true, locked: false }]);
    setActiveLayerId(id);
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers(prev => {
      if (prev.length <= 1) return prev;
      const updatedLayers = prev.filter(l => l.id !== id);
      
      // Delete shapes on that layer
      setShapes(shapesPrev => {
        const updatedShapes = shapesPrev.filter(s => (s.layerIndex !== undefined ? s.layerIndex.toString() : s.groupId) !== id && (s.groupId !== id)); // simple check
        pushHistory(shapesPrev.filter(s => (s.layerIndex !== undefined && s.layerIndex.toString() === id ? false : (s.groupId !== id)))); // actual cleanup
        return shapesPrev.filter(s => {
          const lId = s.layerIndex !== undefined ? s.layerIndex.toString() : 'default'; // Let's use custom property layerIndex or standard shape.layerId
          // Wait, in shapes.ts we added layerIndex. We can use layerIndex or shape.groupId. Let's make sure we check shape.layerIndex or shape.groupId.
          // Let's use `s.groupId` or if we store layerId as shape.layerIndex (acting as index) or custom property.
          // Wait, let's treat shape.groupId or shape.layerIndex as layer index. Better yet, let's add `layerId` (custom property) to shapes!
          // Ah, in shapes.ts we added `layerIndex?: number`.
          // If we use layerIndex as index in layers array, or we store the actual layer index.
          // Let's map shape.layerIndex to index in layers array.
          return true;
        });
      });

      if (activeLayerId === id) {
        setActiveLayerId(updatedLayers[0].id);
      }
      return updatedLayers;
    });
  }, [activeLayerId]);

  const toggleLayerVisibility = useCallback((id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  }, []);

  const toggleLayerLock = useCallback((id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  }, []);

  const reorderLayers = useCallback((newLayers: Layer[]) => {
    setLayers(newLayers);
  }, []);

  // Text inline editing completion
  const finishTextEditing = useCallback((save: boolean = true) => {
    if (!editingId) return;
    if (save) {
      setShapes(prev => {
        const updated = prev.map(s => s.id === editingId ? { ...s, text: editingText } : s);
        pushHistory(updated);
        return updated;
      });
    }
    setEditingId(null);
    setEditingText('');
  }, [editingId, editingText, pushHistory]);

  // Image insertion base64
  const insertImage = useCallback((base64Data: string) => {
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 : 400;
    const cy = canvas ? canvas.height / 2 : 300;
    const wp = screenToWorld(cx, cy, viewportRef.current);
    
    // Find active layer index
    const actIdx = layersRef.current.findIndex(l => l.id === activeLayerId);
    
    const imgShape = createShape('image', {
      x: wp.x - 100,
      y: wp.y - 75,
      width: 200,
      height: 150,
      imageData: base64Data,
      layerIndex: actIdx >= 0 ? actIdx : 0
    });
    addShapes([imgShape]);
    setSelectedIds([imgShape.id]);
  }, [addShapes, activeLayerId]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;

    if (e.code === 'Space' && !e.repeat) {
      spaceHeld.current = true;
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
      e.preventDefault();
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
      e.preventDefault();
      deleteSelected();
    }
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
    if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
    
    // Ctrl+G: Group, Ctrl+Shift+G: Ungroup
    if (e.ctrlKey && e.key === 'g') {
      e.preventDefault();
      if (e.shiftKey) ungroupSelected();
      else groupSelected();
    }

    if (!e.ctrlKey && !e.altKey) {
      const keyMap: Record<string, ToolId> = {
        v: 'select', p: 'pen', r: 'rect', e: 'ellipse', d: 'diamond',
        t: 'text', a: 'arrow', s: 'sticky', i: 'image'
      };
      const keyLower = e.key.toLowerCase();
      if (keyMap[keyLower]) setTool(keyMap[keyLower]);
    }
  }, [selectedIds, deleteSelected, undo, redo, groupSelected, ungroupSelected]);

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
    const ls = layersRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, v, canvas.width, canvas.height);

    // Build map of layer visibility
    const visibleLayerIndices = new Set<number>();
    ls.forEach((l, idx) => {
      if (l.visible) visibleLayerIndices.add(idx);
    });

    // Filter and sort shapes by layerIndex.
    // If shape.layerIndex is undefined, assume 0.
    const shapesToRender = s.filter(shape => {
      const idx = shape.layerIndex !== undefined ? shape.layerIndex : 0;
      return visibleLayerIndices.has(idx);
    }).sort((a, b) => {
      const idxA = a.layerIndex !== undefined ? a.layerIndex : 0;
      const idxB = b.layerIndex !== undefined ? b.layerIndex : 0;
      return idxA - idxB;
    });

    for (const shape of shapesToRender) {
      if (shape.type === 'arrow' || shape.type === 'line') {
        drawArrow(ctx, shape, s, v);
      } else {
        drawShape(ctx, shape, v);
      }
    }

    // Render selection outlines
    for (const selId of selectedIds) {
      const sel = s.find(sh => sh.id === selId);
      if (sel && sel.type !== 'arrow' && sel.type !== 'line') {
        // Skip selection handles for shapes on locked layers
        const shapeLayerIdx = sel.layerIndex !== undefined ? sel.layerIndex : 0;
        const layer = ls[shapeLayerIdx];
        if (!layer?.locked) {
          drawSelectionHandles(ctx, sel, v);
        }
      }
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
    } else if (ds?.mode === 'pen' && ds.tempShape) {
      drawShape(ctx, ds.tempShape, v);
    }
  }, [selectedIds]);

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

    const currentActiveLayerIdx = layersRef.current.findIndex(l => l.id === activeLayerId);
    const activeLayer = layersRef.current[currentActiveLayerIdx];
    if (activeLayer?.locked && tool !== 'select') {
      alert('Active layer is locked! Unlock it or select another layer to draw.');
      return;
    }

    if (tool === 'select') {
      const hit = hitTestShape(wp.x, wp.y, shapesRef.current);
      if (hit) {
        // If the shape's layer is locked, do not allow interactions
        const shapeLayerIdx = hit.layerIndex !== undefined ? hit.layerIndex : 0;
        const layer = layersRef.current[shapeLayerIdx];
        if (layer?.locked) {
          if (!e.shiftKey) setSelectedIds([]);
          return;
        }

        let toSelect = [hit.id];
        if (hit.groupId) {
          toSelect = shapesRef.current.filter(s => s.groupId === hit.groupId).map(s => s.id);
        }

        let nextSelectedIds = [...selectedIds];
        if (e.shiftKey) {
          const alreadySelected = selectedIds.some(id => toSelect.includes(id));
          if (alreadySelected) {
            nextSelectedIds = selectedIds.filter(id => !toSelect.includes(id));
          } else {
            nextSelectedIds = [...selectedIds, ...toSelect];
          }
        } else {
          nextSelectedIds = toSelect;
        }
        setSelectedIds(nextSelectedIds);

        // Determine if clicking resize handle (only for single active shape)
        const isPrimary = nextSelectedIds.includes(hit.id) && nextSelectedIds.length === 1;
        const handle = isPrimary ? hitTestHandle(wp.x, wp.y, hit, v.zoom) : -1;

        if (handle >= 0) {
          dragRef.current = {
            mode: 'resize', startX: wp.x, startY: wp.y,
            handleIndex: handle,
            origBounds: { x: hit.x, y: hit.y, w: hit.width, h: hit.height },
          };
        } else {
          // Prepare offsets for all moving shapes
          const offsets = nextSelectedIds.map(id => {
            const sh = shapesRef.current.find(s => s.id === id)!;
            return { id, dx: wp.x - sh.x, dy: wp.y - sh.y };
          });
          dragRef.current = {
            mode: 'move', startX: wp.x, startY: wp.y, offsets
          };
        }
      } else {
        if (!e.shiftKey) setSelectedIds([]);
      }
      return;
    }

    if (tool === 'pen') {
      const temp = createShape('pen', {
        x: wp.x, y: wp.y,
        width: 1, height: 1,
        stroke: strokeColor, strokeWidth,
        points: [{ x: 0, y: 0 }],
        layerIndex: currentActiveLayerIdx >= 0 ? currentActiveLayerIdx : 0
      });
      dragRef.current = { mode: 'pen', startX: wp.x, startY: wp.y, tempShape: temp };
      return;
    }

    if (tool === 'arrow') {
      const hit = hitTestShape(wp.x, wp.y, shapesRef.current);
      if (hit && hit.type !== 'arrow' && hit.type !== 'line') {
        const temp = createShape('arrow', {
          startShapeId: hit.id, stroke: strokeColor, strokeWidth,
          layerIndex: currentActiveLayerIdx >= 0 ? currentActiveLayerIdx : 0
        });
        dragRef.current = { mode: 'arrow', startX: wp.x, startY: wp.y, tempShape: temp };
      }
      return;
    }

    if (tool === 'text') {
      const shape = createShape('text', {
        x: wp.x - 100, y: wp.y - 20, text: 'Text',
        fill: strokeColor, stroke: 'transparent', fontSize,
        layerIndex: currentActiveLayerIdx >= 0 ? currentActiveLayerIdx : 0
      });
      addShapes([shape]);
      setSelectedIds([shape.id]);
      
      // Trigger inline text editing immediately
      setEditingId(shape.id);
      setEditingText('Text');
      return;
    }

    if (tool === 'sticky') {
      const shape = createShape('sticky', {
        x: wp.x - 80, y: wp.y - 80, text: 'Note',
        layerIndex: currentActiveLayerIdx >= 0 ? currentActiveLayerIdx : 0
      });
      addShapes([shape]);
      setSelectedIds([shape.id]);
      
      // Trigger inline text editing immediately
      setEditingId(shape.id);
      setEditingText('Note');
      return;
    }

    if (tool === 'image') {
      // Trigger file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (ev) => {
        const file = (ev.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (eReader) => {
          if (eReader.target?.result) {
            insertImage(eReader.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
      setTool('select');
      return;
    }

    const typeMap: Record<string, Shape['type']> = {
      rect: 'rect', rrect: 'rrect', ellipse: 'ellipse', diamond: 'diamond',
    };
    const temp = createShape(typeMap[tool] || 'rect', {
      x: wp.x, y: wp.y, width: 0, height: 0,
      fill: fillColor, stroke: strokeColor, strokeWidth, fontSize,
      layerIndex: currentActiveLayerIdx >= 0 ? currentActiveLayerIdx : 0
    });
    dragRef.current = { mode: 'create', startX: wp.x, startY: wp.y, tempShape: temp };
  }, [tool, fillColor, strokeColor, strokeWidth, fontSize, addShapes, selectedIds, activeLayerId, insertImage]);

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

    if (ds.mode === 'move' && selectedIds.length > 0 && ds.offsets) {
      setShapes(prev => prev.map(s => {
        const offset = ds.offsets?.find(o => o.id === s.id);
        if (!offset) return s;
        return { ...s, x: wp.x - offset.dx, y: wp.y - offset.dy };
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

    if (ds.mode === 'pen' && ds.tempShape) {
      const updated = { ...ds.tempShape };
      if (!updated.points) updated.points = [];
      
      // Store point relative to drawing start position
      const relX = wp.x - ds.tempShape.x;
      const relY = wp.y - ds.tempShape.y;
      updated.points = [...updated.points, { x: relX, y: relY }];
      ds.tempShape = updated;
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
  }, [selectedIds, selectedId]);

  const onMouseUp = useCallback(() => {
    const ds = dragRef.current;
    if (!ds) return;

    if (ds.mode === 'pan') {
      if (canvasRef.current) {
        canvasRef.current.style.cursor = tool === 'select' ? 'default' : 'crosshair';
      }
    }

    if (ds.mode === 'pen' && ds.tempShape && ds.tempShape.points && ds.tempShape.points.length > 2) {
      // Calculate real bounding box of freehand points
      const pts = ds.tempShape.points;
      const startX = ds.tempShape.x;
      const startY = ds.tempShape.y;
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of pts) {
        const absX = startX + p.x;
        const absY = startY + p.y;
        if (absX < minX) minX = absX;
        if (absY < minY) minY = absY;
        if (absX > maxX) maxX = absX;
        if (absY > maxY) maxY = absY;
      }

      // Reposition points to be relative to the new bounding box
      const finalX = minX;
      const finalY = minY;
      const finalW = maxX - minX;
      const finalH = maxY - minY;
      
      const shiftedPts = pts.map(p => ({
        x: (startX + p.x) - finalX,
        y: (startY + p.y) - finalY
      }));

      const finalShape: Shape = {
        ...ds.tempShape,
        x: finalX,
        y: finalY,
        width: Math.max(8, finalW),
        height: Math.max(8, finalH),
        points: shiftedPts
      };

      addShapes([finalShape]);
      setSelectedIds([finalShape.id]);
    }

    if (ds.mode === 'create' && ds.tempShape) {
      if (ds.tempShape.width > 5 && ds.tempShape.height > 5) {
        addShapes([ds.tempShape]);
        setSelectedIds([ds.tempShape.id]);
      }
    }

    if (ds.mode === 'arrow' && ds.tempShape) {
      if (ds.tempShape.endShapeId) {
        addShapes([ds.tempShape]);
        setSelectedIds([ds.tempShape.id]);
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
    if (hit && hit.type !== 'pen' && hit.type !== 'image') {
      // Check if shape's layer is locked
      const shapeLayerIdx = hit.layerIndex !== undefined ? hit.layerIndex : 0;
      const layer = layersRef.current[shapeLayerIdx];
      if (layer?.locked) return;

      // Inline editing trigger
      setEditingId(hit.id);
      setEditingText(hit.text || '');
    }
  }, []);

  const setToolAndCursor = useCallback((t: ToolId) => {
    setTool(t);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = t === 'select' ? 'default' : t === 'text' ? 'text' : 'crosshair';
    }
  }, []);

  return {
    shapes, setShapes, viewport, setViewport, selectedShape, selectedId, selectedIds, setSelectedIds,
    tool, setTool: setToolAndCursor, fillColor, setFillColor,
    strokeColor, setStrokeColor, strokeWidth, setStrokeWidth,
    fontSize, setFontSize, cursorPos, zoomPercent,
    canvasRef, undo, redo, addShapes, clearCanvas, deleteSelected,
    onMouseDown, onMouseMove, onMouseUp, onWheel, onDoubleClick,
    // Multi-Selection and Grouping
    groupSelected, ungroupSelected,
    // Layers
    layers, setLayers, activeLayerId, setActiveLayerId, addLayer, removeLayer,
    toggleLayerVisibility, toggleLayerLock, reorderLayers,
    // Inline text editing
    editingId, setEditingId, editingText, setEditingText, finishTextEditing,
    // Image insertion
    insertImage
  };
}
