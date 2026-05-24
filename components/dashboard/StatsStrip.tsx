'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#13132b] border border-white/10 p-6 animate-pulse">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-violet-800/50 to-blue-800/50 rounded-r-full" />
      <div className="pl-2 space-y-3">
        <div className="h-3.5 w-28 bg-white/10 rounded-md" />
        <div className="h-8 w-16 bg-white/10 rounded-md" />
      </div>
    </div>
  );
}

const STAT_ICONS = [
  /* Folder — Total Projects */
  <svg key="projects" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>,
  /* Image sparkle — Generated Images */
  <svg key="images" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>,
  /* Clock — Last Active */
  <svg key="clock" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
];

interface StatsStripProps {
  userId: string;
}

export default function StatsStrip({ userId }: StatsStripProps) {
  const supabase = createClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      await supabase.auth.getSession();

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (projectError) throw projectError;

      const { data: imageData } = await supabase
        .from('generated_images')
        .select('id')
        .eq('user_id', userId);

      const { data: lastProject } = await supabase
        .from('projects')
        .select('updated_at')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let lastActive = 'Never';
      if (lastProject?.updated_at) {
        const diffDays = Math.floor(
          (Date.now() - new Date(lastProject.updated_at).getTime()) / 86_400_000
        );
        if (diffDays <= 0) lastActive = 'Today';
        else if (diffDays === 1) lastActive = 'Yesterday';
        else lastActive = `${diffDays}d ago`;
      }

      return {
        totalProjects: projectData?.length ?? 0,
        generatedImages: imageData?.length ?? 0,
        lastActive
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => <StatCardSkeleton key={i} />)}
      </div>
    );
  }

  const cards = [
    { label: 'Total Projects', value: stats?.totalProjects ?? 0, icon: STAT_ICONS[0] },
    { label: 'Generated Images', value: stats?.generatedImages ?? 0, icon: STAT_ICONS[1] },
    { label: 'Last Active', value: stats?.lastActive ?? 'Never', icon: STAT_ICONS[2] },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="group relative overflow-hidden rounded-2xl bg-[#13132b] border border-white/10 p-6 shadow-lg transition-all duration-200 hover:border-white/20 hover:shadow-[0_0_20px_rgba(124,58,237,0.08)]"
        >
          {/* Left accent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#7C3AED] to-[#2563EB] rounded-r-full" />

          {/* Icon top-right */}
          <div className="absolute top-4 right-4 text-white/10 group-hover:text-white/20 transition-colors">
            {card.icon}
          </div>

          <dl className="pl-3">
            <dt className="text-xs font-semibold uppercase tracking-widest text-gray-500 truncate">
              {card.label}
            </dt>
            <dd className="mt-2 text-3xl font-extrabold tracking-tight text-white">
              {card.value}
            </dd>
          </dl>
        </div>
      ))}
    </div>
  );
}
