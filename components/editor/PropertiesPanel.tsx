/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Settings2,
  Type,
  Bold,
  Italic,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { Monitor, Grid, Smartphone } from "lucide-react";

export default function PropertiesPanel() {
  const { selectedObject, canvas, setModified, canvasWidth, canvasHeight, canvasBackground, setCanvasWidth, setCanvasHeight, setCanvasBackground } = useEditorStore();
  const [properties, setProperties] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 1,
    fill: "#000000",
    stroke: "transparent",
    strokeWidth: 0,
    fontSize: 24,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textAlign: "left",
    text: ""
  });

  useEffect(() => {
    if (!selectedObject) return;

    const updateState = () => {
      setProperties({
        left: Math.round(selectedObject.left || 0),
        top: Math.round(selectedObject.top || 0),
        width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
        height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
        opacity: selectedObject.opacity || 1,
        fill: (selectedObject.fill as string) || "#000000",
        stroke: (selectedObject.stroke as string) || "transparent",
        strokeWidth: selectedObject.strokeWidth || 0,
        fontSize: (selectedObject as Record<string, any>).fontSize || 24,
        fontFamily: (selectedObject as Record<string, any>).fontFamily || "Arial",
        fontWeight: (selectedObject as Record<string, any>).fontWeight || "normal",
        fontStyle: (selectedObject as Record<string, any>).fontStyle || "normal",
        textAlign: (selectedObject as Record<string, any>).textAlign || "left",
        text: (selectedObject as Record<string, any>).text || ""
      });
    };

    updateState();

    // Sync when object is scaled or moved on canvas
    selectedObject.on("moving", updateState);
    selectedObject.on("scaling", updateState);
    selectedObject.on("modified", updateState);

    return () => {
      selectedObject.off("moving", updateState);
      selectedObject.off("scaling", updateState);
      selectedObject.off("modified", updateState);
    };
  }, [selectedObject]);

  const handleChange = (key: string, value: string | number) => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    if (key === "width") {
      activeObj.set("scaleX", Number(value) / (activeObj.width || 1));
    } else if (key === "height") {
      activeObj.set("scaleY", Number(value) / (activeObj.height || 1));
    } else if (key === "textAlign") {
      (activeObj as Record<string, any>).textAlign = value;
    } else {
      activeObj.set(key as keyof typeof activeObj, value);
    }

    canvas.requestRenderAll();
    setModified(true);
    setProperties(prev => ({ ...prev, [key]: value }));
  };

  const handleAlign = (type: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    const bound = activeObject.getBoundingRect();
    const canvasWidth = canvas.width!;
    const canvasHeight = canvas.height!;

    // For single objects, align relative to canvas.
    // For multiple objects, align relative to the selection's own bounding box.
    const targetBound = activeObject.type === 'activeSelection'
      ? bound
      : { left: 0, top: 0, width: canvasWidth, height: canvasHeight };

    const objects = activeObject.type === 'activeSelection'
      ? (activeObject as Record<string, any>).getObjects()
      : [activeObject];

    objects.forEach((obj: Record<string, any>) => {
      const objBound = obj.getBoundingRect();

      switch (type) {
        case 'left':
          obj.set({ left: obj.left + (targetBound.left - objBound.left) });
          break;
        case 'center-h':
          obj.set({ left: obj.left + (targetBound.left + targetBound.width / 2 - (objBound.left + objBound.width / 2)) });
          break;
        case 'right':
          obj.set({ left: obj.left + (targetBound.left + targetBound.width - (objBound.left + objBound.width)) });
          break;
        case 'top':
          obj.set({ top: obj.top + (targetBound.top - objBound.top) });
          break;
        case 'center-v':
          obj.set({ top: obj.top + (targetBound.top + targetBound.height / 2 - (objBound.top + objBound.height / 2)) });
          break;
        case 'bottom':
          obj.set({ top: obj.top + (targetBound.top + targetBound.height - (objBound.top + objBound.height)) });
          break;
      }
      obj.setCoords();
    });

    activeObject.setCoords();
    canvas.requestRenderAll();
    setModified(true);
  };

  if (!selectedObject) {
    return (
      <div className="space-y-6 p-4">
        {/* Canvas Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings2 size={14} className="text-purple-400" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white">Canvas Settings</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Width</label>
              <input
                type="number"
                value={canvasWidth}
                onChange={(e) => {
                  setCanvasWidth(parseInt(e.target.value) || 100);
                  setModified(true);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Height</label>
              <input
                type="number"
                value={canvasHeight}
                onChange={(e) => {
                  setCanvasHeight(parseInt(e.target.value) || 100);
                  setModified(true);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Background</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={canvasBackground}
                onChange={(e) => {
                  setCanvasBackground(e.target.value);
                  setModified(true);
                }}
                className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer p-0 overflow-hidden"
              />
              <input
                type="text"
                value={canvasBackground.toUpperCase()}
                onChange={(e) => {
                  setCanvasBackground(e.target.value);
                  setModified(true);
                }}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 font-mono uppercase"
              />
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-white/5 my-4" />

        {/* Quick Presets */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Quick Presets</label>
          <div className="grid gap-2">
            <button 
              onClick={() => { setCanvasWidth(1920); setCanvasHeight(1080); setModified(true); }}
              className="flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-left transition-colors"
            >
              <Monitor size={14} className="text-gray-400" />
              <div>
                <div className="text-[11px] font-bold text-white">Full HD (Web)</div>
                <div className="text-[9px] text-gray-500">1920 × 1080</div>
              </div>
            </button>
            <button 
              onClick={() => { setCanvasWidth(1080); setCanvasHeight(1080); setModified(true); }}
              className="flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-left transition-colors"
            >
              <Grid size={14} className="text-gray-400" />
              <div>
                <div className="text-[11px] font-bold text-white">Instagram Square</div>
                <div className="text-[9px] text-gray-500">1080 × 1080</div>
              </div>
            </button>
            <button 
              onClick={() => { setCanvasWidth(1080); setCanvasHeight(1920); setModified(true); }}
              className="flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-left transition-colors"
            >
              <Smartphone size={14} className="text-gray-400" />
              <div>
                <div className="text-[11px] font-bold text-white">Story / Reels</div>
                <div className="text-[9px] text-gray-500">1080 × 1920</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isText = selectedObject.type === "i-text" || selectedObject.type === "textbox";

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">X Position</label>
          <input
            type="number"
            value={properties.left}
            onChange={(e) => handleChange("left", parseInt(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Y Position</label>
          <input
            type="number"
            value={properties.top}
            onChange={(e) => handleChange("top", parseInt(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Width</label>
          <input
            type="number"
            value={properties.width}
            onChange={(e) => handleChange("width", parseInt(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Height</label>
          <input
            type="number"
            value={properties.height}
            onChange={(e) => handleChange("height", parseInt(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      <div className="h-[1px] bg-white/5" />

      {/* Object Alignment Section */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Alignment</label>
        <div className="space-y-2">
          {/* Horizontal Alignment */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAlign('left')}
              className="flex-1 flex items-center justify-center py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
              title="Align Left"
            >
              <AlignStartHorizontal size={16} />
            </button>
            <button
              onClick={() => handleAlign('center-h')}
              className="flex-1 flex items-center justify-center py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
              title="Align Center Horizontal"
            >
              <AlignCenterHorizontal size={16} />
            </button>
            <button
              onClick={() => handleAlign('right')}
              className="flex-1 flex items-center justify-center py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
              title="Align Right"
            >
              <AlignEndHorizontal size={16} />
            </button>
          </div>
          {/* Vertical Alignment */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAlign('top')}
              className="flex-1 flex items-center justify-center py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
              title="Align Top"
            >
              <AlignStartVertical size={16} />
            </button>
            <button
              onClick={() => handleAlign('center-v')}
              className="flex-1 flex items-center justify-center py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
              title="Align Center Vertical"
            >
              <AlignCenterVertical size={16} />
            </button>
            <button
              onClick={() => handleAlign('bottom')}
              className="flex-1 flex items-center justify-center py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
              title="Align Bottom"
            >
              <AlignEndVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="h-[1px] bg-white/5" />

      {isText && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Font Family</label>
            <select
              value={properties.fontFamily}
              onChange={(e) => handleChange("fontFamily", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors appearance-none"
            >
              {["Arial", "Inter", "Georgia", "Helvetica", "Times New Roman", "Courier New"].map(font => (
                <option key={font} value={font} className="bg-[#1e1e1e]">{font}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <Type size={10} /> Font Size
              </label>
              <input
                type="number"
                value={properties.fontSize}
                onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={properties.fill}
                  onChange={(e) => handleChange("fill", e.target.value)}
                  className="w-full h-8 rounded-lg bg-transparent border border-white/10 cursor-pointer p-0 overflow-hidden"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleChange("fontWeight", properties.fontWeight === "bold" ? "normal" : "bold")}
              className={`flex-1 flex items-center justify-center py-2 rounded-lg border transition-all ${properties.fontWeight === "bold"
                ? "bg-purple-500/20 border-purple-500 text-purple-400"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                }`}
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => handleChange("fontStyle", properties.fontStyle === "italic" ? "normal" : "italic")}
              className={`flex-1 flex items-center justify-center py-2 rounded-lg border transition-all ${properties.fontStyle === "italic"
                ? "bg-purple-500/20 border-purple-500 text-purple-400"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                }`}
            >
              <Italic size={16} />
            </button>
          </div>

        </div>
      )}

      {!isText && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Opacity</label>
              <span className="text-[10px] text-gray-400 font-mono">{Math.round(properties.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={properties.opacity}
              onChange={(e) => handleChange("opacity", parseFloat(e.target.value))}
              className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Fill Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={properties.fill}
                onChange={(e) => handleChange("fill", e.target.value)}
                className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer p-0 overflow-hidden"
              />
              <input
                type="text"
                value={properties.fill.toUpperCase()}
                onChange={(e) => handleChange("fill", e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 font-mono uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Stroke Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={properties.stroke === 'transparent' ? '#000000' : properties.stroke}
                onChange={(e) => handleChange("stroke", e.target.value)}
                className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer p-0 overflow-hidden"
              />
              <input
                type="text"
                value={properties.stroke.toUpperCase()}
                onChange={(e) => handleChange("stroke", e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 font-mono uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Stroke Width</label>
            <input
              type="number"
              min="0"
              max="50"
              value={properties.strokeWidth}
              onChange={(e) => handleChange("strokeWidth", parseInt(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}
