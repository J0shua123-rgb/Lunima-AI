'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  email?: string;
  userId?: string;
}

const NAV_LINKS = [
  {
    name: 'All Projects',
    href: '/dashboard',
    d: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
    disabled: false,
  },
  {
    name: 'Recent',
    href: '/dashboard/recent',
    d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    disabled: true,
  },
  {
    name: 'Templates',
    href: '/dashboard/templates',
    d: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
    disabled: true,
  },
  {
    name: 'Inspiration',
    href: '/dashboard/inspiration',
    d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    disabled: true,
  },
];

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function Sidebar({ email, userId }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [creating, setCreating] = useState(false);

  const initial = email ? email.charAt(0).toUpperCase() : 'U';
  const displayName = email ? email.split('@')[0] : 'User';

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleNewProject = async () => {
    setCreating(true);
    if (!userId) { router.push('/login'); return; }

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
      router.push(`/editor/${data.id}`);
    }
    setCreating(false);
  };

  const renderContent = (onLinkClick?: () => void) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#2563EB] flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-wide text-white">Lumina AI</span>
        </div>
      </div>

      {/* New Project CTA */}
      <div className="px-4 pb-4 shrink-0">
        <button
          onClick={handleNewProject}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {creating ? (
            <SpinnerIcon className="h-4 w-4 text-white" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          )}
          {creating ? 'Creating...' : 'New Project'}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 overflow-y-auto space-y-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
          Navigate
        </p>
        {NAV_LINKS.map((link) => {
          const isActive = !link.disabled && pathname === link.href;

          const sharedClassName = `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group ${
            link.disabled
              ? 'cursor-not-allowed text-gray-600'
              : isActive
              ? 'bg-gradient-to-r from-violet-600/20 to-blue-600/10 text-white border border-violet-500/20'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`;

          const inner = (
            <>
              {isActive && (
                <span className="absolute left-0 top-[20%] h-[60%] w-[3px] rounded-r-full bg-gradient-to-b from-violet-500 to-blue-500" />
              )}
              <svg
                className={`w-5 h-5 shrink-0 transition-colors ${
                  link.disabled ? 'text-gray-700' : isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2 : 1.75} d={link.d} />
              </svg>
              <span className="flex-1">{link.name}</span>
              {link.disabled && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-700 bg-white/5 rounded px-1.5 py-0.5">
                  Soon
                </span>
              )}
            </>
          );

          return link.disabled ? (
            <span
              key={link.name}
              title="Coming soon"
              className={sharedClassName}
            >
              {inner}
            </span>
          ) : (
            <Link
              key={link.name}
              href={link.href}
              onClick={onLinkClick}
              className={sharedClassName}
            >
              {inner}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-md shadow-violet-500/20">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{displayName}</p>
            <p className="text-[10px] text-gray-500 truncate">{email || '...'}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
          >
            {loggingOut ? (
              <SpinnerIcon className="h-4 w-4" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between px-4 bg-[#0d0d1f]/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#2563EB] flex items-center justify-center shadow-md shadow-violet-500/30">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-base font-bold text-white tracking-wide">Lumina AI</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Open navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0d0d1f] border-r border-white/5 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-3 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close navigation"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {renderContent(() => setMobileOpen(false))}
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[260px] flex-col bg-[#0d0d1f] border-r border-white/5">
        {renderContent()}
      </aside>
    </>
  );
}
