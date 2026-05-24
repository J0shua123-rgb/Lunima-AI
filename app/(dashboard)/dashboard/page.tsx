import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import StatsStrip from '@/components/dashboard/StatsStrip';
import ProjectGrid from '@/components/dashboard/ProjectGrid';

export const metadata = {
  title: 'Dashboard — Lumina AI',
  description: 'Manage your AI-powered design projects in Lumina AI.',
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const displayName = user.email?.split('@')[0] ?? 'there';

  return (
    <div className="flex min-h-screen bg-[#080818]">
      <Sidebar email={user.email ?? undefined} userId={user.id} />

      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 overflow-x-hidden">
        <div className="px-4 py-6 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-8">

          {/* ── Page header ── */}
          <div className="pt-4 pb-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                {displayName}
              </span>{' '}
              👋
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-400">
              Here&apos;s what&apos;s happening with your projects today.
            </p>
          </div>

          {/* ── Stats ── */}
          <StatsStrip userId={user.id} />

          {/* ── Projects ── */}
          <ProjectGrid userId={user.id} />
        </div>
      </main>
    </div>
  );
}
