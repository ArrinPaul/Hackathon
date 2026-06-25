import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Shape, Viewport } from '../lib/shapes';
import { Layer } from './useCanvasEngine';

export interface Whiteboard {
  id: string;
  student_id: string;
  title: string;
  data: {
    shapes?: Shape[];
    viewport?: Viewport;
    layers?: Layer[];
  };
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export function useWhiteboards() {
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWhiteboards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ whiteboards: Whiteboard[] }>('/api/whiteboards');
      setWhiteboards(res.whiteboards || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch whiteboards');
    } finally {
      setLoading(false);
    }
  }, []);

  const createWhiteboard = useCallback(async (title: string = 'Untitled Whiteboard') => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ whiteboard: Whiteboard }>('/api/whiteboards', {
        title,
        data: {
          shapes: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          layers: [{ id: 'default', name: 'Layer 1', visible: true, locked: false }]
        }
      });
      setWhiteboards(prev => [res.whiteboard, ...prev]);
      return res.whiteboard;
    } catch (err: any) {
      setError(err.message || 'Failed to create whiteboard');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWhiteboard = useCallback(async (id: string, title: string) => {
    setError('');
    try {
      const res = await api.put<{ whiteboard: Whiteboard }>(`/api/whiteboards/${id}`, { title });
      setWhiteboards(prev => prev.map(wb => wb.id === id ? res.whiteboard : wb));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update whiteboard');
      return false;
    }
  }, []);

  const deleteWhiteboard = useCallback(async (id: string) => {
    setError('');
    try {
      await api.delete(`/api/whiteboards/${id}`);
      setWhiteboards(prev => prev.filter(wb => wb.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete whiteboard');
      return false;
    }
  }, []);

  return {
    whiteboards,
    loading,
    error,
    fetchWhiteboards,
    createWhiteboard,
    updateWhiteboard,
    deleteWhiteboard
  };
}
