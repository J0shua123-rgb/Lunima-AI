"use client";

import { useState } from "react";
import { Download, Image as ImageIcon } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { cn } from "@/lib/utils";

type Format = "png" | "jpeg" | "svg";
type Scale = 1 | 2 | 3;

export default function ExportPanel() {
  const { canvas } = useEditorStore();
  const [format, setFormat] = useState<Format>("png");
  const [scale, setScale] = useState<Scale>(1);

  const handleExport = () => {
    if (!canvas) return;

    let dataURL;
    const fileName = `lumina-design-${Date.now()}`;

    if (format === "svg") {
      const svg = canvas.toSVG();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      dataURL = URL.createObjectURL(blob);
    } else {
      dataURL = canvas.toDataURL({
        format: format as "png" | "jpeg",
        multiplier: scale,
        quality: 0.9
      });
    }

    const link = document.createElement("a");
    link.href = dataURL;
    const ext = format === "jpeg" ? "jpg" : format;
    link.download = `${fileName}.${ext}`;
    link.click();
  };

  return (
    <div className="space-y-8">
      {/* Format Selection */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">File Format</label>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {(["png", "jpeg", "svg"] as Format[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                format === f ? "bg-[#7C3AED] text-white shadow-lg shadow-purple-500/20" : "text-gray-500 hover:text-white"
              )}
            >
              {f === "jpeg" ? "jpg" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Scale Selection */}
      {format !== "svg" && (
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Export Scale</label>
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 3] as Scale[]).map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                className={cn(
                  "py-2.5 border rounded-xl text-[10px] font-bold transition-all",
                  scale === s 
                    ? "border-purple-500 bg-purple-500/10 text-white" 
                    : "border-white/10 text-gray-500 hover:border-white/20 hover:text-white"
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 space-y-2">
        <div className="flex items-center gap-2 text-gray-400">
          <ImageIcon size={14} />
          <span className="text-[10px] font-medium uppercase tracking-tight">Dimensions</span>
        </div>
        <p className="text-xl font-bold text-white">
          {canvas ? Math.round(canvas.width! * scale) : 0} <span className="text-xs text-gray-500">×</span> {canvas ? Math.round(canvas.height! * scale) : 0}
        </p>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          High-quality export optimized for web and print use.
        </p>
      </div>

      {/* Download Button */}
      <button
        onClick={handleExport}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:brightness-110 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-purple-500/20 group"
      >
        <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
        Download Design
      </button>
    </div>
  );
}

