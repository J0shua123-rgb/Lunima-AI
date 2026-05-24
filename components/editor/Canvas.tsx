/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, Rect, Ellipse, IText, PencilBrush, Group, FabricObject } from "fabric";
import { useEditorStore } from "@/store/useEditorStore";

type EditorObject = FabricObject & Record<string, any>;

interface CanvasProps {
  width: number;
  height: number;
}

const {
  canvas,
  setCanvas,
  setModified,
  setSelectedObject,
  activeTool,
  setActiveTool,
  fillColor,
  strokeColor,
  strokeWidth,
  setZoom,
  canvasBackground,
  pushHistory
} = useEditorStore();

// ARROW KEY NUDGING
useEffect(() => {
  if (!canvas) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Only nudge when in select tool and not editing text
    if (activeTool !== "select") return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject || (activeObject as Record<string, any>).isEditing) return;

    const nudge = e.shiftKey ? 10 : 1;
    let moved = false;

    switch (e.key) {
      case "ArrowLeft":
        activeObject.set("left", (activeObject.left || 0) - nudge);
        moved = true;
        break;
      case "ArrowRight":
        activeObject.set("left", (activeObject.left || 0) + nudge);
        moved = true;
        break;
      case "ArrowUp":
        activeObject.set("top", (activeObject.top || 0) - nudge);
        moved = true;
        break;
      case "ArrowDown":
        activeObject.set("top", (activeObject.top || 0) + nudge);
        moved = true;
        break;
    }

    // GROUPING
    if ((e.ctrlKey || e.metaKey) && e.key === "g") {
      e.preventDefault();
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;

      if (e.shiftKey) {
        // UNGROUP (Fabric v7: no .ungroup(), restore world transforms manually)
        if (activeObject.type === "group") {
          const group = activeObject as Group;
          const items = group.getObjects();
          // Fabric v7: use internal method via cast to restore world positions
          (group as Record<string, any>)._restoreObjectsState();
          canvas.remove(group);
          items.forEach((item: EditorObject) => {
            item.setCoords();
            canvas.add(item);
          });
          if (items.length > 0) canvas.setActiveObject(items[0]);
          setModified(true);
        }
      } else {
        // GROUP
        if (activeObject.type === "activeSelection") {
          const group = new Group(canvas.getActiveObjects());
          canvas.remove(...canvas.getActiveObjects());
          canvas.add(group);
          canvas.setActiveObject(group);
          setModified(true);
        }
      }
      canvas.requestRenderAll();
    }

    if (moved) {
      e.preventDefault();
      activeObject.setCoords();
      canvas.requestRenderAll();
      setModified(true);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [canvas, activeTool, setModified]);

// SCROLL WHEEL ZOOM
useEffect(() => {
  const container = containerRef.current;
  if (!container || !canvas) return;

  const handleWheel = (e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();

    const delta = e.deltaY;
    const currentZoom = canvas.getZoom();
    let newZoom = delta < 0 ? currentZoom + 0.1 : currentZoom - 0.1;

    // Clamp between 0.25 and 3.0
    newZoom = Math.max(0.25, Math.min(newZoom, 3));

    const point = canvas.getScenePoint(e);
    canvas.zoomToPoint(point, newZoom);
    setZoom(Math.round(newZoom * 100));
  };

  container.addEventListener("wheel", handleWheel, { passive: false });
  return () => container.removeEventListener("wheel", handleWheel);
}, [canvas, setZoom]);

// FIX 1 & 6: Initialize Canvas with Strict Mode Guard
useEffect(() => {
  if (!canvasRef.current || initialized.current) return;
  initialized.current = true;

  const fabricCanvas = new FabricCanvas(canvasRef.current, {
    width,
    height,
  });

  // FIX 3: Direct assignment and requestRenderAll
  fabricCanvas.backgroundColor = canvasBackground || "#ffffff";
  fabricCanvas.requestRenderAll();

  // Selection styles
  fabricCanvas.selectionColor = "rgba(124,58,237,0.2)";
  fabricCanvas.selectionBorderColor = "rgba(124,58,237,0.5)";
  fabricCanvas.selectionLineWidth = 2;

  setCanvas(fabricCanvas);

  // Event Listeners
  fabricCanvas.on("object:modified", () => {
    setModified(true);
    pushHistory(JSON.stringify(fabricCanvas.toJSON()));
  });
  fabricCanvas.on("object:added", () => {
    setModified(true);
    pushHistory(JSON.stringify(fabricCanvas.toJSON()));
  });
  fabricCanvas.on("object:removed", () => {
    setModified(true);
    pushHistory(JSON.stringify(fabricCanvas.toJSON()));
  });

  fabricCanvas.on("selection:created", (e) => {
    if (e.selected) setSelectedObject(e.selected[0]);
  });
  fabricCanvas.on("selection:updated", (e) => {
    if (e.selected) setSelectedObject(e.selected[0]);
  });
  fabricCanvas.on("selection:cleared", () => setSelectedObject(null));

  // FIX 2: Responsive Scaling using setDimensions
  const handleResize = () => {
    if (!containerRef.current || !fabricCanvas) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const padding = 40;
    const scaleX = (containerWidth - padding) / width;
    const scaleY = (containerHeight - padding) / height;
    const scale = Math.min(scaleX, scaleY, 1);

    fabricCanvas.setZoom(scale);
    setZoom(Math.round(scale * 100));
    fabricCanvas.setDimensions({
      width: width * scale,
      height: height * scale
    });
  };

  window.addEventListener("resize", handleResize);
  handleResize();

  return () => {
    window.removeEventListener("resize", handleResize);
    fabricCanvas.dispose();
    setCanvas(null);
    initialized.current = false;
  };
}, [setCanvas, setModified, setSelectedObject, setZoom, pushHistory]); // Removed width/height so canvas isn't recreated

// Handle dynamic width/height/background changes
useEffect(() => {
  if (!canvas) return;

  // The objects should stay in place (fixed top/left coordinates). 
  // Fabric natively does this when you just change dimensions.
  canvas.setDimensions({ width, height }, { backstoreOnly: true }); // Update internal resolution

  canvas.backgroundColor = canvasBackground;
  canvas.requestRenderAll();

  // Also trigger container resize logic to re-center/re-scale the view
  const containerWidth = containerRef.current?.clientWidth || 800;
  const containerHeight = containerRef.current?.clientHeight || 600;
  const padding = 40;
  const scaleX = (containerWidth - padding) / width;
  const scaleY = (containerHeight - padding) / height;
  const scale = Math.min(scaleX, scaleY, 1);

  canvas.setZoom(scale);
  setZoom(Math.round(scale * 100));
  canvas.setDimensions({
    width: width * scale,
    height: height * scale
  });
}, [canvas, width, height, canvasBackground, setZoom]);

const isDrawing = useRef(false);
const origPoint = useRef({ x: 0, y: 0 });
const activeShape = useRef<EditorObject | null>(null);

// FIX 5: Implement Tool Behaviors using v7 event structure
useEffect(() => {
  if (!canvas) return;

  canvas.off("mouse:down");
  canvas.off("mouse:move");
  canvas.off("mouse:up");

  // Lasso and Eraser handling
  if (activeTool === "lasso" || activeTool === "eraser") {
    canvas.isDrawingMode = true;
    const brush = new PencilBrush(canvas);

    if (activeTool === "eraser") {
      brush.color = "#ffffff";
      brush.width = 20;
    } else {
      brush.color = "#7C3AED";
      brush.width = 3;
    }

    canvas.freeDrawingBrush = brush;
    return;
  }

  if (activeTool === "select") {
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    return;
  }

  if (activeTool === "move") {
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'grab';

    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    const onMouseDown = (opt: Record<string, any>) => {
      const e = opt.e as MouseEvent;
      isDragging = true;
      canvas.defaultCursor = 'grabbing';
      lastPosX = e.clientX;
      lastPosY = e.clientY;
    };

    const onMouseMove = (opt: Record<string, any>) => {
      if (isDragging) {
        const e = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform;
        if (!vpt) return;
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    };

    const onMouseUp = () => {
      canvas.defaultCursor = 'grab';
      if (canvas.viewportTransform) {
        canvas.setViewportTransform(canvas.viewportTransform);
      }
      isDragging = false;
    };

    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);

    return;
  }

  canvas.isDrawingMode = false;
  canvas.selection = false;

  const handleMouseDown = (opt: Record<string, any>) => {
    const point = opt.scenePoint || canvas.getScenePoint(opt.e);

    if (activeTool === "text") {
      const text = new IText("Double click to edit", {
        left: point.x,
        top: point.y,
        fontSize: 24,
        fill: fillColor,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.requestRenderAll();
      setModified(true);
      setActiveTool("select");
      return;
    }

    isDrawing.current = true;
    origPoint.current = { x: point.x, y: point.y };

    if (activeTool === "rect") {
      activeShape.current = new Rect({
        left: point.x,
        top: point.y,
        width: 0,
        height: 0,
        fill: fillColor,
        stroke: strokeColor === 'transparent' ? undefined : strokeColor,
        strokeWidth: strokeWidth,
      });
    } else if (activeTool === "ellipse") {
      activeShape.current = new Ellipse({
        left: point.x,
        top: point.y,
        rx: 0,
        ry: 0,
        fill: fillColor,
        stroke: strokeColor === 'transparent' ? undefined : strokeColor,
        strokeWidth: strokeWidth,
      });
    }

    if (activeShape.current) {
      canvas.add(activeShape.current);
    }
  };

  const handleMouseMove = (opt: Record<string, any>) => {
    if (!isDrawing.current || !activeShape.current) return;
    const point = opt.scenePoint || canvas.getScenePoint(opt.e);

    let width = Math.abs(origPoint.current.x - point.x);
    let height = Math.abs(origPoint.current.y - point.y);

    // SHIFT CONSTRAINT
    if (opt.e.shiftKey) {
      const size = Math.max(width, height);
      width = size;
      height = size;
    }

    if (activeTool === "rect") {
      activeShape.current.set({
        width: width,
        height: height,
        left: point.x < origPoint.current.x ? origPoint.current.x - width : origPoint.current.x,
        top: point.y < origPoint.current.y ? origPoint.current.y - height : origPoint.current.y,
      });
    } else if (activeTool === "ellipse") {
      activeShape.current.set({
        rx: width / 2,
        ry: height / 2,
        left: point.x < origPoint.current.x ? origPoint.current.x - width : origPoint.current.x,
        top: point.y < origPoint.current.y ? origPoint.current.y - height : origPoint.current.y,
      });
    }

    canvas.requestRenderAll();
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;

    isDrawing.current = false;
    if (activeShape.current) {
      activeShape.current.setCoords();
      canvas.setActiveObject(activeShape.current);
    }
    activeShape.current = null;
    setModified(true);
    setActiveTool("select");
    canvas.requestRenderAll();
  };

  canvas.on("mouse:down", handleMouseDown);
  canvas.on("mouse:move", handleMouseMove);
  canvas.on("mouse:up", handleMouseUp);

  return () => {
    canvas.off("mouse:down", handleMouseDown);
    canvas.off("mouse:move", handleMouseMove);
    canvas.off("mouse:up", handleMouseUp);
  };
}, [canvas, activeTool, setActiveTool, setModified, fillColor, strokeColor, strokeWidth]);


return (
  <div
    ref={containerRef}
    className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#1e1e1e] outline-none"
    tabIndex={0}
    style={{
      backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
      backgroundSize: "24px 24px"
    }}
  >
    <div className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-white">
      <canvas ref={canvasRef} />

      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-500 whitespace-nowrap uppercase tracking-widest">
        {width} × {height} px
      </div>
    </div>
  </div>
);
}
