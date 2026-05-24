"use client";

import React from "react";
import {
  MousePointer2,
  Move,
  Sparkles,
  Square,
  Circle,
  Type,
  LassoSelect,
  Crop,
  Eraser,
  Image as ImageIcon
} from "lucide-react";
import { useEditorStore, ToolType } from "@/store/useEditorStore";
import { cn } from "@/lib/utils";

interface ToolButtonProps {
  tool?: ToolType;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isSpecial?: boolean;
}

const ToolButton = ({ icon: Icon, label, isActive, onClick, isSpecial }: ToolButtonProps) => (
  <div className="relative group flex items-center justify-center w-full">
    <button
      onClick={onClick}
      className={cn(
        "p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center",
        isActive
          ? "bg-[#7C3AED] text-white shadow-lg shadow-purple-500/20"
          : "text-gray-400 hover:text-white hover:bg-white/5",
        isSpecial && "bg-gradient-to-br from-purple-600 to-blue-600 !text-white shadow-lg shadow-purple-500/30 scale-110 my-1"
      )}
    >
      <Icon size={isSpecial ? 20 : 18} strokeWidth={isActive ? 2.5 : 2} />
    </button>

    {/* Tooltip */}
    <div className="absolute left-14 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10 shadow-xl">
      {label}
    </div>
  </div>
);

const Divider = () => <div className="w-8 h-[1px] bg-white/5 my-1" />;

export default function Toolbar() {
  const { activeTool, setActiveTool, canvas, isAssetsDrawerOpen, setAssetsDrawerOpen, activeRightTab, setActiveRightTab } = useEditorStore();

  const handleToolClick = (tool: ToolType) => {
    if (!canvas) return;

    setActiveTool(tool);

    // Specific tool behaviors
    if (tool === 'select') {
      canvas.isDrawingMode = false;
      canvas.selection = true;
    } else {
      // For shape tools, we'll handle the actual adding in the canvas component
      // but we ensure selection is off if drawing or adding shapes
      canvas.selection = false;
    }
  };

  return (
    <aside className="w-16 h-full bg-[#0a0a1a] border-r border-white/5 flex flex-col items-center py-4 gap-2 z-40">
      <ToolButton
        tool="select"
        icon={MousePointer2}
        label="Select (V)"
        isActive={activeTool === 'select'}
        onClick={() => handleToolClick('select')}
      />
      <ToolButton
        tool="move"
        icon={Move}
        label="Move (M)"
        isActive={activeTool === 'move'}
        onClick={() => handleToolClick('move')}
      />

      <Divider />

      <ToolButton
        tool="ai"
        icon={Sparkles}
        label="AI Generate"
        isActive={activeTool === 'ai'}
        onClick={() => {
          handleToolClick('ai');
          document.getElementById('prompt-bar-input')?.focus();
        }}
        isSpecial
      />

      <Divider />

      <ToolButton
        tool="rect"
        icon={Square}
        label="Rectangle (R)"
        isActive={activeTool === 'rect'}
        onClick={() => handleToolClick('rect')}
      />
      <ToolButton
        tool="ellipse"
        icon={Circle}
        label="Ellipse (O)"
        isActive={activeTool === 'ellipse'}
        onClick={() => handleToolClick('ellipse')}
      />
      <ToolButton
        tool="text"
        icon={Type}
        label="Text (T)"
        isActive={activeTool === 'text'}
        onClick={() => handleToolClick('text')}
      />

      <Divider />

      <ToolButton
        tool="lasso"
        icon={LassoSelect}
        label="Lasso (L)"
        isActive={activeTool === 'lasso'}
        onClick={() => handleToolClick('lasso')}
      />
      <ToolButton
        tool="crop"
        icon={Crop}
        label="Crop (C)"
        isActive={activeTool === 'crop'}
        onClick={() => handleToolClick('crop')}
      />
      <ToolButton
        tool="eraser"
        icon={Eraser}
        label="Eraser (E)"
        isActive={activeTool === 'eraser'}
        onClick={() => handleToolClick('eraser')}
      />

      <Divider />

      <ToolButton
        icon={ImageIcon}
        label="Assets"
        isActive={isAssetsDrawerOpen}
        onClick={() => setAssetsDrawerOpen(!isAssetsDrawerOpen)}
      />
    </aside>
  );
}
