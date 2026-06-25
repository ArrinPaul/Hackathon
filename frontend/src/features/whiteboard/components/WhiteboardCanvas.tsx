'use client';

import { useCanvasEngine } from '../hooks/useCanvasEngine';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { AiPanel } from './AiPanel';
import { useState, useCallback } from 'react';

export function WhiteboardCanvas() {
  const engine = useCanvasEngine();
  const [aiOpen, setAiOpen] = useState(false);

  const handleExportPng = useCallback(() => {
    const canvas = engine.canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
  }, [engine.canvasRef]);

  const handleExportJson = useCallback(() => {
    const data = JSON.stringify({ shapes: engine.shapes, viewport: engine.viewport }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'whiteboard.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [engine.shapes, engine.viewport]);

  const handleImportJson = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.shapes) engine.setShapes(data.shapes);
          if (data.viewport) {
            engine.setViewport?.(data.viewport);
          }
        } catch {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [engine.setShapes]);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <WhiteboardToolbar
        tool={engine.tool}
        onSetTool={engine.setTool}
        fillColor={engine.fillColor}
        onSetFillColor={engine.setFillColor}
        strokeColor={engine.strokeColor}
        onSetStrokeColor={engine.setStrokeColor}
        strokeWidth={engine.strokeWidth}
        onSetStrokeWidth={engine.setStrokeWidth}
        fontSize={engine.fontSize}
        onSetFontSize={engine.setFontSize}
        onUndo={engine.undo}
        onRedo={engine.redo}
        onClear={engine.clearCanvas}
        onExportPng={handleExportPng}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={engine.canvasRef}
            className="absolute inset-0"
            onMouseDown={engine.onMouseDown}
            onMouseMove={engine.onMouseMove}
            onMouseUp={engine.onMouseUp}
            onMouseLeave={engine.onMouseUp}
            onWheel={engine.onWheel}
            onDoubleClick={engine.onDoubleClick}
            onContextMenu={e => e.preventDefault()}
          />
          <div className="absolute bottom-2 left-2 flex gap-3 text-[10px] text-muted-foreground bg-white/80 px-2 py-1 rounded pointer-events-none">
            <span>{engine.tool}</span>
            <span>{engine.cursorPos.x}, {engine.cursorPos.y}</span>
            <span>{engine.zoomPercent}%</span>
          </div>
        </div>

        <AiPanel
          isOpen={aiOpen}
          onToggle={() => setAiOpen(!aiOpen)}
          shapes={engine.shapes}
          onAddShapes={engine.addShapes}
        />
      </div>
    </div>
  );
}
