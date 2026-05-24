/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import TopBar from "@/components/editor/TopBar";
import Toolbar from "@/components/editor/Toolbar";
import Canvas from "@/components/editor/Canvas";
import RightPanel from "@/components/editor/RightPanel";
import { useEditorStore } from "@/store/useEditorStore";
import { createClient } from "@/lib/supabase/client";

interface EditorLayoutProps {
  project: Record<string, any>;
}

export default function EditorLayout({ project }: EditorLayoutProps) {
  const { canvas, isModified, setModified } = useEditorStore();
  const supabase = createClient();

  // 1. Load canvas data on mount
  useEffect(() => {
    if (!canvas || !project.canvas_data) return;

    // Load from JSON
    canvas.loadFromJSON(project.canvas_data, () => {
      canvas.renderAll();
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
        .update({ canvas_data: canvasData })
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

        {/* Main Canvas Area */}
        <main className="flex-1 relative flex flex-col overflow-hidden">
          <Canvas width={project.width} height={project.height} />
        </main>

        {/* Right Sidebar */}
        <RightPanel />
      </div>
    </div>
  );
}
