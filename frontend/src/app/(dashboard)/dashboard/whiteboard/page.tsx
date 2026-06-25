'use client';

import { WhiteboardCanvas } from '@/features/whiteboard/components/WhiteboardCanvas';
import { PenTool } from 'lucide-react';

export default function WhiteboardPage() {
  return (
    <div className="space-y-4 h-[calc(100vh-120px)]">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PenTool className="w-6 h-6 text-primary" />
          Whiteboard
        </h1>
        <p className="text-muted-foreground mt-1">Draw diagrams, flowcharts, and brainstorm visually</p>
      </div>
      <WhiteboardCanvas />
    </div>
  );
}
