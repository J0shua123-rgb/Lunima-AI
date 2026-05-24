/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import TopBar from "@/components/editor/TopBar";
import Toolbar from "@/components/editor/Toolbar";
import Canvas from "@/components/editor/Canvas";
import RightPanel from "@/components/editor/RightPanel";
import AssetsDrawer from "@/components/editor/AssetsDrawer";
import { useEditorStore } from "@/store/useEditorStore";
import { createClient } from "@/lib/supabase/client";

interface EditorLayoutProps {
  project: Record<string, any>;
}

export default function EditorLayout({ project }: EditorLayoutProps) {
  const { 
    canvas, isModified, setModified, 
    isAssetsDrawerOpen, setAssetsDrawerOpen,
    canvasWidth, canvasHeight, canvasBackground,
    setCanvasWidth, setCanvasHeight, setCanvasBackground
  } = useEditorStore();
  
  const supabase = createClient();

  // Initialize store with project data on mount
  useEffect(() => {
    if (project.width && project.height) {
      setCanvasWidth(project.width);
      setCanvasHeight(project.height);
    }
    if (project.background_color) {
      setCanvasBackground(project.background_color);
    }
  }, [project, setCanvasWidth, setCanvasHeight, setCanvasBackground]);

  // 1. Load canvas data on mount
  useEffect(() => {
    if (!canvas || !project.canvas_data) return;

    // Fabric v7: loadFromJSON is async (returns a Promise).
    // The old callback-as-2nd-arg is silently ignored — objects load
    // but never render, causing the blank canvas on open.
    canvas
      .loadFromJSON(project.canvas_data)
      .then(() => {
        canvas.requestRenderAll();
        setModified(false);
      });
  }, [canvas, project.canvas_data, setModified]);

  // 2. Auto-save every 30s
  useEffect(() => {
    if (!canvas || !isModified) return;

    const interval = setInterval(async () => {
      if (!isModified) return;

      const canvasData = canvas.toJSON();
      const { error } = await supabase
        .from("projects")
        .update({ 
          canvas_data: canvasData,
          width: canvasWidth,
          height: canvasHeight,
          background_color: canvasBackground
        })
        .eq("id", project.id);

      if (!error) {
        setModified(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [canvas, isModified, project.id, setModified, supabase]);

  // 3. Global shortcuts (Delete, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas) return;

      // Delete/Backspace to delete selected object
      if (e.key === "Delete" || e.key === "Backspace") {
        // Prevent deleting if typing in an input
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
          return;
        }

        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          canvas.remove(...activeObjects);
          canvas.discardActiveObject();
          canvas.renderAll();
          setModified(true);
        }
      }

      // Escape to deselect all
      if (e.key === "Escape") {
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canvas, setModified]);

  return (
    <div className="h-screen w-full flex flex-col bg-[#080818] overflow-hidden text-white">
      {/* Top Header */}
      <TopBar
        projectId={project.id}
        initialName={project.name}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar />

        {/* Assets Slide-Out Drawer */}
        <AssetsDrawer isOpen={isAssetsDrawerOpen} onClose={() => setAssetsDrawerOpen(false)} />

        {/* Main Canvas Area */}
        <main className="flex-1 relative flex flex-col overflow-hidden">
          <Canvas width={canvasWidth} height={canvasHeight} />
        </main>

        {/* Right Sidebar */}
        <RightPanel />
      </div>
    </div>
  );
}
