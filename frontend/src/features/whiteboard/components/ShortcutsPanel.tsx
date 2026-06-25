'use client';

import { X } from 'lucide-react';

interface ShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsPanel({ isOpen, onClose }: ShortcutsPanelProps) {
  if (!isOpen) return null;

  const groups = [
    {
      title: 'Tools',
      shortcuts: [
        { key: 'V', desc: 'Select Tool' },
        { key: 'P', desc: 'Pen Tool' },
        { key: 'R', desc: 'Rectangle' },
        { key: 'E', desc: 'Ellipse' },
        { key: 'D', desc: 'Diamond' },
        { key: 'T', desc: 'Text Tool' },
        { key: 'A', desc: 'Arrow Connect' },
        { key: 'S', desc: 'Sticky Note' },
        { key: 'I', desc: 'Image Tool' },
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        { key: 'Ctrl + Z', desc: 'Undo' },
        { key: 'Ctrl + Y', desc: 'Redo' },
        { key: 'Del / Backspace', desc: 'Delete Selected' },
        { key: 'Double Click', desc: 'Edit Shape Text' },
        { key: 'Ctrl + G', desc: 'Group Shapes' },
        { key: 'Ctrl + Shift + G', desc: 'Ungroup Shapes' },
      ],
    },
    {
      title: 'Navigation',
      shortcuts: [
        { key: 'Space + Drag', desc: 'Pan Canvas' },
        { key: 'Scroll Wheel', desc: 'Zoom In/Out' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[10px] shadow-xl max-w-md w-full border border-border flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-[6px] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {groups.map(group => (
            <div key={group.title} className="space-y-2">
              <h4 className="font-medium text-primary uppercase tracking-wider text-[10px]">{group.title}</h4>
              <div className="grid grid-cols-1 gap-2">
                {group.shortcuts.map(s => (
                  <div key={s.key} className="flex items-center justify-between py-1 border-b border-dashed border-border/50">
                    <span className="text-muted-foreground">{s.desc}</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono text-[10px] shadow-sm">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
