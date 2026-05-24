/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Layers, Trash2, Square, Circle, Type, Image as ImageIcon, Lock, Unlock, Folder } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { cn } from "@/lib/utils";
import { FabricObject } from "fabric";

type EditorObject = FabricObject & Record<string, any>;

export default function LayersPanel() {
  const { canvas, setSelectedObject, selectedObject, setModified } = useEditorStore();
  const [layers, setLayers] = useState<EditorObject[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  // Function to refresh layers from canvas
  const refreshLayers = useCallback(() => {
    if (!canvas) return;
    const objects = canvas.getObjects().slice().reverse(); // Show top objects first
    setLayers(objects);

    // Update thumbnails
    const newThumbnails: Record<number, string> = {};
    objects.forEach((obj, idx) => {
      try {
        newThumbnails[idx] = obj.toDataURL({
          format: 'png',
          multiplier: 0.1, // Small thumbnail
          quality: 0.5
        });
      } catch {
        // Fallback for objects that can't be rendered to dataURL easily
      }
    });
    setThumbnails(newThumbnails);
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;

    refreshLayers();

    // Event listeners to sync layers
    canvas.on("object:added", refreshLayers);
    canvas.on("object:removed", refreshLayers);
    canvas.on("object:modified", refreshLayers);
    canvas.on("selection:created", refreshLayers);
    canvas.on("selection:updated", refreshLayers);
    canvas.on("selection:cleared", refreshLayers);

    return () => {
      canvas.off("object:added", refreshLayers);
      canvas.off("object:removed", refreshLayers);
      canvas.off("object:modified", refreshLayers);
      canvas.off("selection:created", refreshLayers);
      canvas.off("selection:updated", refreshLayers);
      canvas.off("selection:cleared", refreshLayers);
    };
  }, [canvas, refreshLayers]);

  const getIcon = (type: string) => {
    switch (type) {
      case "rect": return <Square size={14} />;
      case "ellipse":
      case "circle": return <Circle size={14} />;
      case "i-text": 
      case "textbox":
      case "text": return <Type size={14} />;
      case "image": return <ImageIcon size={14} />;
      case "group": return <Folder size={14} className="text-amber-500" />;
      default: return <Layers size={14} />;
    }
  };

  const getLabel = (obj: EditorObject) => {
    if (obj.name) return obj.name;
    switch (obj.type) {
      case "rect": return "Rectangle";
      case "circle": return "Ellipse";
      case "i-text": return obj.text?.substring(0, 15) || "Text";
      case "image": return "Image";
      case "group": return "Group";
      default: return "Object";
    }
  };

  const toggleVisibility = (obj: EditorObject, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvas) return;
    obj.set("visible", !obj.visible);
    if (!obj.visible && canvas.getActiveObject() === obj) {
      canvas.discardActiveObject();
    }
    canvas.renderAll();
    refreshLayers();
  };

  const toggleLock = (obj: EditorObject, e: React.MouseEvent) => {
    e.stopPropagation();
    const isLocked = !obj.lockMovementX;
    obj.set({
      lockMovementX: isLocked,
      lockMovementY: isLocked,
      lockRotation: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      hasControls: !isLocked,
      selectable: !isLocked,
      evented: true // Still allow clicking in layers panel, but maybe not on canvas?
      // Actually selectable: false makes it un-selectable on canvas.
    });
    canvas?.discardActiveObject();
    canvas?.renderAll();
    refreshLayers();
  };

  const deleteObject = (obj: EditorObject, e: React.MouseEvent) => {
    e.stopPropagation();
    canvas?.remove(obj);
    canvas?.renderAll();
    if (selectedObject === obj) setSelectedObject(null);
  };

  const selectLayer = (obj: EditorObject) => {
    if (editingId) return; // Don't select while editing
    canvas?.setActiveObject(obj);
    canvas?.renderAll();
    setSelectedObject(obj);
  };

  const startEditing = (obj: EditorObject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(obj.id || obj.uid || String(layers.indexOf(obj)));
    setEditValue(getLabel(obj));
  };

  const saveName = (obj: EditorObject) => {
    obj.set("name", editValue);
    setEditingId(null);
    setModified(true);
    refreshLayers();
  };

  const handleKeyDown = (e: React.KeyboardEvent, obj: EditorObject) => {
    if (e.key === "Enter") saveName(obj);
    if (e.key === "Escape") setEditingId(null);
  };

  const onDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex || !canvas) return;

    const objects = canvas.getObjects();
    const N = objects.length;

    // layers[] is displayed top-to-bottom (layers[0] = topmost object).
    // Fabric's _objects array is bottom-to-top  (index 0 = bottom).
    // layers[i]  ==  _objects[N-1-i]
    //
    // We want the dragged item to land at layers position dropIndex,
    // which is fabric index (N - 1 - dropIndex).
    const targetFabricIndex = N - 1 - dropIndex;

    canvas.moveObjectTo(objects[N - 1 - draggedIndex], targetFabricIndex);
    canvas.requestRenderAll();
    setModified(true);
    setDraggedIndex(null);
    refreshLayers();
  };


  if (!canvas || layers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
        <Layers size={32} className="mb-3" />
        <p className="text-[11px] font-bold uppercase tracking-widest">No layers yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {layers.map((obj, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={onDragOver}
          onDrop={() => onDrop(i)}
          onClick={() => selectLayer(obj)}
          className={cn(
            "group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
            selectedObject === obj ? "bg-[#7C3AED] text-white" : "text-gray-400 hover:bg-white/5 hover:text-white",
            draggedIndex === i && "opacity-20"
          )}
        >
          <button onClick={(e) => toggleVisibility(obj, e)} className="opacity-40 hover:opacity-100 transition-opacity">
            {obj.visible ? <Eye size={14} /> : <EyeOff size={14} className="text-purple-400" />}
          </button>
          
          <button onClick={(e) => toggleLock(obj, e)} className="opacity-40 hover:opacity-100 transition-opacity mr-1">
            {obj.lockMovementX ? <Lock size={12} className="text-amber-500/80" /> : <Unlock size={12} />}
          </button>
          
          <div 
            className="flex items-center gap-2 flex-1 min-w-0"
            onDoubleClick={(e) => startEditing(obj, e)}
          >
            <div className="w-6 h-6 rounded bg-black/20 flex items-center justify-center overflow-hidden border border-white/5">
              {thumbnails[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnails[i]} alt="" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="opacity-50">{getIcon(obj.type)}</span>
              )}
            </div>
            {editingId === (obj.id || obj.uid || String(layers.indexOf(obj))) ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveName(obj)}
                onKeyDown={(e) => handleKeyDown(e, obj)}
                className="bg-white/10 border-none outline-none text-[11px] px-1 rounded w-full text-white"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-[11px] font-medium truncate uppercase tracking-tight">
                {getLabel(obj)}
              </span>
            )}
          </div>

          <button 
            onClick={(e) => deleteObject(obj, e)}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

