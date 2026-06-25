import { useEffect, useState, useRef } from 'react';
import { Shape, Viewport } from '../lib/shapes';
import { Layer } from './useCanvasEngine';
import { api } from '@/lib/api';

export function useAutoSave(
  whiteboardId: string | null,
  shapes: Shape[],
  viewport: Viewport,
  layers: Layer[],
  title: string
) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitial = useRef(true);

  useEffect(() => {
    isInitial.current = true;
    setSaveStatus('idle');
  }, [whiteboardId]);

  useEffect(() => {
    if (!whiteboardId) return;

    if (isInitial.current) {
      isInitial.current = false;
      return;
    }

    setSaveStatus('saving');

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        await api.put(`/api/whiteboards/${whiteboardId}`, {
          title,
          data: { shapes, viewport, layers }
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to auto-save whiteboard:', err);
        setSaveStatus('error');
      }
    }, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [shapes, viewport, layers, title, whiteboardId]);

  return saveStatus;
}
