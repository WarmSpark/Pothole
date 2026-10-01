"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePlayerStore } from "../store/usePlayerStore";
import { Player } from "../components/Player";
import { MovieBrowser } from "../components/MovieBrowser";
import { AuthModal } from "../components/AuthModal";
import { StudioModal } from "../components/StudioModal";
import { api, User } from "../api";
import { 
  Building2, 
  DollarSign, 
  LogIn, 
  LogOut, 
  Film, 
  Tv, 
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Search
} from "lucide-react";

export default function Home() {
  const queue = usePlayerStore(state => state.queue);
  const isPlaying = queue.length > 0;

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Auth & Studio States
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioEarnings, setStudioEarnings] = useState<number>(0);
  const [claimedTitlesCount, setClaimedTitlesCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Restore session from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("pothole_token");
      const savedUserStr = localStorage.getItem("pothole_user");
      if (savedToken && savedUserStr) {
        try {
          const parsedUser = JSON.parse(savedUserStr);
          setUser(parsedUser);
          setToken(savedToken);
        } catch {
          localStorage.removeItem("pothole_token");
          localStorage.removeItem("pothole_user");
        }
      }
    }
  }, []);

  // Fetch studio portfolio & earnings whenever studio user is active
  const fetchStudioStats = useCallback(async () => {
    if (!token || user?.role !== "studio") return;
    try {
      const data = await api.getStudioPortfolio(token);
      setStudioEarnings(data.total_portfolio_earnings_usd || 0);
      setClaimedTitlesCount(data.titles_count || 0);
    } catch (err) {
      console.warn("Could not fetch studio portfolio stats:", err);
    }
  }, [token, user]);

  useEffect(() => {
    fetchStudioStats();
    const interval = setInterval(fetchStudioStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStudioStats]);

  const handleLoginSuccess = (loggedInUser: User, accessToken: string) => {
    setUser(loggedInUser);
    setToken(accessToken);
    setAuthPromptMessage(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("pothole_token", accessToken);
      localStorage.setItem("pothole_user", JSON.stringify(loggedInUser));
    }
    if (loggedInUser.role === "studio") {
      setIsStudioOpen(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setStudioEarnings(0);
    setClaimedTitlesCount(0);
    usePlayerStore.getState().clearQueue();
    if (typeof window !== "undefined") {
      localStorage.removeItem("pothole_token");
      localStorage.removeItem("pothole_user");
    }
  };

  const handleMovieClaimed = () => {
    fetchStudioStats();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="w-screen h-[100dvh] flex flex-col bg-[#0F0F0F] overflow-hidden font-sans text-gray-100 select-none">
      {/* Netflix Top Navigation Bar */}
      <nav className={`h-16 md:h-20 shrink-0 bg-gradient-to-b from-black/95 via-black/80 to-transparent flex items-center justify-between px-4 md:px-10 z-50 absolute top-0 w-full transition-all duration-300 ${isPlaying ? "bg-black/95 pointer-events-auto" : "pointer-events-none"}`}>
        
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-4 md:gap-6 pointer-events-auto shrink-0">
          <div 
            onClick={() => {
              if (isPlaying) usePlayerStore.getState().clearQueue();
              setSearchQuery("");
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#E50914] flex items-center justify-center font-black text-white text-lg tracking-tighter shadow-lg shadow-red-900/50 group-hover:scale-105 transition-transform">
              P
            </div>
            <span className="font-black text-2xl md:text-3xl tracking-tighter text-[#E50914] drop-shadow-md">
              POTHOLE
            </span>
            <span className="hidden lg:inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/10 text-gray-300 border border-white/10">
              STUDIOS
            </span>
          </div>
        </div>

        {/* Global Netflix Search Input in Navbar */}
        {!isPlaying && (
          <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-3 sm:mx-6 pointer-events-auto">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search movies, series, studios..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/60 hover:bg-black/80 focus:bg-[#1A1A1A] border border-white/20 focus:border-[#E50914] rounded-full py-1.5 md:py-2 pl-9 pr-8 text-white text-xs md:text-sm outline-none transition-all placeholder-gray-400 shadow-xl"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 md:gap-4 pointer-events-auto shrink-0">
          {isPlaying ? (
            <button 
              onClick={() => usePlayerStore.getState().clearQueue()}
              className="text-xs md:text-sm font-bold bg-[#E50914] hover:bg-red-700 text-white px-4 py-2 rounded-md transition-all shadow-lg shadow-red-900/40 flex items-center gap-2 cursor-pointer"
            >
              <span>✕</span> Exit Player
            </button>
          ) : (
            <>
              {/* Studio Portal / Earnings Button */}
              {user?.role === "studio" ? (
                <div className="flex items-center gap-2">
                  {/* Revenue Ticker */}
                  <div 
                    onClick={() => setIsStudioOpen(true)}
                    className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-950/60 to-black/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-full cursor-pointer hover:border-emerald-400 transition-all shadow-lg group"
                    title="Click to view Studio Ledger"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Earnings:</span>
                    <span className="text-xs md:text-sm font-mono font-bold text-emerald-300 group-hover:text-emerald-200">
                      ${studioEarnings.toFixed(4)}
                    </span>
                  </div>

                  {/* Studio Management Hub Trigger */}
                  <button
                    onClick={() => setIsStudioOpen(true)}
                    className="bg-gradient-to-r from-[#E50914] to-red-800 hover:from-red-600 hover:to-red-700 text-white text-xs md:text-sm font-bold px-3.5 py-2 rounded-lg transition-all shadow-lg shadow-red-900/40 flex items-center gap-2 cursor-pointer border border-red-500/30"
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="hidden md:inline">{user.full_name || "Studio Hub"}</span>
                    <span className="md:hidden">Studio</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-gradient-to-r from-red-900/60 to-[#E50914]/80 hover:from-[#E50914] hover:to-red-600 text-white text-xs md:text-sm font-bold px-3.5 py-2 rounded-lg transition-all shadow-lg shadow-red-900/30 flex items-center gap-2 cursor-pointer border border-red-500/40"
                >
                  <Building2 className="w-4 h-4 shrink-0 text-red-300" />
                  <span className="hidden sm:inline">Production Portal</span>
                  <span className="sm:hidden">Studios</span>
                </button>
              )}

              {/* User Profile / Auth State */}
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex flex-col items-end">
                    <span className="text-xs font-bold text-gray-200">{user.full_name || user.email.split('@')[0]}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{user.role}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all border border-white/10 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-bold px-3.5 sm:px-4 py-2 rounded-lg transition-all border border-white/15 backdrop-blur-md flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Netflix Movie & Series Browser */}
        {!isPlaying && (
          <div className="w-full h-full flex flex-col bg-[#0F0F0F] z-10 animate-in fade-in duration-500">
            <MovieBrowser 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              refreshTrigger={refreshTrigger}
              isLoggedIn={!!user}
              onRequireAuth={(msg) => {
                setAuthPromptMessage(msg || "Sign in with a Viewer or Studio account to watch movies and series.");
                setIsAuthOpen(true);
              }}
              onOpenStudioPortal={() => {
                if (user?.role === "studio") {
                  setIsStudioOpen(true);
                } else {
                  setAuthPromptMessage("Sign in with a Studio account to access the Production Studio Portal.");
                  setIsAuthOpen(true);
                }
              }}
            />
          </div>
        )}

        {/* Torrent Video Player (Full Viewport on play) */}
        {isPlaying && (
          <div className="w-full h-full flex flex-col bg-black relative z-20 animate-in slide-in-from-bottom-6 fade-in duration-400 shadow-2xl">
            <Player 
              isLoggedIn={!!user}
              onRequireAuth={() => {
                setAuthPromptMessage("Sign in with a Viewer or Studio account to stream movies.");
                setIsAuthOpen(true);
              }}
            />
          </div>
        )}
      </div>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthPromptMessage(null);
        }}
        promptMessage={authPromptMessage}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Studio Production & Rights Modal */}
      <StudioModal 
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        token={token}
        studioName={user?.full_name}
        onMovieClaimed={handleMovieClaimed}
      />
    </main>
  );
}
