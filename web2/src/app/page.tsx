"use client";

import { usePlayerStore } from "../store/usePlayerStore";
import { Player } from "../components/Player";
import { MovieBrowser } from '../components/MovieBrowser';

export default function Home() {
  const queue = usePlayerStore(state => state.queue);
  const isPlaying = queue.length > 0;

  return (
    <main className="w-screen h-[100dvh] flex flex-col bg-[#0C111B] overflow-hidden font-sans text-gray-200">
      {/* Global Navigation - Hotstar/Netflix Hybrid */}
      <nav className="h-16 md:h-20 shrink-0 bg-gradient-to-b from-[#090b10] to-transparent flex items-center justify-between px-4 md:px-10 z-50 absolute top-0 w-full pointer-events-none">
        <div className={`font-black text-xl md:text-3xl tracking-tighter cursor-pointer pointer-events-auto flex items-center gap-1 transition-opacity ${isPlaying ? 'opacity-0 hidden md:flex md:opacity-0' : 'opacity-100'}`}>
          <span className="text-[#1f80e0]">Pothole</span><span className="text-[#E50914] hidden sm:inline">Streaming</span>
        </div>
        
        <div className="flex gap-4 pointer-events-auto ml-auto">
           {isPlaying && (
             <button 
               onClick={() => usePlayerStore.getState().clearQueue()}
               className="text-xs md:text-sm font-bold bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-4 py-2 rounded-md transition-all shadow-lg border border-white/5"
             >
               Exit Player
             </button>
           )}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Home Browser - Full width when not playing, completely hidden when playing */}
        {!isPlaying && (
          <div className="w-full h-full flex flex-col bg-[#0C111B] z-10 animate-in fade-in duration-500">
            <MovieBrowser />
          </div>
        )}

        {/* Player Section - Full width when playing */}
        {isPlaying && (
          <div className="w-full h-full flex flex-col bg-black relative z-20 animate-in slide-in-from-bottom-10 fade-in duration-500 shadow-2xl">
             <Player />
          </div>
        )}
      </div>
    </main>
  );
}
