'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  IconPencil, 
  IconEraser, 
  IconTypography, 
  IconSquare, 
  IconCircle, 
  IconArrowRight, 
  IconMinus, 
  IconGripVertical,
  IconChevronUp,
  IconChevronDown,
  IconTrash,
  IconRotate2,
  IconRotateClockwise2,
  IconFileExport,
  IconX
} from '@tabler/icons-react';
import { Highlighter, MousePointer } from 'lucide-react';

interface ScreenshareAnnotationToolbarProps {
  isTeacher: boolean;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  activeSize: 's' | 'm' | 'l';
  setActiveSize: (size: 's' | 'm' | 'l') => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearAll: () => void;
  onClearMine: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isExporting: boolean;
  onClose: () => void;
}

const PALETTE = [
  { key: 'red', hex: '#E5484D', name: 'Red' },
  { key: 'orange', hex: '#F5A623', name: 'Orange' },
  { key: 'yellow', hex: '#FFD60A', name: 'Yellow' },
  { key: 'green', hex: '#46A758', name: 'Green' },
  { key: 'blue', hex: '#0091FF', name: 'Blue' },
  { key: 'violet', hex: '#6E5FF0', name: 'Violet' },
  { key: 'black', hex: '#0D0D14', name: 'Black' },
  { key: 'white', hex: '#E8E8F0', name: 'White' },
];

