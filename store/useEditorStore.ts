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
}));
