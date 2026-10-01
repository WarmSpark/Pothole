"use client";

import React, { useState, useEffect } from 'react';
import { api, StudioMovieItem } from '../api';
import { 
  Building2, 
  DollarSign, 
  Film, 
  Clock, 
  Search, 
  Lock, 
  CheckCircle2, 
  Plus, 
  X, 
  AlertCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface StudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  studioName?: string;
  onMovieClaimed?: () => void;
}

export const StudioModal: React.FC<StudioModalProps> = ({
  isOpen,
  onClose,
  token,
  studioName,
  onMovieClaimed
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'search'>('portfolio');
  const [portfolio, setPortfolio] = useState<StudioMovieItem[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [claimStatusMsg, setClaimStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Load portfolio
  const loadPortfolio = async () => {
    if (!token) return;
    setIsLoadingPortfolio(true);
    try {
      const res = await api.getStudioPortfolio(token);
      setPortfolio(res.movies || []);
      setTotalEarnings(res.total_portfolio_earnings_usd || 0);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      loadPortfolio();
    }
  }, [isOpen, token]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchOMDbWithClaimStatus(searchQuery.trim());
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleClaim = async (item: any) => {
    if (!token) return;
    setClaimingId(item.imdbID || item.title);
    setClaimStatusMsg(null);

    try {
      const res = await api.claimMovie({
        imdb_id: item.imdbID,
        title: item.title,
        release_year: item.year,
        poster_url: item.poster
      }, token);

      setClaimStatusMsg({
        text: res.message || `Successfully acquired rights to '${item.title}'!`,
        isError: false
      });

      // Refresh search results to show claimed
      setSearchResults(prev => prev.map(m => {
        if (m.imdbID === item.imdbID) {
          return { ...m, is_claimed: true, studio_owner: studioName || 'Your Studio' };
        }
        return m;
      }));

      // Reload studio portfolio
      loadPortfolio();
      if (onMovieClaimed) onMovieClaimed();
    } catch (err: any) {
      setClaimStatusMsg({
        text: err.message || 'Cannot claim: Movie is already licensed to another studio.',
        isError: true
      });
    } finally {
      setClaimingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
      <div className="bg-[#141414] border border-gray-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header Bar */}
        <div className="p-6 border-b border-gray-800/80 flex items-center justify-between bg-gradient-to-r from-red-950/30 via-[#181818] to-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E50914] flex items-center justify-center text-white shadow-lg shadow-red-900/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                  {studioName || 'Production Studio Portal'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600/20 text-[#E50914] border border-red-600/30 uppercase tracking-widest">
                  Verified Studio
                </span>
              </div>
              <p className="text-xs text-gray-400">Digital Asset Management & Micro-Royalty Distribution</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 border-b border-gray-800/60 bg-[#161616]">
          <div className="bg-[#1F1F1F] p-4 rounded-xl border border-gray-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Revenue Accrued</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-0.5">${totalEarnings.toFixed(4)}</h3>
              <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Updated live per 10s stream
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#1F1F1F] p-4 rounded-xl border border-gray-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Licensed Titles</p>
              <h3 className="text-2xl font-black text-white mt-0.5">{portfolio.length} Movies</h3>
              <p className="text-[10px] text-gray-500 mt-1">Exclusive distribution rights</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-[#E50914] flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#1F1F1F] p-4 rounded-xl border border-gray-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Time Streamed</p>
              <h3 className="text-2xl font-black text-blue-400 mt-0.5">
                {(portfolio.reduce((acc, m) => acc + (m.total_hours_watched || 0), 0)).toFixed(1)} hrs
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Global viewer watch time</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 px-6 pt-3 gap-6 bg-[#141414]">
          <button
            onClick={() => { setActiveTab('portfolio'); setClaimStatusMsg(null); }}
            className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'portfolio' 
                ? 'border-[#E50914] text-white' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>My Licensed Portfolio ({portfolio.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('search'); setClaimStatusMsg(null); }}
            className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'search' 
                ? 'border-[#E50914] text-white' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>License New Titles (Global OMDb)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#101010]">
          
          {/* TAB 1: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div>
              {isLoadingPortfolio ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs uppercase tracking-widest font-bold">Loading Studio Ledger...</p>
                </div>
              ) : portfolio.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500 mb-4">
                    <Film className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">No Titles In Your Portfolio</h4>
                  <p className="text-sm text-gray-400 mb-6">
                    Search and acquire exclusive rights to movies to start collecting real-time micro-royalties when viewers stream.
                  </p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="bg-[#E50914] hover:bg-red-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>License First Title</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolio.map((movie) => (
                    <div 
                      key={movie.id} 
                      className="bg-[#181818] border border-gray-800/80 hover:border-gray-700 p-4 rounded-xl flex gap-4 transition-all"
                    >
                      <img 
                        src={movie.poster_url} 
                        alt={movie.title}
                        className="w-20 h-28 object-cover rounded-lg shrink-0 shadow-md bg-gray-900"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-white font-bold text-base truncate">{movie.title}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 shrink-0">
                              +${(movie.total_earnings || 0).toFixed(4)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{movie.release_year} • {movie.duration_minutes}m</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-800/60 text-xs">
                          <div>
                            <span className="text-gray-500 block text-[10px] uppercase">Hours Streamed</span>
                            <span className="text-gray-200 font-mono font-bold">{(movie.total_hours_watched || 0).toFixed(2)}h</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px] uppercase">Stream Sessions</span>
                            <span className="text-gray-200 font-mono font-bold">{movie.total_streams || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SEARCH & CLAIM */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Notification Banner */}
              {claimStatusMsg && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                  claimStatusMsg.isError 
                    ? 'bg-red-950/60 border border-red-800/60 text-red-200' 
                    : 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-200'
                }`}>
                  {claimStatusMsg.isError ? (
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <span>{claimStatusMsg.text}</span>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search any title worldwide to license exclusively (e.g. Inception, Dune, Barbie, Gladiator)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#181818] border border-gray-800 focus:border-[#E50914] text-white pl-12 pr-4 py-3.5 rounded-xl text-sm outline-none transition-colors"
                />
              </div>

              {/* Search Results */}
              {isSearching ? (
                <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <div className="w-6 h-6 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs uppercase tracking-wider font-bold">Scanning Global OMDb Catalog...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {searchResults.map((item) => {
                    const isClaimed = item.is_claimed;
                    const isClaiming = claimingId === (item.imdbID || item.title);

                    return (
                      <div 
                        key={item.imdbID}
                        className="bg-[#181818] border border-gray-800/80 p-4 rounded-xl flex gap-4 items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={item.poster} 
                            alt={item.title} 
                            className="w-16 h-24 object-cover rounded-lg shrink-0 bg-gray-900 shadow"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h4 className="text-white font-bold text-sm truncate">{item.title}</h4>
                            <p className="text-xs text-gray-400">{item.year} • {item.type}</p>
                            
                            <div className="mt-2">
                              {isClaimed ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/60">
                                  <Lock className="w-3 h-3 text-red-400" />
                                  <span>Licensed to {item.studio_owner || 'Another Studio'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                                  <Sparkles className="w-3 h-3 text-emerald-400" />
                                  <span>Available to License</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          {isClaimed ? (
                            <button
                              disabled
                              className="px-3 py-2 rounded-lg bg-gray-900 text-gray-500 text-xs font-bold border border-gray-800 cursor-not-allowed flex items-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Unavailable</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleClaim(item)}
                              disabled={isClaiming}
                              className="px-4 py-2 rounded-lg bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-900/30 disabled:opacity-50"
                            >
                              {isClaiming ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                              <span>Claim Rights</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="py-16 text-center text-gray-500">
                  <p>No matching titles found for "{searchQuery}".</p>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-sm">Type any movie title above to check rights availability worldwide.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
