"use client";

import React, { useState } from 'react';
import { api, User } from '../api';
import { X, Lock, Mail, User as UserIcon, Building2, Sparkles, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  promptMessage?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  promptMessage,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'viewer' | 'studio'>('viewer');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await api.register(email, password, fullName, role);
      } else {
        res = await api.login(email, password);
      }
      onLoginSuccess(res.user, res.access_token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (eMail: string, pass: string) => {
    setEmail(eMail);
    setPassword(pass);
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await api.login(eMail, pass);
      onLoginSuccess(res.user, res.access_token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed quick login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#141414] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800/80 flex items-center justify-between bg-gradient-to-r from-red-950/40 to-[#141414]">
          <div className="flex items-center gap-2">
            <span className="font-black text-2xl tracking-tighter text-[#E50914]">POTHOLE</span>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider pl-2 border-l border-gray-700">
              {isRegister ? 'Create Account' : 'Sign In'}
            </span>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {promptMessage && !errorMsg && (
            <div className="p-3.5 bg-red-950/40 border border-red-700/50 rounded-xl text-red-200 text-xs flex items-center gap-2.5 shadow-inner">
              <Lock className="w-4 h-4 shrink-0 text-[#E50914]" />
              <span className="font-medium">{promptMessage}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-red-950/50 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                  Full Name / Studio Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Productions or John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#181818] border border-gray-800 focus:border-[#E50914] text-white pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@pothole.tv"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#181818] border border-gray-800 focus:border-[#E50914] text-white pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#181818] border border-gray-800 focus:border-[#E50914] text-white pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('viewer')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      role === 'viewer' 
                        ? 'bg-red-600/20 border-[#E50914] text-white' 
                        : 'bg-[#181818] border-gray-800 text-gray-400'
                    }`}
                  >
                    <span>🍿 Viewer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('studio')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      role === 'studio' 
                        ? 'bg-red-600/20 border-[#E50914] text-white' 
                        : 'bg-[#181818] border-gray-800 text-gray-400'
                    }`}
                  >
                    <span>🏢 Studio Partner</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#E50914] hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-900/30 text-sm cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Authenticating...' : (isRegister ? 'Complete Registration' : 'Sign In')}
            </button>
          </form>

          {/* 1-Click Demo Accounts */}
          <div className="pt-4 border-t border-gray-800/80">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Production Studio Demos</span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('scifi_studios@pothole.tv', 'StudioPass123!')}
                className="p-2 bg-[#1A1A1A] hover:bg-gray-800 border border-gray-800 rounded-lg text-left text-xs text-gray-200 transition-colors cursor-pointer"
              >
                <div className="font-bold truncate text-white">Apex Sci-Fi</div>
                <div className="text-[10px] text-gray-500">Studio Rights</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('action_studios@pothole.tv', 'StudioPass123!')}
                className="p-2 bg-[#1A1A1A] hover:bg-gray-800 border border-gray-800 rounded-lg text-left text-xs text-gray-200 transition-colors cursor-pointer"
              >
                <div className="font-bold truncate text-white">Titan Action</div>
                <div className="text-[10px] text-gray-500">Studio Rights</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('drama_studios@pothole.tv', 'StudioPass123!')}
                className="p-2 bg-[#1A1A1A] hover:bg-gray-800 border border-gray-800 rounded-lg text-left text-xs text-gray-200 transition-colors cursor-pointer"
              >
                <div className="font-bold truncate text-white">Criterion Drama</div>
                <div className="text-[10px] text-gray-500">Studio Rights</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('viewer_demo@pothole.tv', 'ViewerPass123!')}
                className="p-2 bg-[#1A1A1A] hover:bg-gray-800 border border-gray-800 rounded-lg text-left text-xs text-gray-200 transition-colors cursor-pointer"
              >
                <div className="font-bold truncate text-white">Demo Viewer</div>
                <div className="text-[10px] text-gray-500">Streaming User</div>
              </button>
            </div>
          </div>

          {/* Toggle Register / Sign In */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setErrorMsg(null); }}
              className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer underline"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
