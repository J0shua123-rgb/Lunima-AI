/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Settings2,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  Monitor,
  Grid,
  Smartphone
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { IText } from "fabric";

const SYSTEM_FONTS = ["Arial", "Inter", "Georgia", "Times New Roman", "Courier New", "Trebuchet MS"];
const GOOGLE_FONTS = ["Montserrat", "Playfair Display", "Poppins", "Roboto", "Lora", "Oswald", "Pacifico", "Great Vibes"];

const loadGoogleFont = (font: string) => {
  if (typeof window === "undefined") return;
  const fontId = `google-font-${font.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(fontId)) return;

  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700;900&display=swap`;
  document.head.appendChild(link);
};

export default function PropertiesPanel() {
  const {
    selectedObject,
    canvas,
    setModified,
    canvasWidth,
    canvasHeight,
    canvasBackground,
    setCanvasWidth,
    setCanvasHeight,
    setCanvasBackground,
    activeTool,
    setActiveTool,
    fillColor,
    eraserMode,
    eraserBrushSize,
    eraserStrength,
    setEraserMode,
    setEraserBrushSize,
    setEraserStrength
  } = useEditorStore();

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
    text: "",
    underline: false,
    linethrough: false,
    charSpacing: 0,
    lineHeight: 1.16,
    textBackgroundColor: "transparent",
  });

  // Load all Google fonts when properties panel mounts, so styles in drop-down and presets work immediately.
  useEffect(() => {
    GOOGLE_FONTS.forEach(font => loadGoogleFont(font));
  }, []);

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
        text: (selectedObject as Record<string, any>).text || "",
        underline: !!(selectedObject as Record<string, any>).underline,
        linethrough: !!(selectedObject as Record<string, any>).linethrough,
        charSpacing: (selectedObject as Record<string, any>).charSpacing || 0,
        lineHeight: (selectedObject as Record<string, any>).lineHeight || 1.16,
        textBackgroundColor: (selectedObject as Record<string, any>).textBackgroundColor || "transparent",
      });
    };

    updateState();

    // Sync when object is scaled, moved, or modified on canvas
    selectedObject.on("moving", updateState);
    selectedObject.on("scaling", updateState);
    selectedObject.on("modified", updateState);

    return () => {
      selectedObject.off("moving", updateState);
      selectedObject.off("scaling", updateState);
      selectedObject.off("modified", updateState);
    };
  }, [selectedObject]);

  const handleChange = useCallback((key: string, value: string | number | boolean) => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    if (key === "width") {
      activeObj.set("scaleX", Number(value) / (activeObj.width || 1));
    } else if (key === "height") {
      activeObj.set("scaleY", Number(value) / (activeObj.height || 1));
    } else if (key === "textAlign") {
      (activeObj as Record<string, any>).textAlign = value as string;
    } else {
      activeObj.set(key as any, value);
    }

    canvas.requestRenderAll();
    setModified(true);
    setProperties(prev => ({ ...prev, [key]: value }));
  }, [canvas, setModified]);

  const handleFontChange = useCallback((fontFamily: string) => {
    loadGoogleFont(fontFamily);
    handleChange("fontFamily", fontFamily);
    document.fonts.load(`1em "${fontFamily}"`).then(() => {
      canvas?.requestRenderAll();
    });
  }, [canvas, handleChange]);

  const handleAlign = (type: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    const bound = activeObject.getBoundingRect();
    const cw = canvas.width!;
    const ch = canvas.height!;

    // For single objects, align relative to canvas.
    // For multiple objects, align relative to the selection's own bounding box.
    const targetBound = activeObject.type === 'activeSelection'
      ? bound
      : { left: 0, top: 0, width: cw, height: ch };

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

  const addTextPreset = (
    textStr: string,
    fontSize: number,
    fontFamily: string,
    fontWeight: string,
    extraOptions: Record<string, any> = {}
  ) => {
    if (!canvas) return;

    loadGoogleFont(fontFamily);

    const cw = canvas.width!;
    const ch = canvas.height!;

    const text = new IText(textStr, {
      left: cw / 2,
      top: ch / 2,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fontWeight: fontWeight,
      fill: fillColor || "#000000",
      originX: "center",
      originY: "center",
      ...extraOptions
    });

    canvas.add(text);
    canvas.setActiveObject(text);

    document.fonts.load(`1em "${fontFamily}"`).then(() => {
      canvas.requestRenderAll();
    });

    canvas.requestRenderAll();
    setModified(true);
    setActiveTool("select");
  };

  if (activeTool === 'eraser') {
    return (
      <div className="space-y-6">
        {/* Eraser Tool Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-3 bg-purple-500 rounded-full animate-pulse" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white">Eraser Settings</h3>
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setEraserMode('delete')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${eraserMode === 'delete'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
              >
                Delete (Hard)
              </button>
              <button
                onClick={() => setEraserMode('fade')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${eraserMode === 'fade'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
              >
                Fade (Soft)
              </button>
            </div>
          </div>

          {/* Brush Size Slider */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Brush Size</label>
              <span className="text-[10px] text-gray-400 font-mono">{eraserBrushSize}px</span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              step="1"
              value={eraserBrushSize}
              onChange={(e) => setEraserBrushSize(parseInt(e.target.value))}
              className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Strength Slider (only shown in Fade mode) */}
          {eraserMode === 'fade' && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Eraser Strength</label>
                <span className="text-[10px] text-gray-400 font-mono">{eraserStrength}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={eraserStrength}
                onChange={(e) => setEraserStrength(parseInt(e.target.value))}
                className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTool === 'text' && !selectedObject) {
    return (
      <div className="space-y-6">
        {/* Text Tool Presets */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-3 bg-purple-500 rounded-full animate-pulse" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white">Text Options</h3>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Default Presets</label>
            <div className="grid gap-2">
              <button
                onClick={() => addTextPreset("Add Heading", 48, "Montserrat", "bold")}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-left transition-colors flex items-center justify-between"
              >
                <span className="text-lg font-extrabold text-white" style={{ fontFamily: "Montserrat" }}>Add Heading</span>
                <span className="text-[10px] text-gray-400">48px</span>
              </button>

              <button
                onClick={() => addTextPreset("Add Subheading", 28, "Poppins", "600")}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-left transition-colors flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-white" style={{ fontFamily: "Poppins" }}>Add Subheading</span>
                <span className="text-[10px] text-gray-400">28px</span>
              </button>

              <button
                onClick={() => addTextPreset("Add Body Text", 16, "Inter", "normal")}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-left transition-colors flex items-center justify-between"
              >
                <span className="text-xs text-white" style={{ fontFamily: "Inter" }}>Add Body Text</span>
                <span className="text-[10px] text-gray-400">16px</span>
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-white/5 my-4" />

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Styled Typography Pairings</label>
            <div className="grid gap-2">
              <button
                onClick={() => addTextPreset("Elegant Title", 40, "Playfair Display", "bold", { fontStyle: "italic" })}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-left transition-colors flex flex-col"
              >
                <span className="text-lg font-bold text-white italic" style={{ fontFamily: "Playfair Display" }}>Elegant Title</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Playfair Display</span>
              </button>

              <button
                onClick={() => addTextPreset("DISPLAY POSTER", 36, "Oswald", "bold")}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-left transition-colors flex flex-col"
              >
                <span className="text-lg font-extrabold text-white tracking-wide uppercase" style={{ fontFamily: "Oswald" }}>DISPLAY POSTER</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Oswald</span>
              </button>

              <button
                onClick={() => addTextPreset("Handwritten Signature", 32, "Pacifico", "normal")}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-left transition-colors flex flex-col"
              >
                <span className="text-lg text-white" style={{ fontFamily: "Pacifico" }}>Handwritten Signature</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Pacifico</span>
              </button>

              <button
                onClick={() => addTextPreset("Great Vibes", 36, "Great Vibes", "normal")}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-left transition-colors flex flex-col"
              >
                <span className="text-xl text-white" style={{ fontFamily: "Great Vibes" }}>Great Vibes</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Great Vibes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedObject) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
      {/* Position inputs in compact Figma coordinate style */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 focus-within:border-purple-500 transition-colors">
          <span className="text-[10px] font-bold text-gray-500 select-none w-3">X</span>
          <input
            type="number"
            value={properties.left}
            onChange={(e) => handleChange("left", parseInt(e.target.value) || 0)}
            className="w-full bg-transparent text-xs text-white outline-none text-right font-mono"
          />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 focus-within:border-purple-500 transition-colors">
          <span className="text-[10px] font-bold text-gray-500 select-none w-3">Y</span>
          <input
            type="number"
            value={properties.top}
            onChange={(e) => handleChange("top", parseInt(e.target.value) || 0)}
            className="w-full bg-transparent text-xs text-white outline-none text-right font-mono"
          />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 focus-within:border-purple-500 transition-colors">
          <span className="text-[10px] font-bold text-gray-500 select-none w-3">W</span>
          <input
            type="number"
            value={properties.width}
            onChange={(e) => handleChange("width", parseInt(e.target.value) || 1)}
            className="w-full bg-transparent text-xs text-white outline-none text-right font-mono"
          />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 focus-within:border-purple-500 transition-colors">
          <span className="text-[10px] font-bold text-gray-500 select-none w-3">H</span>
          <input
            type="number"
            value={properties.height}
            onChange={(e) => handleChange("height", parseInt(e.target.value) || 1)}
            className="w-full bg-transparent text-xs text-white outline-none text-right font-mono"
          />
        </div>
      </div>

      <div className="h-[1px] bg-white/5" />

      {/* Object Alignment Section */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Canvas Align</label>
        <div className="grid grid-cols-2 gap-2">
          {/* Horizontal Alignment */}
          <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 justify-around">
            <button
              onClick={() => handleAlign('left')}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
              title="Align Left"
            >
              <AlignStartHorizontal size={14} />
            </button>
            <button
              onClick={() => handleAlign('center-h')}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
              title="Align Center Horizontal"
            >
              <AlignCenterHorizontal size={14} />
            </button>
            <button
              onClick={() => handleAlign('right')}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
              title="Align Right"
            >
              <AlignEndHorizontal size={14} />
            </button>
          </div>
          {/* Vertical Alignment */}
          <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 justify-around">
            <button
              onClick={() => handleAlign('top')}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
              title="Align Top"
            >
              <AlignStartVertical size={14} />
            </button>
            <button
              onClick={() => handleAlign('center-v')}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
              title="Align Center Vertical"
            >
              <AlignCenterVertical size={14} />
            </button>
            <button
              onClick={() => handleAlign('bottom')}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
              title="Align Bottom"
            >
              <AlignEndVertical size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="h-[1px] bg-white/5" />

      {isText && (
        <div className="space-y-4">
          {/* Typography Header */}
          <div className="flex items-center gap-2 mb-2">
            <Type size={14} className="text-purple-400" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white">Typography</h3>
          </div>

          {/* Font Family Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Font Family</label>
            <select
              value={properties.fontFamily}
              onChange={(e) => handleFontChange(e.target.value)}
              className="w-full bg-[#1a1a38] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors appearance-none font-sans"
            >
              <optgroup label="System Fonts" className="bg-[#1e1e1e]">
                {SYSTEM_FONTS.map(font => (
                  <option key={font} value={font} className="bg-[#1e1e1e] font-sans">{font}</option>
                ))}
              </optgroup>
              <optgroup label="Google Fonts" className="bg-[#1e1e1e]">
                {GOOGLE_FONTS.map(font => (
                  <option key={font} value={font} className="bg-[#1e1e1e] font-sans">{font}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Font Size & Opacity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Font Size</label>
              <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden focus-within:border-purple-500 transition-colors">
                <button
                  onClick={() => handleChange("fontSize", Math.max(1, properties.fontSize - 1))}
                  className="px-2.5 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  value={properties.fontSize}
                  onChange={(e) => handleChange("fontSize", parseInt(e.target.value) || 1)}
                  className="w-full bg-transparent text-center text-xs text-white outline-none py-1.5 font-mono"
                />
                <button
                  onClick={() => handleChange("fontSize", properties.fontSize + 1)}
                  className="px-2.5 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

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
                className="w-full accent-purple-500 h-1 mt-2.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Style Row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Style</span>
            <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 gap-0.5">
              <button
                onClick={() => handleChange("fontWeight", properties.fontWeight === "bold" ? "normal" : "bold")}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${properties.fontWeight === "bold"
                  ? "bg-purple-500/20 text-purple-400 font-bold"
                  : "text-gray-400 hover:text-white"
                  }`}
                title="Bold"
              >
                <Bold size={13} />
              </button>
              <button
                onClick={() => handleChange("fontStyle", properties.fontStyle === "italic" ? "normal" : "italic")}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${properties.fontStyle === "italic"
                  ? "bg-purple-500/20 text-purple-400 italic"
                  : "text-gray-400 hover:text-white"
                  }`}
                title="Italic"
              >
                <Italic size={13} />
              </button>
              <button
                onClick={() => handleChange("underline", !properties.underline)}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${properties.underline
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-gray-400 hover:text-white"
                  }`}
                title="Underline"
              >
                <Underline size={13} />
              </button>
              <button
                onClick={() => handleChange("linethrough", !properties.linethrough)}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${properties.linethrough
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-gray-400 hover:text-white"
                  }`}
                title="Strikethrough"
              >
                <Strikethrough size={13} />
              </button>
            </div>
          </div>

          {/* Alignment Row */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Align</span>
            <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 gap-0.5">
              {(["left", "center", "right", "justify"] as const).map(align => {
                const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : align === "right" ? AlignRight : AlignJustify;
                return (
                  <button
                    key={align}
                    onClick={() => handleChange("textAlign", align)}
                    className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${properties.textAlign === align
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-gray-400 hover:text-white"
                      }`}
                    title={`Align ${align}`}
                  >
                    <Icon size={13} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Letter Spacing & Line Height */}
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Letter Spacing</label>
                <span className="text-[10px] text-gray-400 font-mono">{properties.charSpacing}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="500"
                step="5"
                value={properties.charSpacing}
                onChange={(e) => handleChange("charSpacing", parseInt(e.target.value))}
                className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Line Height</label>
                <span className="text-[10px] text-gray-400 font-mono">{parseFloat(properties.lineHeight.toString()).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={properties.lineHeight}
                onChange={(e) => handleChange("lineHeight", parseFloat(e.target.value))}
                className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Text Color */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Text Color</span>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
              <input
                type="color"
                value={properties.fill}
                onChange={(e) => handleChange("fill", e.target.value)}
                className="w-5 h-5 rounded bg-transparent border border-white/10 cursor-pointer p-0 overflow-hidden"
              />
              <input
                type="text"
                value={properties.fill.toUpperCase()}
                onChange={(e) => handleChange("fill", e.target.value)}
                className="w-14 bg-transparent text-[10px] text-white outline-none font-mono uppercase text-center focus:border-purple-500"
              />
            </div>
          </div>

          {/* Highlight Background */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Highlight</span>
            <div className="flex items-center gap-2">
              {properties.textBackgroundColor !== 'transparent' && (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg p-1">
                  <input
                    type="color"
                    value={properties.textBackgroundColor}
                    onChange={(e) => handleChange("textBackgroundColor", e.target.value)}
                    className="w-5 h-5 rounded bg-transparent border border-white/10 cursor-pointer p-0 overflow-hidden"
                  />
                  <input
                    type="text"
                    value={properties.textBackgroundColor.toUpperCase()}
                    onChange={(e) => handleChange("textBackgroundColor", e.target.value)}
                    className="w-14 bg-transparent text-[10px] text-white outline-none font-mono uppercase text-center"
                  />
                </div>
              )}
              <button
                onClick={() => {
                  if (properties.textBackgroundColor === 'transparent') {
                    handleChange("textBackgroundColor", "#ffff00");
                  } else {
                    handleChange("textBackgroundColor", "transparent");
                  }
                }}
                className={`px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                  properties.textBackgroundColor !== 'transparent'
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                {properties.textBackgroundColor !== 'transparent' ? 'Remove' : 'Add'}
              </button>
            </div>
          </div>

          {/* Outline Stroke */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Outline</span>
              <div className="flex items-center gap-2">
                {properties.stroke !== 'transparent' && (
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg p-1">
                    <input
                      type="color"
                      value={properties.stroke}
                      onChange={(e) => handleChange("stroke", e.target.value)}
                      className="w-5 h-5 rounded bg-transparent border border-white/10 cursor-pointer p-0 overflow-hidden"
                    />
                    <input
                      type="text"
                      value={properties.stroke.toUpperCase()}
                      onChange={(e) => handleChange("stroke", e.target.value)}
                      className="w-14 bg-transparent text-[10px] text-white outline-none font-mono uppercase text-center"
                    />
                  </div>
                )}
                <button
                  onClick={() => {
                    if (properties.stroke === 'transparent') {
                      handleChange("stroke", "#000000");
                      handleChange("strokeWidth", 1);
                    } else {
                      handleChange("stroke", "transparent");
                      handleChange("strokeWidth", 0);
                    }
                  }}
                  className={`px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                    properties.stroke !== 'transparent'
                      ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {properties.stroke !== 'transparent' ? 'Remove' : 'Add'}
                </button>
              </div>
            </div>

            {properties.stroke !== 'transparent' && (
              <div className="flex items-center justify-between pl-4">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Width</span>
                <div className="flex bg-white/5 border border-white/10 rounded-md overflow-hidden focus-within:border-purple-500 transition-colors">
                  <button
                    onClick={() => handleChange("strokeWidth", Math.max(0, properties.strokeWidth - 1))}
                    className="px-2.5 py-1 text-gray-400 hover:text-white transition-all text-xs font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={properties.strokeWidth}
                    onChange={(e) => handleChange("strokeWidth", Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-12 bg-transparent text-center text-xs text-white outline-none py-1 font-mono"
                  />
                  <button
                    onClick={() => handleChange("strokeWidth", properties.strokeWidth + 1)}
                    className="px-2.5 py-1 text-gray-400 hover:text-white transition-all text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
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

          {/* Fill Color */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Fill Color</span>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
              <input
                type="color"
                value={properties.fill}
                onChange={(e) => handleChange("fill", e.target.value)}
                className="w-5 h-5 rounded bg-transparent border border-white/10 cursor-pointer p-0 overflow-hidden"
              />
              <input
                type="text"
                value={properties.fill.toUpperCase()}
                onChange={(e) => handleChange("fill", e.target.value)}
                className="w-14 bg-transparent text-[10px] text-white outline-none font-mono uppercase text-center"
              />
            </div>
          </div>

          {/* Stroke Color */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Stroke Color</span>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
              <input
                type="color"
                value={properties.stroke === 'transparent' ? '#000000' : properties.stroke}
                onChange={(e) => handleChange("stroke", e.target.value)}
                className="w-5 h-5 rounded bg-transparent border border-white/10 cursor-pointer p-0 overflow-hidden"
              />
              <input
                type="text"
                value={properties.stroke.toUpperCase()}
                onChange={(e) => handleChange("stroke", e.target.value)}
                className="w-14 bg-transparent text-[10px] text-white outline-none font-mono uppercase text-center"
              />
            </div>
          </div>

          {/* Stroke Width */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Stroke Width</span>
            <div className="flex bg-white/5 border border-white/10 rounded-md overflow-hidden focus-within:border-purple-500 transition-colors">
              <button
                onClick={() => handleChange("strokeWidth", Math.max(0, properties.strokeWidth - 1))}
                className="px-2.5 py-1 text-gray-400 hover:text-white transition-all text-xs font-bold"
              >
                -
              </button>
              <input
                type="number"
                value={properties.strokeWidth}
                onChange={(e) => handleChange("strokeWidth", Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 bg-transparent text-center text-xs text-white outline-none py-1 font-mono"
              />
              <button
                onClick={() => handleChange("strokeWidth", properties.strokeWidth + 1)}
                className="px-2.5 py-1 text-gray-400 hover:text-white transition-all text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
