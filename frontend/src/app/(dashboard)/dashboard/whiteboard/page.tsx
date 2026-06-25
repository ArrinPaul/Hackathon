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

  // Custom Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('New Whiteboard');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchWhiteboards();
  }, [fetchWhiteboards]);

  const activeBoard = whiteboards.find(w => w.id === activeBoardId);

  const handleCreateBoard = () => {
    setNewBoardTitle('New Whiteboard');
    setIsCreateModalOpen(true);
  };

  const submitCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newBoardTitle.trim() || 'Untitled Whiteboard';
    const newBoard = await createWhiteboard(cleanTitle);
    if (newBoard) {
      setActiveBoardId(newBoard.id);
    }
    setIsCreateModalOpen(false);
  };

  const handleRenameBoard = async (id: string, newTitle: string) => {
    await updateWhiteboard(id, newTitle);
  };

  const handleDeleteBoard = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteBoard = async () => {
    if (!deleteConfirmId) return;
    const success = await deleteWhiteboard(deleteConfirmId);
    if (success && activeBoardId === deleteConfirmId) {
      setActiveBoardId(null);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-4 h-full relative">
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

      {/* Create Whiteboard In-App Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-border rounded-[12px] p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-1">Create New Whiteboard</h3>
            <p className="text-xs text-muted-foreground mb-4">Enter a title for your collaborative visual workspace.</p>
            <form onSubmit={submitCreateBoard} className="space-y-4">
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="e.g. System Architecture Diagram"
                className="w-full px-3 py-2 border border-border rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-muted text-muted-foreground rounded-[8px] text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-[8px] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation In-App Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-border rounded-[12px] p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-1">Delete Whiteboard</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Are you sure you want to delete "{whiteboards.find(w => w.id === deleteConfirmId)?.title || 'this whiteboard'}"? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-border hover:bg-muted text-muted-foreground rounded-[8px] text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBoard}
                className="px-4 py-2 bg-red-500 text-white rounded-[8px] text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
