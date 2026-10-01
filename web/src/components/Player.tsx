"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { TorrentPlayer } from './TorrentPlayer';
import { api } from '../api';
import { Lock, Activity } from 'lucide-react';

interface PlayerProps {
  isLoggedIn?: boolean;
  onRequireAuth?: () => void;
}

export const Player: React.FC<PlayerProps> = ({ isLoggedIn = true, onRequireAuth }) => {
  const queue = usePlayerStore(state => state.queue);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentItem = queue[0];
  const [magnetLink, setMagnetLink] = useState('');
  const [isTorrentLoading, setIsTorrentLoading] = useState(false);
  const [torrentStreams, setTorrentStreams] = useState<any[]>([]);
  const [isSwarmMenuOpen, setIsSwarmMenuOpen] = useState(false);
  const [fileIdx, setFileIdx] = useState<number | undefined>(undefined);

  // Studio Claim & Heartbeat Telemetry State
  const [claimedStudio, setClaimedStudio] = useState<string | null>(null);
  const [heartbeatCount, setHeartbeatCount] = useState(0);
  const [isHeartbeatPulsing, setIsHeartbeatPulsing] = useState(false);

  // Check studio claim status for current movie
  useEffect(() => {
    if (!currentItem?.videoId) return;
    api.getClaimedStatusMap().then(map => {
      if (map && currentItem.videoId && map[currentItem.videoId]?.claimed) {
        setClaimedStudio(map[currentItem.videoId].studio_name);
      } else {
        setClaimedStudio(null);
      }
    }).catch(() => setClaimedStudio(null));
  }, [currentItem]);

  const handleSelectStream = (stream: any) => {
    let targetMagnet = 'error';
    if (stream.infoHash) {
        const trackers = [
          'http://tracker.opentrackr.org:1337/announce',
          'udp://tracker.opentrackr.org:1337/announce',
          'http://tracker.openbittorrent.com:80/announce',
          'udp://tracker.openbittorrent.com:6969/announce',
          'udp://open.stealth.si:80/announce',
          'udp://tracker.torrent.eu.org:451/announce',
          'wss://tracker.openwebtorrent.com',
          'wss://tracker.webtorrent.dev'
        ];
        targetMagnet = `magnet:?xt=urn:btih:${stream.infoHash}&${trackers.map(t => 'tr=' + encodeURIComponent(t)).join('&')}`;
    } else if (stream.url && stream.url.startsWith('magnet:')) {
        targetMagnet = stream.url;
    }
    setMagnetLink(targetMagnet);
    setFileIdx(stream.fileIdx);
    setIsSwarmMenuOpen(false);
  };

  const loadTorrent = async (imdbId: string, season?: number, episode?: number) => {
    setIsTorrentLoading(true);
    setMagnetLink('');
    setTorrentStreams([]);

    // Bypass Torrentio if the user provided a raw magnet link directly
    if (imdbId.startsWith('magnet:?')) {
        setMagnetLink(imdbId);
        setIsTorrentLoading(false);
        setIsSwarmMenuOpen(false);
        return;
    }

    try {
      // 1. Fetch Verified Localhost Swarm option from the local streaming engine
      let localSwarmItem: any = null;
      try {
        const localRes = await fetch('/engine/local-swarm');
        if (localRes.ok) {
          const localData = await localRes.json();
          if (localData && localData.magnet) {
            localSwarmItem = {
              name: 'Pothole Verified P2P\n1080p Ultra',
              title: localData.title || '⚡ Localhost High-Speed Swarm\n👤 1 (Verified Local Peer) 💾 2.5 MB ⚙️ Direct 127.0.0.1',
              url: localData.magnet,
              isLocalhost: true
            };
          }
        }
      } catch (err) {
        // Engine initializing
      }

      // 2. Fetch external swarm streams from Torrentio
      const apiUrl = `/api/torrent?imdbId=${encodeURIComponent(imdbId)}${season && episode ? `&season=${season}&episode=${episode}` : ''}`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      
      let allStreams: any[] = [];
      if (data.streams && data.streams.length > 0) {
        const parseSeeders = (title: string): number => {
          if (!title) return 0;
          const match = title.match(/👤\s*(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };

        const parseSizeInGB = (title: string): number => {
          if (!title) return 999;
          const matchGB = title.match(/💾\s*([\d.]+)\s*GB/i);
          if (matchGB) return parseFloat(matchGB[1]);
          const matchMB = title.match(/💾\s*([\d.]+)\s*MB/i);
          if (matchMB) return parseFloat(matchMB[1]) / 1024;
          return 999;
        };

        // Score prioritizing compact size (0.5GB - 3GB) with healthy seeders
        const calculateScore = (stream: any): number => {
          const seeders = parseSeeders(stream.title);
          const sizeGB = parseSizeInGB(stream.title);
          if (seeders <= 0) return -100;
          
          const seederWeight = Math.min(seeders, 50);
          let sizePenalty = 1.0;
          if (sizeGB <= 2.5) sizePenalty = 0.5; // High bonus for web-optimized size
          else if (sizeGB <= 5.0) sizePenalty = 1.0;
          else if (sizeGB <= 15.0) sizePenalty = 3.0;
          else sizePenalty = 10.0; // Giant files (50-90GB)

          return (seederWeight * 10) / (sizeGB * sizePenalty + 0.1);
        };

        allStreams = data.streams.sort((a: any, b: any) => calculateScore(b) - calculateScore(a));
      }

      if (localSwarmItem) {
        allStreams.unshift(localSwarmItem);
      }

      if (allStreams.length > 0) {
        setTorrentStreams(allStreams);
      } else {
        setMagnetLink('error');
      }
    } catch (e) {
      console.error(e);
      setMagnetLink('error');
    }
    setIsTorrentLoading(false);
  };

  useEffect(() => {
    if (currentItem) {
      loadTorrent(currentItem.videoId || '', currentItem.season, currentItem.episode);
    }
  }, [currentItem]);

  // Fetch live stats for the bottom bar
  const [stats, setStats] = useState({ peers: 0, speed: 0 });
  
  useEffect(() => {
    if (!magnetLink || magnetLink === 'error') return;
    
    const getBaseUrl = () => {
       return '/engine';
    };

    const interval = setInterval(async () => {
        try {
            const res = await fetch(`${getBaseUrl()}/stats?magnet=${encodeURIComponent(magnetLink)}`);
            const data = await res.json();
            setStats({ peers: data.peers, speed: data.speed });
        } catch (e) {
            // ignore network errors
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [magnetLink]);

  // 10s Real-Time Royalty Telemetry Heartbeat to Django backend
  useEffect(() => {
    if (!magnetLink || magnetLink === 'error' || !currentItem?.videoId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('pothole_token') : null;

    const interval = setInterval(async () => {
      try {
        await api.sendHeartbeat(currentItem.videoId || '', 10, '1080p', 'IN', token);
      } catch (e) {
        // Silent background telemetry
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [magnetLink, currentItem]);

  if (!mounted) return null;

  if (!isLoggedIn) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0F0F0F] text-white p-6 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center mb-4 shadow-lg shadow-red-950/50">
          <Lock className="w-8 h-8 text-[#E50914]" />
        </div>
        <h2 className="text-2xl font-black mb-2 tracking-tight">Member Sign In Required</h2>
        <p className="text-gray-400 max-w-md mb-6 text-sm">
          You must be signed in with a Viewer or Studio account to stream movies and series on Pothole.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              usePlayerStore.getState().clearQueue();
              onRequireAuth?.();
            }}
            className="bg-[#E50914] hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-lg shadow-lg cursor-pointer transition-all"
          >
            Sign In to Watch
          </button>
          <button 
            onClick={() => usePlayerStore.getState().clearQueue()}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-all border border-white/10"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-black">
        <p>No media playing.</p>
        <p className="text-sm">Select a movie or series to start!</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-black">
      <div className="flex-grow relative overflow-hidden flex flex-col">
        {isTorrentLoading ? (
           <div className="w-full h-full flex flex-col items-center justify-center text-white">
             <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-[#E50914] font-bold">Scanning P2P Network...</p>
           </div>
        ) : magnetLink === 'error' ? (
           <div className="w-full h-full flex flex-col items-center justify-center text-red-500 gap-2">
             <span>No torrent seeds found for this title.</span>
             <span className="text-sm text-gray-500">Try another stream or title!</span>
           </div>
        ) : torrentStreams.length > 0 ? (
           <>
           <div className={`w-full h-full bg-[#141414] p-4 md:p-6 overflow-y-auto custom-scrollbar ${(!magnetLink || isSwarmMenuOpen) ? 'block' : 'hidden'}`}>
             <div className="sticky top-0 bg-[#141414] py-2 z-10 border-b border-gray-800 mb-4 flex justify-between items-center">
               <h3 className="text-[#E50914] text-lg md:text-xl font-bold flex items-center gap-2">
                  <span>Available P2P Swarms ({torrentStreams.length})</span>
               </h3>
               {magnetLink && (
                 <button 
                   onClick={() => setIsSwarmMenuOpen(false)}
                   className="bg-[#E50914] hover:bg-red-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded font-bold text-xs md:text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-red-900/40"
                 >
                   <span>&#9654;</span> Resume Stream
                 </button>
               )}
             </div>
             <div className="space-y-3">
               {torrentStreams.map((stream, idx) => {
                 const rawTitle = stream.title || stream.name || '';
                 const sizeMatch = rawTitle.match(/💾\s*([\d.]+\s*(?:GB|MB))/i);
                 const seederMatch = rawTitle.match(/👤\s*(\d+)/);
                 const cleanTitle = rawTitle.split('\n')[0];
                 const size = sizeMatch ? sizeMatch[1] : 'Unknown Size';
                 const seeders = seederMatch ? parseInt(seederMatch[1]) : 0;
                 const extMatch = cleanTitle.match(/\.(mkv|mp4|avi|webm)$/i);
                 const ext = extMatch ? extMatch[1].toUpperCase() : 'MKV';
                 
                 return (
                 <div 
                   key={idx}
                   onClick={() => handleSelectStream(stream)}
                   className="bg-[#1C1C1C] border border-gray-800 p-4 rounded-xl hover:border-[#E50914] cursor-pointer transition-all flex flex-col md:flex-row md:items-center gap-4 group"
                 >
                   <div className="flex-1 overflow-hidden">
                     <p className="text-gray-200 font-medium text-sm mb-3 truncate group-hover:text-white transition-colors">{cleanTitle}</p>
                     <div className="flex flex-wrap items-center gap-2 text-xs">
                        {stream.isLocalhost && (
                          <span className="bg-green-900/40 text-green-300 px-2 py-1 rounded font-bold border border-green-600/60 flex items-center gap-1">
                            🟢 LOCALHOST VERIFIED PEER (FASTEST)
                          </span>
                        )}
                        {!stream.isLocalhost && idx === (torrentStreams[0]?.isLocalhost ? 1 : 0) && (
                          <span className="bg-red-900/40 text-red-300 px-2 py-1 rounded font-bold border border-red-600/60 flex items-center gap-1">
                            ⚡ BEST COMPACT SIZE &amp; SEEDERS (RECOMMENDED)
                          </span>
                        )}
                        {stream.name && <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded font-bold border border-gray-700">{stream.name.replace('\n', ' ')}</span>}
                        <span className={`px-2 py-1 rounded font-bold border ${ext === 'MKV' ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                           🎬 {ext}
                        </span>
                        <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded font-mono border border-blue-900/50">💾 {size}</span>
                        <span className={`px-2 py-1 rounded font-bold border ${seeders > 50 ? 'bg-green-900/30 text-green-400 border-green-900/50' : seeders > 10 ? 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50' : 'bg-red-900/30 text-red-400 border-red-900/50'}`}>
                           👤 {seeders} Seeders
                        </span>
                     </div>
                   </div>
                 </div>
                 );
               })}
             </div>
           </div>
           
           <div className={`w-full h-full relative group bg-black ${(magnetLink && !isSwarmMenuOpen) ? 'block' : 'hidden'}`}>
             <button 
               onClick={() => setIsSwarmMenuOpen(true)} 
               className="absolute top-4 left-4 z-50 bg-black/70 hover:bg-[#E50914]/30 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-gray-600 hover:border-[#E50914] backdrop-blur-md transition-all flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 shadow-xl cursor-pointer"
             >
               <span className="text-xl leading-none">&larr;</span> <span className="font-medium text-xs md:text-sm">Change Stream</span>
             </button>
             {/* Studio Heartbeat Telemetry Overlay */}
             <div className="absolute top-4 right-4 z-50 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-xs shadow-2xl pointer-events-none">
               <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${claimedStudio ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
               <Activity className={`w-3.5 h-3.5 flex-shrink-0 ${claimedStudio ? 'text-emerald-400' : 'text-amber-400'}`} />
               <span className="font-bold text-gray-200 whitespace-nowrap">
                 {claimedStudio ? `sending 10s heartrate to ${claimedStudio}` : 'unclaimed'}
               </span>
               {claimedStudio && (
                 <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full">+$0.0004</span>
               )}
             </div>
             {magnetLink && (
               <TorrentPlayer 
                  magnetUri={magnetLink}
                  imdbId={currentItem?.videoId}
                  season={currentItem?.season}
                  episode={currentItem?.episode}
                  fileIdx={fileIdx}
               />
             )}
           </div>
           </>
        ) : null}
      </div>
      
      <div className="h-10 md:h-12 bg-[#141414] border-t border-white/5 flex items-center px-4 md:px-6 shrink-0 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <span className="text-[#E50914] text-[10px] md:text-xs font-black tracking-widest uppercase flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse"></div>
           Pothole P2P Engine Active
        </span>
        
        {magnetLink && magnetLink !== 'error' && (
          <div className="ml-auto flex items-center gap-4 md:gap-6 bg-black/60 px-3 md:px-4 py-1.5 rounded-full border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Peers</span>
              <span className="text-white text-xs md:text-sm font-mono font-bold">{stats.peers}</span>
            </div>
            <div className="w-px h-3 bg-white/10"></div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Speed</span>
              <span className="text-emerald-400 text-xs md:text-sm font-mono font-bold">{(stats.speed / 1024 / 1024).toFixed(1)} MB/s</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
