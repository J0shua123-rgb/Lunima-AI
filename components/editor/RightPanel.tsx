"use client";

import React, { useState } from "react";
import LayersPanel from "./LayersPanel";
import PropertiesPanel from "./PropertiesPanel";
import ExportPanel from "./ExportPanel";
import PromptBar from "./PromptBar";
import { cn } from "@/lib/utils";

type TabType = "Layers" | "Properties" | "Export";

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("Layers");

  const tabs: TabType[] = ["Layers", "Properties", "Export"];

  return (
    <aside className="w-[280px] h-full bg-[#13132b] border-l border-white/5 flex flex-col z-40 relative">
      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-4 text-[11px] font-bold uppercase tracking-widest transition-all relative",
              activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7C3AED]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {activeTab === "Layers" && <LayersPanel />}
        {activeTab === "Properties" && <PropertiesPanel />}
        {activeTab === "Export" && <ExportPanel />}
      </div>

      {/* AI Prompt Bar fixed at bottom */}
      <div className="p-4 border-t border-white/5 bg-[#0a0a1a]">
        <PromptBar />
      </div>
    </aside>
  );
}
