/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Minus, Plus, Download, ChevronDown, Monitor, Image as ImageIcon, Save, Settings, Grid, Ruler } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { createClient } from "@/lib/supabase/client";

interface TopBarProps {
  projectId: string;
  initialName: string;
}

export default function TopBar({ projectId, initialName }: TopBarProps) {
  const router = useRouter();
  const supabase = createClient();
  const { canvas, zoom, setZoom, isModified, setModified, setActiveRightTab, undo, redo } = useEditorStore();
  
  const [name, setName] = useState(initialName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFileOpen, setIsFileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { isAssetsDrawerOpen, setAssetsDrawerOpen } = useEditorStore();
  
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setIsFileOpen(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Zoom logic
  const handleZoom = (delta: number) => {
    if (!canvas) return;
    const newZoom = Math.min(Math.max(zoom + delta, 25), 200);
    setZoom(newZoom);
    
    // Convert percentage to 0-1 range for Fabric
    const scale = newZoom / 100;
    canvas.setZoom(scale);
    canvas.renderAll();
  };

  const handleSaveName = async () => {
    setIsEditingName(false);
    if (name === initialName) return;

    await supabase
      .from("projects")
      .update({ name })
      .eq("id", projectId);
  };

  const handleManualSave = async () => {
    if (!canvas || !isModified) return;
    setIsSaving(true);
    
    const canvasData = canvas.toJSON();
    const { error } = await supabase
      .from("projects")
      .update({ canvas_data: canvasData })
      .eq("id", projectId);

    if (!error) setModified(false);
    setIsSaving(false);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, isModified, undo, redo]);

  return (
    <header className="w-full h-12 bg-[#0d0d1f] border-b border-white/5 flex items-center justify-between px-4 z-50">
      {/* Left: Project Info */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push("/dashboard")}
          className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                className="bg-[#1a1a38] text-sm font-bold text-white px-2 py-1 rounded outline-none border border-purple-500/50"
              />
            ) : (
              <h1 
                onClick={() => setIsEditingName(true)}
                className="text-sm font-bold text-white cursor-pointer hover:text-purple-400 transition-colors flex items-center gap-2"
              >
                {name}
                {isModified && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
              </h1>
            )}
          </div>

          {/* Menus */}
          <div className="flex items-center gap-1">
            <div className="relative" ref={fileMenuRef}>
              <button 
                onClick={() => { setIsFileOpen(!isFileOpen); setIsSettingsOpen(false); }}
                className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${isFileOpen ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                File <ChevronDown size={12} className={isFileOpen ? "rotate-180" : ""} />
              </button>
              
              {isFileOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#13132b] border border-white/10 rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
                  <button onClick={() => router.push("/dashboard")} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-[#7C3AED]/20 transition-colors text-left">
                    <Monitor size={14} /> New Project
                  </button>
                  <button onClick={() => { setAssetsDrawerOpen(true); setIsFileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-[#7C3AED]/20 transition-colors text-left">
                    <ImageIcon size={14} /> Import Image
                  </button>
                  <div className="h-[1px] bg-white/5 my-1" />
                  <button onClick={() => { handleManualSave(); setIsFileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-[#7C3AED]/20 transition-colors text-left">
                    <Save size={14} /> Save Layout <span className="ml-auto text-[10px] text-gray-500">Ctrl+S</span>
                  </button>
                  <div className="h-[1px] bg-white/5 my-1" />
                  <button onClick={() => { setActiveRightTab('Export'); setIsFileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-[#7C3AED]/20 transition-colors text-left">
                    <Download size={14} /> Export
                  </button>
                </div>
              )}
            </div>

            <div className="relative" ref={settingsMenuRef}>
              <button 
                onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsFileOpen(false); }}
                className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${isSettingsOpen ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                Settings <ChevronDown size={12} className={isSettingsOpen ? "rotate-180" : ""} />
              </button>
              
              {isSettingsOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#13132b] border border-white/10 rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
                  <button className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left">
                    <span className="flex items-center gap-2"><Settings size={14} /> Canvas Size</span>
                  </button>
                  <button className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left">
                    <span className="flex items-center gap-2"><Grid size={14} /> Snap to Grid</span>
                  </button>
                  <button className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left">
                    <span className="flex items-center gap-2"><Ruler size={14} /> Show Rulers</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Center: Zoom Controls */}
      <div className="flex items-center bg-[#1a1a38] rounded-lg border border-white/5 overflow-hidden">
        <button 
          onClick={() => handleZoom(-25)}
          className="p-2 hover:bg-white/5 text-gray-400 hover:text-white transition-colors border-r border-white/5"
        >
          <Minus size={14} />
        </button>
        <div className="px-3 text-[10px] font-bold text-gray-300 min-w-[50px] text-center">
          {zoom}%
        </div>
        <button 
          onClick={() => handleZoom(25)}
          className="p-2 hover:bg-white/5 text-gray-400 hover:text-white transition-colors border-l border-white/5"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Right: Saving & Actions */}
      <div className="flex items-center gap-4">
        {isSaving && (
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest animate-pulse">
            Saving...
          </span>
        )}
        
        <button
          onClick={() => setActiveRightTab('Export')}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:brightness-110 text-white px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20"
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </header>
  );
}
