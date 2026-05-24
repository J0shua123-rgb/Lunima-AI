'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      }
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0a0a1a] to-[#0f0f2e] px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-[420px] space-y-8 bg-[#13132b]/80 p-10 rounded-3xl border border-violet-500/30 shadow-[0_0_30px_rgba(124,58,237,0.15)] backdrop-blur-xl">
        <div className="text-center">
          {/* Logo / Wordmark */}
          <div className="flex justify-center items-center mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#2563EB] flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="ml-3 text-2xl font-bold tracking-wider text-white">Lumina AI</span>
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Create an account
          </h2>
          <p className="mt-3 text-sm text-gray-400">
            Join Lumina AI to start creating
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="rounded-lg bg-red-950/50 p-4 border border-red-900/50 backdrop-blur-sm">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white rounded-lg py-3 font-semibold hover:brightness-110 transition-all disabled:opacity-50 flex justify-center items-center" 
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Sign up"}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div className="w-full border-t border-gray-700/50"></div>
            <div className="px-4 text-xs text-gray-500 uppercase tracking-widest bg-transparent whitespace-nowrap">or continue with</div>
            <div className="w-full border-t border-gray-700/50"></div>
          </div>

          <div className="mt-6">
            <button 
              type="button"
              disabled
              className="w-full border border-white/20 rounded-lg py-3 flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 opacity-90" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
