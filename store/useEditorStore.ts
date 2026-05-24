import { create } from 'zustand';
import { Canvas, FabricObject } from 'fabric';

export type ToolType = 'select' | 'move' | 'rect' | 'ellipse' | 'text' | 'ai' | 'lasso' | 'crop' | 'eraser';

interface EditorState {
  activeTool: ToolType;
  canvas: Canvas | null;
  selectedObject: FabricObject | null;
  zoom: number;
  isModified: boolean;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  setActiveTool: (tool: ToolType) => void;
  setCanvas: (canvas: Canvas | null) => void;
  setSelectedObject: (obj: FabricObject | null) => void;
  setZoom: (zoom: number) => void;
  setModified: (modified: boolean) => void;
  setFillColor: (color: string) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  activeRightTab: 'Layers' | 'Properties' | 'Export';
  setActiveRightTab: (tab: 'Layers' | 'Properties' | 'Export') => void;
  isAssetsDrawerOpen: boolean;
  setAssetsDrawerOpen: (open: boolean) => void;
  canvasWidth: number;
  canvasHeight: number;
  canvasBackground: string;
  setCanvasWidth: (width: number) => void;
  setCanvasHeight: (height: number) => void;
  setCanvasBackground: (bg: string) => void;

  history: string[];
  historyIndex: number;
  isHistoryMutating: boolean;
  pushHistory: (state: string) => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: 'select',
  canvas: null,
  selectedObject: null,
  zoom: 100,
  isModified: false,
  fillColor: '#7C3AED',
  strokeColor: 'transparent',
  strokeWidth: 0,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setCanvas: (canvas) => set({ canvas }),
  setSelectedObject: (obj) => set({ selectedObject: obj }),
  setZoom: (zoom) => set({ zoom }),
  setModified: (isModified) => set({ isModified }),
  setFillColor: (fillColor) => set({ fillColor }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  activeRightTab: 'Layers',
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),
  isAssetsDrawerOpen: false,
  setAssetsDrawerOpen: (open) => set({ isAssetsDrawerOpen: open }),
  canvasWidth: 1080,
  canvasHeight: 1080,
  canvasBackground: '#ffffff',
  setCanvasWidth: (width) => set({ canvasWidth: width }),
  setCanvasHeight: (height) => set({ canvasHeight: height }),
  setCanvasBackground: (bg) => set({ canvasBackground: bg }),

  history: [],
  historyIndex: -1,
  isHistoryMutating: false,
  pushHistory: (state) => set((s) => {
    if (s.isHistoryMutating) return s;
    
    // If we're not at the end of the history, slice off the future redo states
    const currentHistory = s.history.slice(0, s.historyIndex + 1);
    
    // Don't push if the state hasn't changed (prevents duplicate consecutive states)
    if (currentHistory.length > 0 && currentHistory[currentHistory.length - 1] === state) {
      return s;
    }
    
    const newHistory = [...currentHistory, state];
    // Keep max 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    return {
      history: newHistory,
      historyIndex: newHistory.length - 1
    };
  }),
  undo: () => set((s) => {
    if (s.historyIndex > 0 && !s.isHistoryMutating) {
      const newIndex = s.historyIndex - 1;
      const stateToLoad = s.history[newIndex];
      
      s.canvas?.loadFromJSON(JSON.parse(stateToLoad)).then(() => {
        s.canvas?.requestRenderAll();
        // Use setState on the store outside the callback to clear the mutation flag
        useEditorStore.setState({ isHistoryMutating: false });
      });
      
      return { historyIndex: newIndex, isHistoryMutating: true };
    }
    return s;
  }),
  redo: () => set((s) => {
    if (s.historyIndex < s.history.length - 1 && !s.isHistoryMutating) {
      const newIndex = s.historyIndex + 1;
      const stateToLoad = s.history[newIndex];
      
      s.canvas?.loadFromJSON(JSON.parse(stateToLoad)).then(() => {
        s.canvas?.requestRenderAll();
        useEditorStore.setState({ isHistoryMutating: false });
      });
      
      return { historyIndex: newIndex, isHistoryMutating: true };
    }
    return s;
  }),
}));
