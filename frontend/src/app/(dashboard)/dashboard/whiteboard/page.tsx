'use client';

import { useState, useEffect } from 'react';
import { useWhiteboards } from '@/features/whiteboard/hooks/useWhiteboards';
import { WhiteboardList } from '@/features/whiteboard/components/WhiteboardList';
import { WhiteboardCanvas } from '@/features/whiteboard/components/WhiteboardCanvas';
import { PenTool, Loader2 } from 'lucide-react';

export default function WhiteboardPage() {
  const {
    whiteboards,
    loading,
    fetchWhiteboards,
    createWhiteboard,
    updateWhiteboard,
    deleteWhiteboard,
  } = useWhiteboards();

  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

  useEffect(() => {
    fetchWhiteboards();
  }, [fetchWhiteboards]);

  const activeBoard = whiteboards.find(w => w.id === activeBoardId);

  const handleCreateBoard = async () => {
    const title = prompt('Enter whiteboard title:', 'New Whiteboard');
    if (title === null) return;
    const cleanTitle = title.trim() || 'Untitled Whiteboard';
    const newBoard = await createWhiteboard(cleanTitle);
    if (newBoard) {
      setActiveBoardId(newBoard.id);
    }
  };

  const handleRenameBoard = async (id: string, newTitle: string) => {
    await updateWhiteboard(id, newTitle);
  };

  const handleDeleteBoard = async (id: string) => {
    const success = await deleteWhiteboard(id);
    if (success && activeBoardId === id) {
      setActiveBoardId(null);
    }
  };

  return (
    <div className="space-y-4 h-full">
      {!activeBoardId ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PenTool className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Whiteboard</h1>
          </div>
          {loading && whiteboards.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <WhiteboardList
              whiteboards={whiteboards}
              onSelectBoard={setActiveBoardId}
              onCreateBoard={handleCreateBoard}
              onDeleteBoard={handleDeleteBoard}
              onRenameBoard={handleRenameBoard}
            />
          )}
        </div>
      ) : (
        <WhiteboardCanvas
          whiteboardId={activeBoardId}
          title={activeBoard?.title || 'Untitled Whiteboard'}
          onBack={() => {
            setActiveBoardId(null);
            fetchWhiteboards(); // Refresh list to update dates
          }}
        />
      )}
    </div>
  );
}
