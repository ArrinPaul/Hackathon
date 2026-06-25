'use client';

import { useEffect, useRef } from 'react';
import { Shape, Viewport } from '../lib/shapes';
import { screenToWorld } from '../lib/canvas-utils';

interface MinimapProps {
  shapes: Shape[];
  viewport: Viewport;
  onSetViewport: (v: Viewport | ((prev: Viewport) => Viewport)) => void;
  parentCanvas: HTMLCanvasElement | null;
}

const MAP_W = 180;
const MAP_H = 120;
const WORLD_SIZE = 4000; // virtual canvas area boundaries (-2000 to +2000)

export function Minimap({ shapes, viewport, onSetViewport, parentCanvas }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const worldToMap = (wx: number, wy: number) => {
    const mx = MAP_W / 2 + (wx / WORLD_SIZE) * MAP_W;
    const my = MAP_H / 2 + (wy / WORLD_SIZE) * MAP_H;
    return { x: mx, y: my };
  };

  const mapToWorld = (mx: number, my: number) => {
    const wx = ((mx - MAP_W / 2) / MAP_W) * WORLD_SIZE;
    const wy = ((my - MAP_H / 2) / MAP_H) * WORLD_SIZE;
    return { x: wx, y: wy };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, MAP_W, MAP_H);

    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, MAP_W, MAP_H);
    ctx.strokeStyle = '#e0e0e0';
    ctx.strokeRect(0, 0, MAP_W, MAP_H);

    // Draw shapes in miniature
    ctx.fillStyle = '#9e9e9e';
    for (const shape of shapes) {
      if (shape.type === 'arrow' || shape.type === 'line') continue;
      const pt = worldToMap(shape.x, shape.y);
      const w = (shape.width / WORLD_SIZE) * MAP_W;
      const h = (shape.height / WORLD_SIZE) * MAP_H;
      ctx.fillRect(pt.x, pt.y, Math.max(2, w), Math.max(2, h));
    }

    // Draw viewport rectangle
    if (parentCanvas) {
      const parentW = parentCanvas.width;
      const parentH = parentCanvas.height;

      const tl = screenToWorld(0, 0, viewport);
      const br = screenToWorld(parentW, parentH, viewport);

      const mapTl = worldToMap(tl.x, tl.y);
      const mapBr = worldToMap(br.x, br.y);

      const rectW = mapBr.x - mapTl.x;
      const rectH = mapBr.y - mapTl.y;

      ctx.fillStyle = 'rgba(74, 144, 217, 0.15)';
      ctx.fillRect(mapTl.x, mapTl.y, rectW, rectH);
      ctx.strokeStyle = '#4a90d9';
      ctx.lineWidth = 1;
      ctx.strokeRect(mapTl.x, mapTl.y, rectW, rectH);
    }
  }, [shapes, viewport, parentCanvas]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!parentCanvas) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const targetWorld = mapToWorld(mx, my);

    onSetViewport(prev => {
      // Center the viewport on targetWorld coordinate
      const screenW = parentCanvas.width;
      const screenH = parentCanvas.height;
      return {
        x: targetWorld.x - screenW / (2 * prev.zoom),
        y: targetWorld.y - screenH / (2 * prev.zoom),
        zoom: prev.zoom
      };
    });
  };

  return (
    <div className="absolute bottom-12 right-4 bg-white border border-border shadow-md rounded-[10px] overflow-hidden select-none z-30">
      <div className="bg-muted px-2 py-1 text-[9px] font-semibold text-muted-foreground border-b border-border flex justify-between">
        <span>MINIMAP</span>
      </div>
      <canvas
        ref={canvasRef}
        width={MAP_W}
        height={MAP_H}
        className="cursor-pointer block"
        onClick={handleMinimapClick}
      />
    </div>
  );
}
