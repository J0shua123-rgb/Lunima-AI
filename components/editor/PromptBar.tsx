"use client";

import { useState } from "react";
import { Sparkles, Send } from "lucide-react";

export default function PromptBar() {
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    alert("Coming soon! AI generation will be connected next.");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={12} className="text-purple-400" />
        <span className="text-[10px] font-bold uppercase text-purple-400 tracking-[0.2em]">AI Generation</span>
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what to generate..."
          className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition-all resize-none h-24"
        />

        <button
          onClick={handleGenerate}
          className="absolute bottom-3 right-3 p-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg transition-colors shadow-lg shadow-purple-500/20 group"
        >
          <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      <p className="text-[9px] text-gray-600 leading-normal px-1">
        Powered by Stability AI. Generate images, textures, or design elements directly onto your canvas.
      </p>
    </div>
  );
}

