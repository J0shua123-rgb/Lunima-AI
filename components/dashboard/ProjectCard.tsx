'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export interface Project {
  id: string;
  name: string;
  thumbnail_url: string | null;
  canvas_data: unknown;
  width: number;
  height: number;
  updated_at: string;
  created_at?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const hasAiData =
    project.canvas_data !== null &&
    typeof project.canvas_data === 'object' &&
    Object.keys(project.canvas_data as object).length > 0;

  const openEditor = () => router.push(`/editor/${project.id}`);

  const handleRename = async () => {
    setIsRenaming(false);
    const trimmed = newName.trim();
    if (!trimmed || trimmed === project.name) {
      setNewName(project.name);
      return;
    }

    // Optimistic UI Update
    queryClient.setQueryData<Project[]>(['projects'], (old) =>
      (old ?? []).map((p) => (p.id === project.id ? { ...p, name: trimmed } : p))
    );

    const { error } = await supabase
      .from('projects')
      .update({ name: trimmed })
      .eq('id', project.id);

    if (error) {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  };

  const handleDuplicate = async () => {
    setMenuOpen(false);
    
    const { data: fullProject } = await supabase
      .from('projects')
      .select('user_id, description, canvas_data, thumbnail_url, width, height')
      .eq('id', project.id)
      .single();
      
    if (!fullProject) return;
    
    const { error } = await supabase
      .from('projects')
      .insert({
        ...fullProject,
        name: `Copy of ${project.name}`,
      });
      
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setMenuOpen(false);
    setConfirmDelete(false);

    // Optimistic: remove from cache immediately
    queryClient.setQueryData<Project[]>(['projects'], (old) =>
      (old ?? []).filter((p) => p.id !== project.id)
    );

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id);

    if (error) {
      console.error('Failed to delete project permanently:', error);
      // Restore on failure
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
    // Always refresh stats
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    setDeleting(false);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setConfirmDelete(false);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      // Calculate position, flip upwards if too close to bottom edge
      let top = rect.bottom + 4;
      const approxMenuHeight = 180;
      if (top + approxMenuHeight > window.innerHeight) {
        top = rect.top - approxMenuHeight - 4;
      }

      setMenuPos({
        top,
        right: window.innerWidth - rect.right,
      });
      setConfirmDelete(false);
      setMenuOpen(true);
    } else {
      closeMenu();
    }
  };

  return (
    <div
      onClick={openEditor}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#13132b] border border-white/10 shadow-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/40 hover:shadow-[0_0_24px_rgba(124,58,237,0.15)]"
    >
      {/* ── Thumbnail ── */}
      <div className="aspect-[4/3] w-full bg-[#0a0a1a] relative border-b border-white/5 overflow-hidden">
        {project.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnail_url}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="w-12 h-12 text-gray-700/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* AI Badge */}
        {hasAiData && (
          <div className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-400 to-blue-400" />
            <span className="text-[10px] font-bold tracking-wider text-white uppercase">AI</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080818]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* ── Info ── */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {isRenaming ? (
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') {
                    setIsRenaming(false);
                    setNewName(project.name);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-[#1a1a38] text-sm font-bold text-white leading-tight outline-none border-b border-violet-500 py-0.5"
              />
            ) : (
              <h3 className="text-sm font-bold text-white truncate leading-tight">{project.name}</h3>
            )}
            <p className="mt-1 text-xs text-gray-500">{project.width} × {project.height}</p>
          </div>

          {/* Context menu */}
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              ref={buttonRef}
              onClick={toggleMenu}
              disabled={deleting}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
              aria-label="Project options"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {menuOpen && typeof document !== 'undefined' && createPortal(
              <div
                ref={menuRef}
                style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
                className="w-40 rounded-xl bg-[#1a1a38] border border-white/10 shadow-2xl shadow-black/50 z-[9999] py-1 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                  {!confirmDelete ? (
                    <>
                      <button
                        onClick={openEditor}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Open
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setIsRenaming(true); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Rename
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                        Duplicate
                      </button>
                      <div className="my-1 border-t border-white/5" />
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </>
                  ) : (
                    <div className="px-3 py-2.5">
                      <p className="text-xs text-gray-400 mb-3 leading-snug">Delete <span className="text-white font-semibold">&quot;{project.name}&quot;</span>? This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 text-xs py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          className="flex-1 text-xs py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>,
              document.body
            )}
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-600 font-medium">
          Edited {timeAgo(project.updated_at)}
        </p>
      </div>
    </div>
  );
}
