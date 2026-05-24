'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProjectCard, { Project } from './ProjectCard';

type FilterType = 'all' | 'newest' | 'oldest';

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[#13132b] border border-white/5 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-white/[0.04]" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-white/10 rounded-lg w-3/5" />
        <div className="h-3.5 bg-white/[0.07] rounded-md w-1/4" />
        <div className="pt-2 h-3 bg-white/[0.05] rounded-md w-2/5" />
      </div>
    </div>
  );
}

interface ProjectGridProps {
  userId: string;
}

export default function ProjectGrid({ userId }: ProjectGridProps) {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [creating, setCreating] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      await supabase.auth.getSession();

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const handleNewProject = async () => {
    setCreating(true);

    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name: 'Untitled Project', width: 1200, height: 1200, canvas_data: {} })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please check your database permissions.');
      setCreating(false);
      return;
    }

    if (data) {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.push(`/editor/${data.id}`);
    }
    setCreating(false);
  };

  const filtered = (projects ?? [])
    .filter((p: Project) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a: Project, b: Project) => {
      if (filter === 'oldest')
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const hasProjects = (projects ?? []).length > 0;
  const hasResults = filtered.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-[#13132b] p-2 rounded-2xl border border-white/5">
        {/* Search */}
        <div className="flex-1 relative">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 pl-9 pr-4 py-2 focus:outline-none"
          />
        </div>

        {/* Filters + CTA */}
        <div className="flex items-center gap-2 px-1 pb-1 sm:pb-0">
          <div className="flex bg-[#0a0a1a] rounded-lg p-1 border border-white/5 gap-0.5">
            {(['all', 'newest', 'oldest'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                  filter === f ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={handleNewProject}
            disabled={creating}
            className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/20 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {creating ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            )}
            {creating ? 'Creating...' : 'New Project'}
          </button>
        </div>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !hasProjects ? (
        /* No projects at all */
        <div className="flex flex-col items-center justify-center py-24 text-center bg-[#13132b]/40 rounded-3xl border border-dashed border-white/10 mt-4">
          <div className="w-20 h-20 bg-[#1a1a3a] rounded-full flex items-center justify-center mb-5 border border-white/5">
            <span className="text-4xl">✨</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
          <p className="text-sm text-gray-400 mb-8 max-w-sm">
            Create your first design and start turning ideas into stunning AI-powered visuals.
          </p>
          <button
            onClick={handleNewProject}
            disabled={creating}
            className="bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:brightness-110 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] disabled:opacity-60"
          >
            {creating ? 'Creating...' : 'Start Creating'}
          </button>
        </div>
      ) : !hasResults ? (
        /* Has projects but search has no results */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-10 h-10 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-400 font-medium">No projects match <span className="text-white">&quot;{search}&quot;</span></p>
          <button onClick={() => setSearch('')} className="mt-3 text-sm text-violet-400 hover:text-violet-300 transition-colors">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project: Project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
