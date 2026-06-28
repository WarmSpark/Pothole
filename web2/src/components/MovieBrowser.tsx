"use client";
import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export const MovieBrowser = () => {
   const [searchQuery, setSearchQuery] = useState('');
   const [searchResults, setSearchResults] = useState<any[]>([]);
   const [isSearching, setIsSearching] = useState(false);
   
   // Home Screen State
   const [homeData, setHomeData] = useState<any[]>([]);
   const [isLoadingHome, setIsLoadingHome] = useState(true);

   // TV Series State
   const [selectedSeries, setSelectedSeries] = useState<any | null>(null);
   const [seriesDetails, setSeriesDetails] = useState<any | null>(null);
   const [isLoadingSeries, setIsLoadingSeries] = useState(false);

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
      if (searchQuery.length < 2) {
         setSearchResults([]);
         return;
      }
      const delayFn = setTimeout(() => {
         setIsSearching(true);
         fetch(`/api/search-movies?q=${encodeURIComponent(searchQuery)}`)
           .then(r => r.json())
           .then(d => {
              if (d.results) setSearchResults(d.results);
              setIsSearching(false);
           });
      }, 500);
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
   };

   const heroCategory = homeData.find(c => c.id === 'hero');
   const heroItem = heroCategory?.items?.[0];
   const carousels = homeData.filter(c => c.id !== 'hero');

   return (
      <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar relative bg-[#0C111B]">
         {/* Global Search Header - Floating Top Right */}
         <div className="absolute top-3 right-4 md:top-5 md:right-10 z-50 w-[180px] sm:w-[240px] md:w-[300px]">
            <div className="relative w-full">
               <svg className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
               <input 
                 type="text"
                 placeholder="Search titles..."
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/10 focus:border-[#1f80e0] focus:bg-[#192133]/90 rounded-full py-2 pl-9 pr-4 md:py-2.5 md:pl-10 text-white text-xs md:text-sm outline-none transition-all placeholder-gray-400 shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
               />
               {isSearching && (
                 <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#1f80e0] border-t-transparent rounded-full animate-spin"></div>
               )}
            </div>
         </div>

         {/* Search Results Grid (If Searching) */}
         {searchQuery.length >= 2 ? (
            <div className="px-4 md:px-10 pb-20 pt-20 md:pt-24">
               <h2 className="text-xl font-bold text-white mb-6">Search Results</h2>
               {searchResults.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
                     {searchResults.map((item, i) => (
                        <div key={i} className="flex flex-col group cursor-pointer" onClick={() => handleSelectMovieOrSeries(item)}>
                           <div className="w-full aspect-[2/3] bg-[#192133] rounded-lg overflow-hidden relative shadow-lg group-hover:ring-2 group-hover:ring-[#1f80e0] transition-all group-hover:scale-105 duration-300">
                              {item.thumbnail ? (
                                <img src={item.thumbnail} className="w-full h-full object-cover" alt={item.title} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Image</div>
                              )}
                              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-wider bg-black/60 backdrop-blur-md">
                                 {item.type}
                              </div>
                           </div>
                           <p className="text-gray-300 text-xs font-bold mt-2 truncate group-hover:text-white transition-colors">{item.title}</p>
                        </div>
                     ))}
                  </div>
               ) : !isSearching ? (
                  <div className="text-gray-500 text-center mt-10">No results found for "{searchQuery}".</div>
               ) : null}
            </div>
         ) : (
            /* Home Screen (Netflix Style) */
            <div className="pb-20">
               {isLoadingHome ? (
                  <div className="flex justify-center items-center h-64">
                     <div className="w-10 h-10 border-4 border-[#1f80e0] border-t-transparent rounded-full animate-spin"></div>
                  </div>
               ) : (
                  <>
                     {/* Hero Section */}
                     {heroItem && (
                        <div className="relative w-full h-[50vh] md:h-[70vh] mb-10 group cursor-pointer" onClick={() => handleSelectMovieOrSeries(heroItem)}>
                           <div className="absolute inset-0 bg-[#192133]">
                              {heroItem.thumbnail && (
                                 <img src={heroItem.thumbnail} className="w-full h-full object-cover opacity-60 md:opacity-80" alt={heroItem.title} />
                              )}
                              {/* Netflix/Hotstar multi-stop gradients */}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0C111B] via-[#0C111B]/40 to-transparent"></div>
                              <div className="absolute inset-0 bg-gradient-to-r from-[#0C111B] via-[#0C111B]/60 to-transparent"></div>
                           </div>
                           <div className="absolute bottom-10 left-4 md:left-10 right-4 max-w-2xl">
                              <h1 className="text-4xl md:text-6xl font-black text-white mb-2 md:mb-4 drop-shadow-2xl">{heroItem.title}</h1>
                              <div className="flex items-center gap-3 text-xs md:text-sm text-gray-300 font-bold mb-4 drop-shadow-md">
                                 <span className="text-green-500">98% Match</span>
                                 <span>{heroItem.year}</span>
                                 <span className="border border-gray-500 px-1.5 rounded">{heroItem.type.toUpperCase()}</span>
                                 <span className="text-[#1f80e0]">★ {heroItem.rating}</span>
                              </div>
                              <p className="text-gray-300 text-sm md:text-base line-clamp-3 mb-6 max-w-xl drop-shadow-md">
                                 {heroItem.plot}
                              </p>
                              <div className="flex gap-3">
                                 <button className="bg-white text-black px-6 py-2.5 rounded-md font-bold text-sm md:text-base hover:bg-gray-200 transition-colors flex items-center gap-2">
                                    <span className="text-xl leading-none">▶</span> Play Now
                                 </button>
                                 <button className="bg-gray-500/40 text-white backdrop-blur-md border border-gray-500/50 px-6 py-2.5 rounded-md font-bold text-sm md:text-base hover:bg-gray-500/60 transition-colors">
                                    More Info
                                 </button>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Genre Carousels */}
                     <div className="flex flex-col gap-8 md:gap-10">
                        {carousels.map((cat, idx) => (
                           <div key={idx} className="flex flex-col px-4 md:px-10">
                              <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
                                 {cat.title}
                                 <span className="text-[#1f80e0] text-sm group-hover:translate-x-1 transition-transform cursor-pointer">❯</span>
                              </h3>
                              <div className="flex gap-3 md:gap-4 overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth snap-x">
                                 {cat.items.map((item: any, i: number) => (
                                    <div 
                                       key={i} 
                                       className="w-[120px] md:w-[160px] lg:w-[200px] shrink-0 snap-start flex flex-col group cursor-pointer"
                                       onClick={() => handleSelectMovieOrSeries(item)}
                                    >
                                       <div className="w-full aspect-[2/3] bg-[#192133] rounded-md overflow-hidden relative shadow-lg group-hover:ring-2 group-hover:ring-white transition-all group-hover:scale-105 duration-300">
                                          {item.thumbnail ? (
                                             <img src={item.thumbnail} className="w-full h-full object-cover" alt={item.title} />
                                          ) : (
                                             <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Image</div>
                                          )}
                                          <div className="absolute top-2 right-2 px-1 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-wider bg-black/60 backdrop-blur-md">
                                             {item.type}
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  </>
               )}
            </div>
         )}

         {/* Series Selection Overlay - Hotstar Style */}
         {selectedSeries && (
            <div className="absolute inset-0 z-50 flex flex-col bg-[#0C111B] animate-in slide-in-from-right-full duration-300">
               {/* Header / Backdrop */}
               <div className="relative h-48 md:h-64 shrink-0 bg-[#192133]">
                  {selectedSeries.thumbnail && (
                     <>
                        <img src={selectedSeries.thumbnail} className="w-full h-full object-cover opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0C111B] via-[#0C111B]/60 to-transparent"></div>
                     </>
                  )}
                  <button 
                     onClick={() => setSelectedSeries(null)} 
                     className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-colors z-10 backdrop-blur-md"
                  >
                     &#8592;
                  </button>
                  <div className="absolute bottom-4 left-4 md:left-6 right-4">
                     <h2 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-lg">{selectedSeries.title}</h2>
                     <p className="text-[#1f80e0] text-xs md:text-sm font-bold uppercase tracking-widest mt-1">TV Series • {selectedSeries.year || seriesDetails?.year || ''}</p>
                  </div>
               </div>

               {/* Season Selector */}
               <div className="px-4 md:px-6 py-4 shrink-0 border-b border-white/5">
                  <select 
                     disabled={isLoadingSeries || !seriesDetails}
                     className="bg-[#192133] text-white border border-gray-700 text-sm rounded-md focus:ring-[#1f80e0] focus:border-[#1f80e0] block w-full md:w-auto p-2.5 font-bold outline-none cursor-pointer disabled:opacity-50"
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

               {/* Episode List */}
               <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 pb-20">
                  {isLoadingSeries ? (
                     <div className="w-full h-full flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-[#1f80e0] border-t-transparent rounded-full animate-spin"></div>
                     </div>
                  ) : seriesDetails?.episodes?.length > 0 ? (
                     <div className="flex flex-col gap-2">
                        {seriesDetails.episodes.map((ep: any) => (
                           <div 
                              key={ep.episodeNumber}
                              onClick={() => handlePlay(selectedSeries, seriesDetails.currentSeason, ep.episodeNumber, ep.title)}
                              className="flex items-center gap-4 p-3 md:p-4 rounded-lg hover:bg-[#192133] cursor-pointer transition-colors group"
                           >
                              <div className="text-3xl font-black text-gray-700 group-hover:text-white transition-colors w-10 text-center">
                                 {ep.episodeNumber}
                              </div>
                              <div className="flex-1 flex flex-col justify-center min-w-0">
                                 <h4 className="text-sm md:text-base font-bold text-gray-200 group-hover:text-white truncate">
                                    {ep.title}
                                 </h4>
                                 <p className="text-xs text-gray-500 mt-1">
                                    {ep.released !== 'N/A' ? ep.released : 'Unknown Date'} {ep.imdbRating !== 'N/A' ? `• ⭐ ${ep.imdbRating}` : ''}
                                 </p>
                              </div>
                              <div className="w-8 h-8 rounded-full border-2 border-gray-600 group-hover:border-white flex items-center justify-center opacity-50 group-hover:opacity-100 transition-all shrink-0 bg-white/5">
                                 <div className="w-0 h-0 border-t-4 border-l-6 border-b-4 border-transparent border-l-white ml-1"></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="text-center text-gray-500 mt-10">No episodes found for this season.</div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};
