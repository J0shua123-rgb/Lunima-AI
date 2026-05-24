"use client";

import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { createClient } from "@/lib/supabase/client";
import { FabricImage } from "fabric";

interface AssetsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssetsDrawer({ isOpen, onClose }: AssetsDrawerProps) {
  const { canvas, setModified, setSelectedObject } = useEditorStore();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [files, setFiles] = useState<{ id: string; name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserAndFiles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchFiles(user.id);
      } else {
        setIsLoading(false);
      }
    };
    if (isOpen) {
      fetchUserAndFiles();
    }
  }, [isOpen, supabase]);

  const fetchFiles = async (uid: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.storage.from('generated-images').list(uid, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

    if (error) {
      console.error("Error fetching files:", error);
      setIsLoading(false);
      return;
    }

    const fileList = data
      .filter(file => file.name !== '.emptyFolderPlaceholder')
      .map(file => {
        const { data: publicUrlData } = supabase.storage
          .from('generated-images')
          .getPublicUrl(`${uid}/${file.name}`);
        
        return {
          id: file.id,
          name: file.name,
          url: publicUrlData.publicUrl
        };
      });

    setFiles(fileList);
    setIsLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    if (!userId) return;
    
    let file: File | undefined;
    if ('dataTransfer' in e) {
      e.preventDefault();
      file = e.dataTransfer.files?.[0];
    } else {
      file = (e.target as HTMLInputElement).files?.[0];
    }

    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from('generated-images')
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading file:", error);
      alert("Upload failed. Make sure it's a valid image.");
    } else {
      await fetchFiles(userId);
    }
    
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const addImageToCanvas = async (url: string) => {
    if (!canvas) return;

    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      
      // Scale down if image is too large for canvas
      const maxDim = Math.min(canvas.width! * 0.8, canvas.height! * 0.8);
      if (img.width && img.height) {
        const scale = Math.min(1, maxDim / img.width, maxDim / img.height);
        img.scale(scale);
      }

      canvas.add(img);
      canvas.centerObject(img);
      canvas.setActiveObject(img);
      setSelectedObject(img);
      setModified(true);
      
      // Auto close drawer on insert (optional, but good UX)
      // onClose();
    } catch (error) {
      console.error("Error loading image to canvas:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute left-16 top-12 bottom-0 w-80 bg-[#13132b] border-r border-white/5 z-40 flex flex-col shadow-2xl animate-in slide-in-from-left-4 duration-200">
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a1a]">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <ImageIcon size={14} className="text-purple-400" />
          Assets
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
        {/* Upload Zone */}
        <div 
          className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative group"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleUpload}
          onDragOver={handleDragOver}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            accept="image/*" 
            className="hidden" 
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-purple-400">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Uploading...</span>
            </div>
          ) : (
            <>
              <UploadCloud size={24} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
              <div className="text-center">
                <p className="text-xs font-medium text-white">Click or drag images</p>
                <p className="text-[10px] text-gray-500 mt-1">PNG, JPG, SVG, WEBP</p>
              </div>
            </>
          )}
        </div>

        {/* Gallery */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Recent Uploads</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={16} className="text-purple-400 animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-[11px]">
              No assets uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {files.map(file => (
                <button
                  key={file.id}
                  onClick={() => addImageToCanvas(file.url)}
                  className="relative aspect-square rounded-lg bg-black/20 border border-white/5 overflow-hidden group hover:border-purple-500/50 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={file.url} 
                    alt={file.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/20 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
