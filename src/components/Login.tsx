import React, { useState } from 'react';
import { Smartphone, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { toBanglaNumber } from '../utils';
import Logo from './Logo';

interface LoginProps {
  onLoginSuccess: (username: string) => void;
  onBackClick: () => void;
}

export default function Login({ onLoginSuccess, onBackClick }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('দয়া করে ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    // Get the stored password (default: 'admin')
    const storedPassword = localStorage.getItem('molla_admin_password') || 'admin';

    // Support both standard admin and Bengali proprietor username
    if ((username === 'admin' || username === 'নুরুল ইসলাম মোল্লা') && password === storedPassword) {
      setError('');
      onLoginSuccess(username === 'admin' ? 'নুরুল ইসলাম মোল্লা' : username);
    } else {
      setError('ভুল ইউজারনেম অথবা পাসওয়ার্ড! পুনরায় চেষ্টা করুন।');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background design accents */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-tr from-pink-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-96 h-96 bg-gradient-to-br from-amber-500/5 to-pink-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <button
          onClick={onBackClick}
          className="inline-flex items-center gap-2 text-xs text-pink-400 hover:text-pink-300 font-bold mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>কাস্টমার পেইজে ফিরে যান</span>
        </button>

        <div className="flex justify-center">
          <Logo size="lg" className="hover:scale-105 transition-transform" />
        </div>
        
        <p className="mt-3 text-center text-xs sm:text-sm text-slate-400 font-medium">
          রিয়েল-টাইম স্টক, রিপোর্ট ও ইনভয়েস ম্যানেজমেন্ট ড্যাশবোর্ড
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900 border border-white/10 py-8 px-4 shadow-2xl rounded-3xl sm:px-10">
          <div className="mb-6 bg-slate-950 border border-white/5 p-3.5 rounded-xl">
            <span className="block text-[11px] font-black bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent uppercase tracking-wider mb-1 px-1">
               সিস্টেম লগইন তথ্য (বাংলা অথবা ইংরেজি):
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold px-1">
              ইউজারনেম: <span className="text-white bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono">admin</span> অথবা <span className="text-white bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">নুরুল ইসলাম মোল্লা</span>
              <br className="mb-1" />
              পাসওয়ার্ড: <span className="text-white bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono">{localStorage.getItem('molla_admin_password') ? '••••••' : 'admin'}</span>
              {!localStorage.getItem('molla_admin_password') && (
                <span className="text-[10px] text-amber-400/70 block mt-1">পরামর্শ: সেটিংসে গিয়ে পাসওয়ার্ড পরিবর্তন করুন</span>
              )}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-300 mb-1.5">
                ইউজারনেম
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-white text-sm"
                  placeholder="admin বা প্রোপ্রাইটর নাম"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                পাসওয়ার্ড
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-white text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full py-3 px-4 text-sm font-black text-white bg-gradient-to-r from-pink-600 via-amber-500 to-cyan-500 rounded-xl shadow-lg hover:opacity-90 transition-opacity cursor-pointer focus:outline-hidden"
              >
                লগইন করুন
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