export default function ScreenshareAnnotationToolbar({
  isTeacher,
  activeTool,
  setActiveTool,
  activeColor,
  setActiveColor,
  activeSize,
  setActiveSize,
  onUndo,
  onRedo,
  onClearAll,
  onClearMine,
  onExport,
  canUndo,
  canRedo,
  isExporting,
  onClose
}: ScreenshareAnnotationToolbarProps) {
  const [position, setPosition] = useState({ x: 200, y: 80 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showClearMenu, setShowClearMenu] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  // Position toolbar in the top-center on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const x = (window.innerWidth - (isMinimized ? 150 : 580)) / 2;
      setPosition({ x: Math.max(10, x), y: 80 });
    }
  }, [isMinimized]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag when clicking the grip handle
    if (!(e.target as HTMLElement).closest('.drag-handle')) return;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    const newX = Math.max(10, Math.min(window.innerWidth - (isMinimized ? 100 : 550), dragStartRef.current.posX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - 80, dragStartRef.current.posY + dy));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    dragStartRef.current = null;
  };

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.color-menu-trigger') && !target.closest('.color-menu-panel')) {
        setShowColorMenu(false);
      }
      if (!target.closest('.size-menu-trigger') && !target.closest('.size-menu-panel')) {
        setShowSizeMenu(false);
      }
      if (!target.closest('.clear-menu-trigger') && !target.closest('.clear-menu-panel')) {
        setShowClearMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const sizeLabels = { s: 'Thin', m: 'Medium', l: 'Thick' };

  if (isMinimized) {
    return (
      <div
        ref={toolbarRef}
        className="fixed z-[999] flex items-center gap-2 px-3 py-2 rounded-full border bg-surface/90 border-border/40 shadow-2xl backdrop-blur-md text-foreground transition-all duration-150 select-none cursor-default"
        style={{ left: position.x, top: position.y }}
      >
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="drag-handle cursor-grab active:cursor-grabbing p-1 text-text-muted hover:text-foreground"
        >
          <IconGripVertical className="w-4 h-4" />
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-primary hover:bg-primary/30 rounded-full text-xs font-semibold cursor-pointer"
        >
          <IconPencil className="w-3.5 h-3.5" />
          <span>Expand Tools</span>
        </button>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-text-muted hover:bg-border/30 hover:text-danger cursor-pointer"
          title="Exit Annotation"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[999] flex items-center gap-1.5 p-2 rounded-2xl border bg-surface/95 border-border/40 shadow-2xl backdrop-blur-md text-foreground select-none cursor-default min-h-[52px]"
      style={{ left: position.x, top: position.y }}
    >
      {/* 1. Drag Handle */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="drag-handle cursor-grab active:cursor-grabbing p-1.5 text-text-muted hover:text-foreground"
      >
        <IconGripVertical className="w-4 h-4" />
      </div>

      {/* 2. Selection Mode (Mouse) */}
      <button
        onClick={() => { setActiveTool('select'); }}
        className={`p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
          activeTool === 'select' 
            ? 'bg-primary text-white font-semibold' 
            : 'hover:bg-border/30 text-foreground/80 hover:text-foreground'
        }`}
        title="Mouse Pointer (Click through)"
      >
        <MousePointer className="w-5 h-5" />
      </button>

      <div className="w-[1px] h-6 bg-border/20 mx-0.5" />

      {/* 3. Drawing Tools */}
      <button
        onClick={() => { setActiveTool('pen'); }}
        className={`p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
          activeTool === 'pen' 
            ? 'bg-primary text-white font-semibold' 
            : 'hover:bg-border/30 text-foreground/80 hover:text-foreground'
        }`}
        title="Pen"
      >
        <IconPencil className="w-5 h-5" />
      </button>

      <button
        onClick={() => { setActiveTool('highlighter'); }}
        className={`p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
          activeTool === 'highlighter' 
            ? 'bg-primary text-white font-semibold' 
            : 'hover:bg-border/30 text-foreground/80 hover:text-foreground'
        }`}
        title="Highlighter"
      >
        <Highlighter className="w-5 h-5" />
      </button>

      <button
        onClick={() => { setActiveTool('text'); }}
        className={`p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
          activeTool === 'text' 
            ? 'bg-primary text-white font-semibold' 
            : 'hover:bg-border/30 text-foreground/80 hover:text-foreground'
        }`}
        title="Text"
      >
        <IconTypography className="w-5 h-5" />
      </button>

      <div className="w-[1px] h-6 bg-border/20 mx-0.5" />

      {/* 4. Shapes */}
      <button
        onClick={() => { setActiveTool('line'); }}
        className={`p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
          activeTool === 'line' 
            ? 'bg-primary text-white font-semibold' 
            : 'hover:bg-border/30 text-foreground/80 hover:text-foreground'
        }`}
        title="Line"
      >
        <IconMinus className="w-5 h-5" />
      </button>

      <button
        onClick={() => { setActiveTool('arrow'); }}
        className={`p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
          activeTool === 'arrow' 
            ? 'bg-primary text-white font-semibold' 
            : 'hover:bg-border/30 text-foreground/80 hover:text-foreground'
        }`}
        title="Arrow"
      >
        <IconArrowRight className="w-5 h-5" />
      </button>

      <button
        onClick={() => { setActiveTool('rect'); }}
        className={`p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
          activeTool === 'rect' 
            ? 'bg-primary text-white font-semibold' 
            : 'hover:bg-border/30 text-foreground/80 hover:text-foreground'
        }`}
        title="Rectangle"
      >
        <IconSquare className="w-5 h-5" />
      </button>

      <button
        onClick={() => { setActiveTool('circle'); }}
        className={`p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
          activeTool === 'circle' 
            ? 'bg-primary text-white font-semibold' 
            : 'hover:bg-border/30 text-foreground/80 hover:text-foreground'
        }`}
        title="Circle"
      >
        <IconCircle className="w-5 h-5" />
      </button>

      <button
        onClick={() => { setActiveTool('eraser'); }}
        className={`p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
          activeTool === 'eraser' 
            ? 'bg-primary text-white font-semibold' 
            : 'hover:bg-border/30 text-foreground/80 hover:text-foreground'
        }`}
        title="Eraser"
      >
        <IconEraser className="w-5 h-5" />
      </button>

      <div className="w-[1px] h-6 bg-border/20 mx-0.5" />

      {/* 5. Styling Controls (Color & Size) */}
      <div className="relative">
        <button
          onClick={() => setShowColorMenu(!showColorMenu)}
          className="color-menu-trigger flex items-center justify-center p-2 hover:bg-border/30 rounded-lg cursor-pointer"
          title="Color"
        >
          <div
            className="w-5 h-5 rounded-full border border-white/20 shadow-inner"
            style={{ backgroundColor: PALETTE.find(c => c.key === activeColor)?.hex || activeColor }}
          />
        </button>

        {showColorMenu && (
          <div className="color-menu-panel absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-xl bg-surface border border-border/40 shadow-2xl flex items-center gap-1.5 z-[1000] min-w-[200px]">
            {PALETTE.map((color) => (
              <button
                key={color.key}
                onClick={() => {
                  setActiveColor(color.key);
                  setShowColorMenu(false);
                }}
                className={`w-6 h-6 rounded-full border border-white/10 transition-transform duration-100 hover:scale-110 cursor-pointer ${
                  activeColor === color.key ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowSizeMenu(!showSizeMenu)}
          className="size-menu-trigger px-2.5 py-1.5 hover:bg-border/30 rounded-lg text-xs font-semibold flex items-center gap-1 text-foreground/80 hover:text-foreground cursor-pointer"
          title="Stroke Thickness"
        >
          <span>{sizeLabels[activeSize]}</span>
          <IconChevronDown className="w-3.5 h-3.5 text-text-muted" />
        </button>

        {showSizeMenu && (
          <div className="size-menu-panel absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1.5 rounded-xl bg-surface border border-border/40 shadow-2xl flex flex-col gap-1 z-[1000] min-w-[100px]">
            {(['s', 'm', 'l'] as const).map((size) => (
              <button
                key={size}
                onClick={() => {
                  setActiveSize(size);
                  setShowSizeMenu(false);
                }}
                className={`w-full px-3 py-1.5 rounded-lg text-left text-xs transition-colors duration-100 hover:bg-border/20 cursor-pointer ${
                  activeSize === size ? 'bg-primary/10 text-primary font-bold' : 'text-foreground/85'
                }`}
              >
                {sizeLabels[size]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-6 bg-border/20 mx-0.5" />

      {/* 6. Undo/Redo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
          canUndo 
            ? 'text-foreground/80 hover:bg-border/30 hover:text-foreground' 
            : 'text-text-muted opacity-40 cursor-not-allowed'
        }`}
        title="Undo"
      >
        <IconRotate2 className="w-5 h-5" />
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
          canRedo 
            ? 'text-foreground/80 hover:bg-border/30 hover:text-foreground' 
            : 'text-text-muted opacity-40 cursor-not-allowed'
        }`}
        title="Redo"
      >
        <IconRotateClockwise2 className="w-5 h-5" />
      </button>

      {/* 7. Clear Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowClearMenu(!showClearMenu)}
          className="clear-menu-trigger p-2 hover:bg-border/30 rounded-lg text-foreground/80 hover:text-foreground cursor-pointer"
          title="Clear drawings"
        >
          <IconTrash className="w-5 h-5" />
        </button>

        {showClearMenu && (
          <div className="clear-menu-panel absolute bottom-full right-0 mb-2 p-1.5 rounded-xl bg-surface border border-border/40 shadow-2xl flex flex-col gap-1 z-[1000] min-w-[150px]">
            <button
              onClick={() => {
                onClearMine();
                setShowClearMenu(false);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-xs text-foreground/85 hover:bg-border/20 cursor-pointer"
            >
              Clear My Drawings
            </button>
            {isTeacher && (
              <button
                onClick={() => {
                  onClearAll();
                  setShowClearMenu(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-left text-xs text-danger font-semibold hover:bg-danger/10 cursor-pointer"
              >
                Clear All Drawings
              </button>
            )}
          </div>
        )}
      </div>

      {/* 8. Export Snapshot (Teacher Only) */}
      {isTeacher && (
        <>
          <div className="w-[1px] h-6 bg-border/20 mx-0.5" />
          <button
            onClick={onExport}
            disabled={isExporting}
            className={`p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
              isExporting
                ? 'text-text-muted opacity-40 cursor-not-allowed'
                : 'text-primary hover:bg-primary/10 hover:text-primary-hover font-semibold'
            }`}
            title="Export Screen & Drawings to Whiteboard"
          >
            {isExporting ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
            ) : (
              <IconFileExport className="w-5 h-5" />
            )}
          </button>
        </>
      )}

      <div className="w-[1px] h-6 bg-border/20 mx-0.5" />

      {/* 9. Minimize & Close */}
      <button
        onClick={() => setIsMinimized(true)}
        className="p-2 rounded-lg hover:bg-border/30 text-text-muted hover:text-foreground cursor-pointer"
        title="Minimize Toolbar"
      >
        <IconChevronUp className="w-4 h-4" />
      </button>

      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-danger/15 text-text-muted hover:text-danger cursor-pointer"
        title="Exit Annotation"
      >
        <IconX className="w-4 h-4" />
      </button>
    </div>
  );
}
