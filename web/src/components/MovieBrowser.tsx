"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { api, ClaimedStatus } from '../api';
import { 
  Play, 
  Info, 
  Search, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Star, 
  ChevronRight, 
  ArrowLeft,
  Tv,
  Film
} from 'lucide-react';

interface MovieBrowserProps {
  refreshTrigger?: number;
  onOpenStudioPortal?: () => void;
}

export const MovieBrowser: React.FC<MovieBrowserProps> = ({ 
  refreshTrigger = 0,
  onOpenStudioPortal 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
   
  // Home Screen State
  const [homeData, setHomeData] = useState<any[]>([]);
  const [isLoadingHome, setIsLoadingHome] = useState(true);

  // Claimed Status Map from Django Backend
  const [claimedMap, setClaimedMap] = useState<Record<string, ClaimedStatus>>({});

  // TV Series State
  const [selectedSeries, setSelectedSeries] = useState<any | null>(null);
  const [seriesDetails, setSeriesDetails] = useState<any | null>(null);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);

  // Detail Modal State (for More Info)
  const [detailItem, setDetailItem] = useState<any | null>(null);

  // Load Claimed Titles from Django Backend
  const loadClaimedMap = useCallback(async () => {
    try {
      const map = await api.getClaimedStatusMap();
      setClaimedMap(map || {});
    } catch (e) {
      console.warn("Could not load claimed status map:", e);
    }
  }, []);

  useEffect(() => {
    loadClaimedMap();
  }, [loadClaimedMap, refreshTrigger]);

  // Load Home Data on Mount
  useEffect(() => {
    fetch('/api/home')
      .then(r => r.json())
      .then(d => {
        if (d.homepage) setHomeData(d.homepage);
        setIsLoadingHome(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoadingHome(false);
      });
  }, []);

  // Search Debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayFn = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/search-movies?q=${encodeURIComponent(searchQuery.trim())}`)
        .then(r => r.json())
        .then(d => {
          if (d.results) setSearchResults(d.results);
          setIsSearching(false);
        })
        .catch(() => setIsSearching(false));
    }, 450);
    return () => clearTimeout(delayFn);
  }, [searchQuery]);

  const fetchSeriesDetails = async (imdbId: string, seasonNumber: number = 1) => {
    setIsLoadingSeries(true);
    try {
      const res = await fetch(`/api/series-details?imdbId=${imdbId}&season=${seasonNumber}`);
      const data = await res.json();
      setSeriesDetails(data);
    } catch (e) {
      console.error("Failed to fetch series details", e);
    }
    setIsLoadingSeries(false);
  };

  const handleSelectMovieOrSeries = (item: any) => {
    if (item.type === 'series') {
      setSelectedSeries(item);
      setSeriesDetails(null);
      fetchSeriesDetails(item.videoId, 1);
    } else {
      handlePlay(item);
    }
  };

  const handlePlay = (item: any, s?: number, e?: number, epTitle?: string) => {
    usePlayerStore.getState().addToQueue({
      id: Math.random().toString(),
      type: item.type,
      title: item.type === 'series' ? `${item.title} - S${s! < 10 ? '0'+s : s}E${e! < 10 ? '0'+e : e} ${epTitle ? '- ' + epTitle : ''}` : item.title,
      videoId: item.videoId,
      thumbnailUrl: item.thumbnail,
      season: s,
      episode: e
    });
    usePlayerStore.getState().setPlaying(true);
    setSelectedSeries(null);
    setDetailItem(null);
  };

  const getClaimInfo = (imdbId?: string, title?: string): ClaimedStatus | null => {
    if (!imdbId && !title) return null;
    if (imdbId && claimedMap[imdbId]) return claimedMap[imdbId];
    if (title && claimedMap[title.toLowerCase()]) return claimedMap[title.toLowerCase()];
    return null;
  };

  const heroCategory = homeData.find(c => c.id === 'hero');
  const heroItem = heroCategory?.items?.[0];
  const carousels = homeData.filter(c => c.id !== 'hero');
  const heroClaimInfo = heroItem ? getClaimInfo(heroItem.videoId, heroItem.title) : null;

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar relative bg-[#0F0F0F] text-white">
      
      {/* Global Search Header - Floating Top Right */}
      <div className="absolute top-3 right-4 md:top-4 md:right-10 z-40 w-[200px] sm:w-[260px] md:w-[320px]">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search movies, series, studios..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 focus:border-[#E50914] focus:bg-[#1A1A1A] rounded-full py-2 pl-9 pr-8 text-white text-xs md:text-sm outline-none transition-all placeholder-gray-400 shadow-2xl"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
          {isSearching && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      </div>

      {/* Search Results Grid */}
      {searchQuery.trim().length >= 2 ? (
        <div className="px-4 md:px-10 pb-20 pt-20 md:pt-24">
          {searchQuery.startsWith('magnet:?') && (
            <div className="mb-6 p-4 bg-[#1A1A1A] rounded-xl border border-[#E50914] flex flex-col sm:flex-row items-center gap-4 shadow-xl">
              <div className="flex-1 overflow-hidden w-full">
                <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Direct P2P Magnet</span>
                <h3 className="text-white font-bold mb-1">Custom Swarm Stream</h3>
                <p className="text-gray-400 text-xs truncate font-mono">{searchQuery}</p>
              </div>
              <button 
                onClick={() => handlePlay({ type: 'movie', title: 'Custom Stream', videoId: searchQuery, thumbnail: '' })}
                className="bg-[#E50914] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg whitespace-nowrap w-full sm:w-auto transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-900/40"
              >
                <Play className="w-4 h-4 fill-white" />
                Play Magnet
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Results for</span>
              <span className="text-[#E50914]">"{searchQuery}"</span>
            </h2>
            <span className="text-xs text-gray-400 font-bold">{searchResults.length} titles found</span>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
              {searchResults.map((item, i) => {
                const claim = getClaimInfo(item.videoId, item.title);
                return (
                  <div 
                    key={i} 
                    className="flex flex-col group cursor-pointer" 
                    onClick={() => handleSelectMovieOrSeries(item)}
                  >
                    <div className="w-full aspect-[2/3] bg-[#1A1A1A] rounded-lg overflow-hidden relative shadow-lg group-hover:ring-2 group-hover:ring-[#E50914] transition-all group-hover:scale-105 duration-300">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} className="w-full h-full object-cover" alt={item.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Image</div>
                      )}
                      
                      {/* Format Badge */}
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-wider bg-black/70 backdrop-blur-md border border-white/10">
                        {item.type}
                      </div>

                      {/* Studio Ownership / Licensing Badge */}
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent">
                        {claim ? (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-amber-950/70 border border-amber-600/40 px-1.5 py-0.5 rounded backdrop-blur-md">
                            <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{claim.studio_name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-600/30 px-1.5 py-0.5 rounded backdrop-blur-md">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            <span className="truncate">Unlicensed</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-200 text-xs font-bold mt-2 truncate group-hover:text-white transition-colors">{item.title}</p>
                    <p className="text-gray-400 text-[10px]">{item.year || ''}</p>
                  </div>
                );
              })}
            </div>
          ) : !isSearching ? (
            <div className="text-center py-20">
              <Film className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No titles found for "{searchQuery}".</p>
              <p className="text-gray-500 text-xs mt-1">Try another title or paste a magnet link.</p>
            </div>
          ) : null}
        </div>
      ) : (
        /* Netflix Home Feed */
        <div className="pb-24">
          {isLoadingHome ? (
            <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
              <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs uppercase font-bold tracking-widest text-gray-400">Loading Pothole Studio Network...</p>
            </div>
          ) : (
            <>
              {/* Cinematic Netflix Hero Section */}
              {heroItem && (
                <div className="relative w-full h-[60vh] md:h-[75vh] mb-8 select-none">
                  {/* Backdrop Image */}
                  <div className="absolute inset-0 bg-black">
                    {heroItem.thumbnail && (
                      <img 
                        src={heroItem.thumbnail} 
                        className="w-full h-full object-cover object-center opacity-40 md:opacity-60 scale-105 filter contrast-110" 
                        alt={heroItem.title} 
                      />
                    )}
                    {/* Multi-stop Netflix gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/40 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/60 to-transparent"></div>
                  </div>

                  {/* Hero Information */}
                  <div className="absolute bottom-10 left-4 md:left-12 right-4 max-w-2xl z-20">
                    
                    {/* Exclusive Studio Ownership Badge */}
                    {heroClaimInfo ? (
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-red-950/30 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold text-amber-300 mb-3 shadow-lg backdrop-blur-md">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>EXCLUSIVELY LICENSED TO {heroClaimInfo.studio_name.toUpperCase()}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-gray-300 mb-3 backdrop-blur-md">
                        <Sparkles className="w-3.5 h-3.5 text-red-400" />
                        <span>POTHOLE ORIGINAL RELEASE</span>
                      </div>
                    )}

                    <h1 className="text-4xl md:text-6xl font-black text-white mb-2 md:mb-3 tracking-tight drop-shadow-2xl">
                      {heroItem.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-300 font-bold mb-4">
                      <span className="text-emerald-400 font-black">99% Match</span>
                      <span>{heroItem.year}</span>
                      <span className="border border-gray-600 px-1.5 py-0.2 rounded text-[11px] text-gray-300">
                        {heroItem.type?.toUpperCase()}
                      </span>
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-3.5 h-3.5 fill-yellow-400" />
                        {heroItem.rating || '8.7'}
                      </span>
                      <span className="border border-white/20 px-1.5 py-0.2 rounded text-[10px] text-gray-400">
                        HD 1080P
                      </span>
                    </div>

                    <p className="text-gray-300 text-sm md:text-base line-clamp-3 mb-6 max-w-xl drop-shadow-md leading-relaxed">
                      {heroItem.plot || 'A cinematic masterpiece streaming in high definition peer-to-peer distribution.'}
                    </p>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleSelectMovieOrSeries(heroItem)}
                        className="bg-white hover:bg-gray-200 text-black px-7 py-3 rounded-lg font-black text-sm md:text-base transition-transform active:scale-95 flex items-center gap-2 cursor-pointer shadow-xl"
                      >
                        <Play className="w-5 h-5 fill-black" />
                        Play Now
                      </button>

                      <button 
                        onClick={() => setDetailItem(heroItem)}
                        className="bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 px-6 py-3 rounded-lg font-bold text-sm md:text-base transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Info className="w-5 h-5" />
                        More Info
                      </button>

                      {onOpenStudioPortal && !heroClaimInfo && (
                        <button 
                          onClick={onOpenStudioPortal}
                          className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-red-900/60 to-red-800/40 hover:from-[#E50914] text-white border border-red-500/40 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <Building2 className="w-4 h-4 text-red-300" />
                          <span>Acquire Rights</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Categorized Netflix Rows */}
              <div className="flex flex-col gap-8 md:gap-10 -mt-4 relative z-20">
                {carousels.map((cat, idx) => (
                  <div key={idx} className="flex flex-col px-4 md:px-12 group/row">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                        {cat.title}
                        <ChevronRight className="w-4 h-4 text-[#E50914] opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-1 transition-all" />
                      </h3>
                      <span className="text-xs text-gray-500 font-bold">Explore All</span>
                    </div>

                    <div className="flex gap-3 md:gap-4 overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth snap-x">
                      {cat.items.map((item: any, i: number) => {
                        const claim = getClaimInfo(item.videoId, item.title);
                        return (
                          <div 
                            key={i} 
                            className="w-[130px] sm:w-[160px] md:w-[190px] shrink-0 snap-start flex flex-col group cursor-pointer"
                            onClick={() => handleSelectMovieOrSeries(item)}
                          >
                            <div className="w-full aspect-[2/3] bg-[#1A1A1A] rounded-lg overflow-hidden relative shadow-lg group-hover:ring-2 group-hover:ring-[#E50914] transition-all group-hover:scale-105 duration-300">
                              {item.thumbnail ? (
                                <img src={item.thumbnail} className="w-full h-full object-cover" alt={item.title} loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Image</div>
                              )}

                              {/* Format Badge */}
                              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-wider bg-black/70 backdrop-blur-md border border-white/10">
                                {item.type}
                              </div>

                              {/* Hover Overlay with Studio Badge & Quick Play */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                                {claim ? (
                                  <div className="text-[9px] font-bold text-amber-300 bg-amber-950/80 border border-amber-600/50 px-1.5 py-0.5 rounded mb-2 flex items-center gap-1">
                                    <Building2 className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                    <span className="truncate">{claim.studio_name}</span>
                                  </div>
                                ) : (
                                  <div className="text-[8px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-600/40 px-1.5 py-0.5 rounded mb-2 flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                    <span className="truncate">Unclaimed</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-black shadow-md hover:scale-110 transition-transform">
                                    <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                                  </div>
                                  <span className="text-xs font-bold text-white">Play</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-200 text-xs font-bold mt-2 truncate group-hover:text-white transition-colors">
                              {item.title}
                            </p>
                            <p className="text-gray-500 text-[10px] font-semibold">
                              {item.year || ''} {item.rating ? `• ⭐ ${item.rating}` : ''}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Series Selection Overlay - Netflix Styled */}
      {selectedSeries && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0F0F0F] animate-in slide-in-from-right-full duration-300">
          {/* Header / Backdrop */}
          <div className="relative h-56 md:h-72 shrink-0 bg-black">
            {selectedSeries.thumbnail && (
              <>
                <img src={selectedSeries.thumbnail} className="w-full h-full object-cover opacity-35" alt={selectedSeries.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/60 to-transparent"></div>
              </>
            )}
            
            <button 
              onClick={() => setSelectedSeries(null)} 
              className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-colors z-10 backdrop-blur-md border border-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="absolute bottom-6 left-4 md:left-8 right-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#E50914] uppercase tracking-wider mb-1">
                <Tv className="w-4 h-4" />
                <span>TV Series Series Guide</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-lg">{selectedSeries.title}</h2>
              <p className="text-gray-400 text-xs md:text-sm font-semibold mt-1">
                {selectedSeries.year || seriesDetails?.year || ''} • {seriesDetails?.totalSeasons ? `${seriesDetails.totalSeasons} Seasons` : 'High Definition P2P'}
              </p>
            </div>
          </div>

          {/* Season Selector */}
          <div className="px-4 md:px-8 py-3 shrink-0 border-b border-white/10 flex items-center justify-between bg-[#141414]">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase font-bold text-gray-400">Season:</span>
              <select 
                disabled={isLoadingSeries || !seriesDetails}
                className="bg-[#1F1F1F] text-white border border-gray-700 text-sm rounded-lg focus:ring-[#E50914] focus:border-[#E50914] px-4 py-2 font-bold outline-none cursor-pointer disabled:opacity-50"
                onChange={(e) => fetchSeriesDetails(selectedSeries.videoId, parseInt(e.target.value))}
                value={seriesDetails?.currentSeason || 1}
              >
                {seriesDetails ? (
                  Array.from({ length: seriesDetails.totalSeasons }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Season {i + 1}</option>
                  ))
                ) : (
                  <option>Loading Seasons...</option>
                )}
              </select>
            </div>

            <button 
              onClick={() => handlePlay(selectedSeries, 1, 1)}
              className="bg-[#E50914] hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/40"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Play S1E1</span>
            </button>
          </div>

          {/* Episode List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-8 pb-24">
            {isLoadingSeries ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading Episodes...</p>
              </div>
            ) : seriesDetails?.episodes?.length > 0 ? (
              <div className="flex flex-col gap-2.5 max-w-4xl mx-auto">
                {seriesDetails.episodes.map((ep: any) => (
                  <div 
                    key={ep.episodeNumber}
                    onClick={() => handlePlay(selectedSeries, seriesDetails.currentSeason, ep.episodeNumber, ep.title)}
                    className="flex items-center gap-4 p-3 md:p-4 rounded-xl hover:bg-[#1A1A1A] border border-transparent hover:border-gray-800 cursor-pointer transition-all group"
                  >
                    <div className="text-2xl md:text-3xl font-black text-gray-600 group-hover:text-white transition-colors w-8 text-center shrink-0">
                      {ep.episodeNumber}
                    </div>

                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <h4 className="text-sm md:text-base font-bold text-gray-200 group-hover:text-white truncate">
                        {ep.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ep.released !== 'N/A' ? ep.released : 'Air Date N/A'} {ep.imdbRating !== 'N/A' ? `• ⭐ ${ep.imdbRating}` : ''}
                      </p>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-[#E50914] text-gray-400 group-hover:text-white flex items-center justify-center transition-all shrink-0 border border-white/10 group-hover:border-transparent">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-16">
                No episode listings returned for this season.
              </div>
            )}
          </div>
        </div>
      )}

      {/* More Info Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-gray-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setDetailItem(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-gray-300 hover:text-white flex items-center justify-center border border-white/10 cursor-pointer"
            >
              ✕
            </button>

            <div className="relative h-56 bg-black">
              {detailItem.thumbnail && (
                <img src={detailItem.thumbnail} className="w-full h-full object-cover opacity-50" alt={detailItem.title} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-6 right-6">
                <h3 className="text-2xl font-black text-white">{detailItem.title}</h3>
                <p className="text-xs text-[#E50914] font-bold uppercase tracking-wider mt-1">
                  {detailItem.year} • {detailItem.type?.toUpperCase()} {detailItem.rating ? `• ⭐ ${detailItem.rating}` : ''}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                {detailItem.plot || 'Exclusive digital release streaming via the Pothole distributed network.'}
              </p>

              {/* Rights details */}
              {(() => {
                const claim = getClaimInfo(detailItem.videoId, detailItem.title);
                return claim ? (
                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-200">Licensed Production Asset</p>
                      <p className="text-[11px] text-gray-400">Exclusive digital rights held by <span className="text-white font-semibold">{claim.studio_name}</span></p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-200">Available for Licensing</p>
                        <p className="text-[11px] text-gray-400">This title is unclaimed. Any studio can license it.</p>
                      </div>
                    </div>
                    {onOpenStudioPortal && (
                      <button 
                        onClick={() => {
                          setDetailItem(null);
                          onOpenStudioPortal();
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Claim Rights
                      </button>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={() => handleSelectMovieOrSeries(detailItem)}
                  className="flex-1 bg-[#E50914] hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-900/40"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Streaming Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
