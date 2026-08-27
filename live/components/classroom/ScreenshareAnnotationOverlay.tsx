'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ScreenshareAnnotationToolbar from './ScreenshareAnnotationToolbar';

interface Point {
  x: number;
  y: number;
}

interface Annotation {
  id: string;
  userId: string;
  type: string; // 'pen' | 'highlighter' | 'text' | 'rect' | 'circle' | 'arrow' | 'line'
  color: string;
  size: 's' | 'm' | 'l';
  points: Point[];
  text?: string;
}

interface ScreenshareAnnotationOverlayProps {
  room: any;
  localParticipant: any;
  isTeacher: boolean;
  isAllowedToAnnotate: boolean;
  screenShareTrack: any;
  editor?: any; // tldraw editor instance
}

const PALETTE_COLORS: Record<string, string> = {
  red: '#E5484D',
  orange: '#F5A623',
  yellow: '#FFD60A',
  green: '#46A758',
  blue: '#0091FF',
  violet: '#6E5FF0',
  black: '#0D0D14',
  white: '#E8E8F0',
};

export default function ScreenshareAnnotationOverlay({
  room,
  localParticipant,
  isTeacher,
  isAllowedToAnnotate,
  screenShareTrack,
  editor,
}: ScreenshareAnnotationOverlayProps) {
  const [activeTool, setActiveTool] = useState<string>('select');
  const [activeColor, setActiveColor] = useState<string>('red');
  const [activeSize, setActiveSize] = useState<'s' | 'm' | 'l'>('m');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Annotation | null>(null);
  
  // Text Input Overlay state
  const [textInput, setTextInput] = useState<{ x: number; y: number; val: string } | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Undo/Redo History Stacks
  const historyRef = useRef<Annotation[][]>([[]]);
  const historyIndexRef = useRef<number>(0);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Broadcast Helper
  const broadcast = useCallback((msg: any, reliable = false) => {
    if (!room || !localParticipant) return;
    try {
      const encoder = new TextEncoder();
      const payload = encoder.encode(JSON.stringify(msg));
      room.localParticipant.publishData(payload, {
        reliable,
        topic: 'screenshare-annotation',
      });
    } catch (err) {
      console.error('[AnnotationOverlay] Broadcast error:', err);
    }
  }, [room, localParticipant]);

  // Show Toast Helper
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Redraw Canvas
  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    const renderAnnotation = (ann: Annotation) => {
      if (ann.points.length === 0) return;

      ctx.save();
      const hexColor = PALETTE_COLORS[ann.color] || ann.color;
      ctx.strokeStyle = hexColor;
      ctx.fillStyle = hexColor;

      // Base sizes relative to width
      let thickness = 4;
      const sizeMultiplier = w / 1000;
      if (ann.size === 's') thickness = 2.5 * sizeMultiplier;
      else if (ann.size === 'm') thickness = 5 * sizeMultiplier;
      else if (ann.size === 'l') thickness = 10 * sizeMultiplier;

      ctx.lineWidth = Math.max(1.5, thickness);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (ann.type === 'highlighter') {
        ctx.globalAlpha = 0.45;
        // Highlighters are thicker
        ctx.lineWidth = Math.max(4, thickness * 2.5);
      } else {
        ctx.globalAlpha = 1.0;
      }

      const p0 = ann.points[0];
      const pLast = ann.points[ann.points.length - 1];

      if (ann.type === 'pen' || ann.type === 'highlighter') {
        ctx.beginPath();
        ctx.moveTo(p0.x * w, p0.y * h);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x * w, ann.points[i].y * h);
        }
        ctx.stroke();
      } else if (ann.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(p0.x * w, p0.y * h);
        ctx.lineTo(pLast.x * w, pLast.y * h);
        ctx.stroke();
      } else if (ann.type === 'arrow') {
        const fromX = p0.x * w;
        const fromY = p0.y * h;
        const toX = pLast.x * w;
        const toY = pLast.y * h;

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const headlen = Math.max(8, thickness * 2.5);
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (ann.type === 'rect') {
        const x1 = p0.x * w;
        const y1 = p0.y * h;
        const x2 = pLast.x * w;
        const y2 = pLast.y * h;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      } else if (ann.type === 'circle') {
        const x1 = p0.x * w;
        const y1 = p0.y * h;
        const x2 = pLast.x * w;
        const y2 = pLast.y * h;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const rx = Math.abs(x2 - x1) / 2;
        const ry = Math.abs(y2 - y1) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (ann.type === 'text') {
        const fontSize = Math.max(14, 20 * sizeMultiplier);
        ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textBaseline = 'top';
        
        // Multi-line support
        const lines = (ann.text || '').split('\n');
        lines.forEach((line, idx) => {
          ctx.fillText(line, p0.x * w, p0.y * h + idx * (fontSize * 1.2));
        });
      }

      ctx.restore();
    };

    // Draw past annotations
    annotations.forEach(renderAnnotation);

    // Draw active local stroke
    if (currentStroke) {
      renderAnnotation(currentStroke);
    }
  }, [annotations, currentStroke]);

  // Sync/Redraw size when video frame or window updates
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const video = container.parentElement?.querySelector('video');

    const updateSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;

      if (video) {
        canvas.style.position = 'absolute';
        canvas.style.width = `${video.clientWidth}px`;
        canvas.style.height = `${video.clientHeight}px`;
        canvas.style.left = `${video.offsetLeft}px`;
        canvas.style.top = `${video.offsetTop}px`;

        const targetW = video.clientWidth * dpr;
        const targetH = video.clientHeight * dpr;

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
      } else {
        canvas.style.position = 'absolute';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.left = '0px';
        canvas.style.top = '0px';

        const targetW = window.innerWidth * dpr;
        const targetH = window.innerHeight * dpr;

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
      }
      
      drawAll();
    };

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    if (video) {
      observer.observe(video);
    }
    observer.observe(container);

    window.addEventListener('resize', updateSize);
    updateSize();
    const interval = setInterval(updateSize, 250);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
      clearInterval(interval);
    };
  }, [drawAll]);

  // Electron click-through toggling based on active tool
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      const isMouseMode = activeTool === 'select';
      (window as any).electronAPI.setIgnoreMouse(isMouseMode);
    }
  }, [activeTool]);

  // Handle incoming annotation synchronization messages
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant: any, _kind: any, topic?: string) => {
      if (topic !== 'screenshare-annotation') return;
      if (participant?.identity === localParticipant?.identity) return;

      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);

        if (msg.type === 'ANNOTATION_START') {
          // Temporarily hold remote stroke
          setCurrentStroke({
            id: msg.id,
            userId: participant.identity,
            type: msg.tool,
            color: msg.color,
            size: msg.size,
            points: [msg.point],
          });
        } 
        
        else if (msg.type === 'ANNOTATION_POINTS') {
          setCurrentStroke(prev => {
            if (prev && prev.id === msg.id) {
              return {
                ...prev,
                points: [...prev.points, ...msg.points],
              };
            }
            return prev;
          });
        } 
        
        else if (msg.type === 'ANNOTATION_END') {
          setCurrentStroke(prev => {
            if (prev && prev.id === msg.id) {
              setAnnotations(existing => {
                const updated = [...existing, prev];
                // Save history
                historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
                historyRef.current.push(updated);
                historyIndexRef.current = historyRef.current.length - 1;
                return updated;
              });
            }
            return null;
          });
        } 
        
        else if (msg.type === 'ANNOTATION_SHAPE') {
          setAnnotations(existing => {
            const updated = [...existing, {
              id: msg.id,
              userId: participant.identity,
              type: msg.shapeType,
              color: msg.color,
              size: msg.size,
              points: msg.points,
            }];
            historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
            historyRef.current.push(updated);
            historyIndexRef.current = historyRef.current.length - 1;
            return updated;
          });
        } 
        
        else if (msg.type === 'ANNOTATION_TEXT') {
          setAnnotations(existing => {
            const updated = [...existing, {
              id: msg.id,
              userId: participant.identity,
              type: 'text',
              color: msg.color,
              size: msg.size,
              points: [msg.point],
              text: msg.text,
            }];
            historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
            historyRef.current.push(updated);
            historyIndexRef.current = historyRef.current.length - 1;
            return updated;
          });
        } 
        
        else if (msg.type === 'ANNOTATION_CLEAR') {
          if (msg.scope === 'all') {
            setAnnotations([]);
            historyRef.current = [[]];
            historyIndexRef.current = 0;
          } else if (msg.scope === 'user') {
            setAnnotations(existing => {
              const updated = existing.filter(a => a.userId !== msg.userId);
              historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
              historyRef.current.push(updated);
              historyIndexRef.current = historyRef.current.length - 1;
              return updated;
            });
          }
        } 
        
        else if (msg.type === 'ANNOTATION_UNDO') {
          setAnnotations(existing => {
            // Remove the last annotation belonging to that user
            const reversed = [...existing].reverse();
            const targetIdx = reversed.findIndex(a => a.id === msg.id);
            if (targetIdx !== -1) {
              const updated = existing.filter(a => a.id !== msg.id);
              historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
              historyRef.current.push(updated);
              historyIndexRef.current = historyRef.current.length - 1;
              return updated;
            }
            return existing;
          });
        }
        
        else if (msg.type === 'REQUEST_ANNOTATION_STATE') {
          // Only the screensharer responds
          const isScreensharer = screenShareTrack?.participant.identity === localParticipant?.identity;
          if (isScreensharer) {
            broadcast({
              type: 'SYNC_ANNOTATION_STATE',
              annotations,
            }, true);
          }
        } 
        
        else if (msg.type === 'SYNC_ANNOTATION_STATE') {
          setAnnotations(msg.annotations);
          historyRef.current = [msg.annotations];
          historyIndexRef.current = 0;
        }
      } catch (err) {
        console.error('[AnnotationOverlay] Parse error:', err);
      }
    };

    room.on('dataReceived', handleDataReceived);
    return () => room.off('dataReceived', handleDataReceived);
  }, [room, localParticipant, annotations, screenShareTrack, broadcast]);

  // Request active state on mount if joining an ongoing screen share
  useEffect(() => {
    const isScreensharer = screenShareTrack?.participant.identity === localParticipant?.identity;
    if (screenShareTrack && !isScreensharer) {
      const timer = setTimeout(() => {
        broadcast({
          type: 'REQUEST_ANNOTATION_STATE',
          userId: localParticipant?.identity,
        }, true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [screenShareTrack, localParticipant, broadcast]);

  // Capture Mouse/Pointer Coordinates Normalized (0 to 1)
  const getNormalizedPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x, y };
  };

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAllowedToAnnotate || activeTool === 'select') return;
    
    // Auto-focus text input and block draw if clicked while typing
    if (textInput) {
      handleTextCommit();
      return;
    }

    const pos = getNormalizedPos(e);
    const pixelX = pos.x * (canvasRef.current?.width || 0) / (window.devicePixelRatio || 1);
    const pixelY = pos.y * (canvasRef.current?.height || 0) / (window.devicePixelRatio || 1);

    // Eraser Tool logic
    if (activeTool === 'eraser') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const px = pos.x * canvas.width;
      const py = pos.y * canvas.height;
      const threshold = 18; // px eraser size

      const target = annotations.find(ann => {
        // Teachers can delete anything; students only their own
        if (!isTeacher && ann.userId !== localParticipant?.identity) return false;
        
        return ann.points.some(pt => {
          const dx = pt.x * canvas.width - px;
          const dy = pt.y * canvas.height - py;
          return Math.sqrt(dx * dx + dy * dy) < threshold;
        });
      });

      if (target) {
        setAnnotations(existing => {
          const updated = existing.filter(a => a.id !== target.id);
          historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
          historyRef.current.push(updated);
          historyIndexRef.current = historyRef.current.length - 1;
          return updated;
        });
        broadcast({
          type: 'ANNOTATION_UNDO',
          id: target.id,
          userId: localParticipant?.identity,
        }, true);
      }
      return;
    }

    // Text Tool logic
    if (activeTool === 'text') {
      setTextInput({
        x: pixelX,
        y: pixelY,
        val: '',
      });
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }

    // Start drawing
    isDrawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const strokeId = `${localParticipant?.identity}-${Date.now()}`;
    const newStroke: Annotation = {
      id: strokeId,
      userId: localParticipant?.identity || '',
      type: activeTool,
      color: activeColor,
      size: activeSize,
      points: [pos],
    };

    setCurrentStroke(newStroke);

    // Only broadcast start immediately for freehand (pen, highlighter)
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      broadcast({
        type: 'ANNOTATION_START',
        id: strokeId,
        tool: activeTool,
        color: activeColor,
        size: activeSize,
        point: pos,
      }, true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStroke) return;

    const pos = getNormalizedPos(e);

    // Apply dead-zone filter to throttle points
    const lastPt = currentStroke.points[currentStroke.points.length - 1];
    if (lastPt) {
      const dx = pos.x - lastPt.x;
      const dy = pos.y - lastPt.y;
      if (Math.sqrt(dx*dx + dy*dy) < 0.0015) return; 
    }

    const updatedPoints = [...currentStroke.points, pos];
    setCurrentStroke({
      ...currentStroke,
      points: updatedPoints,
    });

    if (currentStroke.type === 'pen' || currentStroke.type === 'highlighter') {
      broadcast({
        type: 'ANNOTATION_POINTS',
        id: currentStroke.id,
        points: [pos],
      }, false);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStroke) return;
    isDrawingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const finalizedStroke = currentStroke;
    setCurrentStroke(null);

    // For shapes, broadcast the finalized geometry upon release
    if (finalizedStroke.type !== 'pen' && finalizedStroke.type !== 'highlighter') {
      broadcast({
        type: 'ANNOTATION_SHAPE',
        id: finalizedStroke.id,
        shapeType: finalizedStroke.type,
        color: finalizedStroke.color,
        size: finalizedStroke.size,
        points: finalizedStroke.points,
      }, true);
    } else {
      broadcast({
        type: 'ANNOTATION_END',
        id: finalizedStroke.id,
      }, true);
    }

    setAnnotations(existing => {
      const updated = [...existing, finalizedStroke];
      // Save history
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(updated);
      historyIndexRef.current = historyRef.current.length - 1;
      return updated;
    });
  };

  // Textbox commit handler
  const handleTextCommit = () => {
    if (!textInput) return;
    const trimmed = textInput.val.trim();
    
    if (trimmed.length > 0 && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const normalizedPoint = {
        x: textInput.x / rect.width,
        y: textInput.y / rect.height,
      };

      const strokeId = `${localParticipant?.identity}-${Date.now()}`;
      const newTextAnn: Annotation = {
        id: strokeId,
        userId: localParticipant?.identity || '',
        type: 'text',
        color: activeColor,
        size: activeSize,
        points: [normalizedPoint],
        text: trimmed,
      };

      setAnnotations(existing => {
        const updated = [...existing, newTextAnn];
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(updated);
        historyIndexRef.current = historyRef.current.length - 1;
        return updated;
      });

      broadcast({
        type: 'ANNOTATION_TEXT',
        id: strokeId,
        color: activeColor,
        size: activeSize,
        point: normalizedPoint,
        text: trimmed,
      }, true);
    }
    setTextInput(null);
  };

  // Toolbar action functions
  const handleUndo = () => {
    // Find the last annotation drawn by the local user
    const localAnns = annotations.filter(a => a.userId === localParticipant?.identity);
    if (localAnns.length === 0) return;
    const target = localAnns[localAnns.length - 1];

    setAnnotations(existing => {
      const updated = existing.filter(a => a.id !== target.id);
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(updated);
      historyIndexRef.current = historyRef.current.length - 1;
      return updated;
    });

    broadcast({
      type: 'ANNOTATION_UNDO',
      id: target.id,
      userId: localParticipant?.identity,
    }, true);
  };

  const handleRedo = () => {
    // Basic local redo
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const nextIndex = historyIndexRef.current + 1;
      const nextState = historyRef.current[nextIndex];
      
      // Find what was added in nextState vs current annotations
      const added = nextState.filter(a => !annotations.some(curr => curr.id === a.id));
      added.forEach(item => {
        if (item.type === 'text') {
          broadcast({
            type: 'ANNOTATION_TEXT',
            id: item.id,
            color: item.color,
            size: item.size,
            point: item.points[0],
            text: item.text,
          }, true);
        } else if (item.type === 'pen' || item.type === 'highlighter') {
          // Re-broadcast whole stroke
          broadcast({
            type: 'ANNOTATION_START',
            id: item.id,
            tool: item.type,
            color: item.color,
            size: item.size,
            point: item.points[0],
          }, true);
          // Send intermediate chunks
          broadcast({
            type: 'ANNOTATION_POINTS',
            id: item.id,
            points: item.points.slice(1),
          }, true);
          broadcast({
            type: 'ANNOTATION_END',
            id: item.id,
          }, true);
        } else {
          broadcast({
            type: 'ANNOTATION_SHAPE',
            id: item.id,
            shapeType: item.type,
            color: item.color,
            size: item.size,
            points: item.points,
          }, true);
        }
      });

      // Find what was deleted (undo of an erase)
      const deleted = annotations.filter(a => !nextState.some(next => next.id === a.id));
      deleted.forEach(item => {
        broadcast({
          type: 'ANNOTATION_UNDO',
          id: item.id,
          userId: localParticipant?.identity,
        }, true);
      });

      setAnnotations(nextState);
      historyIndexRef.current = nextIndex;
    }
  };

  const handleClearAll = () => {
    if (!isTeacher) return;
    setAnnotations([]);
    historyRef.current = [[]];
    historyIndexRef.current = 0;
    
    broadcast({
      type: 'ANNOTATION_CLEAR',
      scope: 'all',
    }, true);
  };

  const handleClearMine = () => {
    setAnnotations(existing => {
      const updated = existing.filter(a => a.userId !== localParticipant?.identity);
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(updated);
      historyIndexRef.current = historyRef.current.length - 1;
      return updated;
    });

    broadcast({
      type: 'ANNOTATION_CLEAR',
      scope: 'user',
      userId: localParticipant?.identity,
    }, true);
  };

  // Export Snapshot to Whiteboard function
  const handleExport = async () => {
    if (!isTeacher || !editor) return;
    const container = containerRef.current;
    if (!container) return;

    const video = container.parentElement?.querySelector('video');
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      showToast('Could not find screenshare video element or drawing canvas.', 'error');
      return;
    }

    setIsExporting(true);
    try {
      // 1. Create an offscreen canvas matching the video's natural dimensions
      const offscreen = document.createElement('canvas');
      const w = video.videoWidth || video.clientWidth || 1280;
      const h = video.videoHeight || video.clientHeight || 720;
      offscreen.width = w;
      offscreen.height = h;

      const ctx = offscreen.getContext('2d');
      if (!ctx) throw new Error('Failed to acquire 2D context for screenshot merge');

      // 2. Draw screenshare video frame
      ctx.drawImage(video, 0, 0, w, h);

      // 3. Draw active annotations overlay on top (scaled to video width/height)
      ctx.drawImage(canvas, 0, 0, w, h);

      // 4. Convert offscreen merged result to Blob
      const blob: Blob = await new Promise((resolve, reject) => {
        offscreen.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas to Blob conversion failed'));
        }, 'image/png');
      });

      const file = new File([blob], `screenshare-snapshot-${Date.now()}.png`, { type: 'image/png' });

      // 5. Append to whiteboard using standard classroom helper
      const { importImage } = await import('./whiteboard-helpers');
      await importImage(editor, file);

      showToast('Snapshot exported to Whiteboard as a new page!', 'success');
    } catch (err) {
      console.error('[AnnotationOverlay] Failed to export snapshot:', err);
      showToast('Failed to export snapshot: ' + (err as Error).message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setActiveTool('select');
    // Clear all our local state drawings
    setAnnotations([]);
    historyRef.current = [[]];
    historyIndexRef.current = 0;
    broadcast({
      type: 'ANNOTATION_CLEAR',
      scope: 'user',
      userId: localParticipant?.identity,
    }, true);
  };

  const canUndo = annotations.some(a => a.userId === localParticipant?.identity);
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  // Render loop triggers on annotation state changes
  useEffect(() => {
    drawAll();
  }, [drawAll]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-30 pointer-events-none"
    >
      {/* 1. Transparent Drawing Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`w-full h-full block ${
          activeTool !== 'select' && isAllowedToAnnotate ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
        }`}
      />

      {/* 2. Text Input Overlay */}
      {textInput && (
        <div
          className="absolute z-50 pointer-events-auto p-1 bg-surface border border-primary/40 rounded-lg shadow-xl"
          style={{ left: textInput.x, top: textInput.y }}
        >
          <textarea
            ref={textInputRef}
            value={textInput.val}
            onChange={(e) => setTextInput({ ...textInput, val: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTextCommit();
              }
            }}
            onBlur={handleTextCommit}
            className="w-48 min-h-[36px] max-h-[120px] bg-transparent text-foreground border-none outline-none resize-none text-sm p-1 leading-normal font-medium"
            placeholder="Type text, press Enter..."
          />
        </div>
      )}

      {/* 3. Floating Annotation Toolbar (only rendered if user has annotation permission) */}
      {isAllowedToAnnotate && (
        <div className="pointer-events-auto">
          <ScreenshareAnnotationToolbar
            isTeacher={isTeacher}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            activeColor={activeColor}
            setActiveColor={setActiveColor}
            activeSize={activeSize}
            setActiveSize={setActiveSize}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClearAll={handleClearAll}
            onClearMine={handleClearMine}
            onExport={handleExport}
            canUndo={canUndo}
            canRedo={canRedo}
            isExporting={isExporting}
            onClose={handleClose}
          />
        </div>
      )}

      {/* 4. Beautiful floating toast alerts */}
      {toast && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] px-5 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 flex items-center gap-2 pointer-events-auto animate-bounce text-sm font-semibold text-white ${
            toast.type === 'success'
              ? 'bg-[#10b981]/90 border-[#10b981]/30'
              : 'bg-[#ef4444]/90 border-[#ef4444]/30'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
