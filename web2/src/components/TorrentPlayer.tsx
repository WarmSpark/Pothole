"use client";

import React, { useEffect, useRef, useState } from "react";

interface TorrentPlayerProps {
  magnetUri: string;
  isPlaying?: boolean; // Kept for API compatibility, but mainly using native controls now
  imdbId?: string;
  season?: number;
  episode?: number;
  fileIdx?: number;
}

export const TorrentPlayer: React.FC<TorrentPlayerProps> = ({ 
  magnetUri, 
  imdbId,
  season,
  episode,
  fileIdx
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [status, setStatus] = useState<string>("Initializing stream...");
  const [isReady, setIsReady] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [subtitles, setSubtitles] = useState<{id: string, label: string, url: string}[]>([]);
  const [stats, setStats] = useState({ peers: 0, speed: 0 });

  const getBaseUrl = () => {
     return process.env.NEXT_PUBLIC_ENGINE_URL || "/engine";
  };

  useEffect(() => {
    if (!magnetUri) return;
    const interval = setInterval(async () => {
        try {
            const res = await fetch(`${getBaseUrl()}/stats?magnet=${encodeURIComponent(magnetUri)}`);
            const data = await res.json();
            setStats({ peers: data.peers, speed: data.speed });
        } catch (e) {
            // ignore network errors if torrent container is restarting
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [magnetUri]);

  useEffect(() => {
    if (!magnetUri) return;

    let isMounted = true;
    setIsReady(false);
    setStatus("Connecting to Swarm...");
    
    // Auto-discover English subtitles from OpenSubtitles via our helper API
    const loadSubtitles = async () => {
      try {
        if (!imdbId) return;
        const subRes = await fetch(`/api/subtitles?imdbId=${imdbId}${season ? `&season=${season}&episode=${episode}` : ''}`);
        const subData = await subRes.json();
        if (subData.subtitles && isMounted) {
           setSubtitles(subData.subtitles);
        }
      } catch (e) {
         console.error("Subtitle load failed", e);
      }
    };
    
    loadSubtitles();

    const endpoint = `${getBaseUrl()}/stream?magnet=${encodeURIComponent(magnetUri)}${fileIdx !== undefined ? `&fileIdx=${fileIdx}` : ''}`;
    
    // Test the stream endpoint repeatedly until the backend engine is ready
    const checkStream = async () => {
      try {
        setStatus("Negotiating P2P connections...");
        const res = await fetch(endpoint, { method: 'HEAD' });
        if (res.ok && isMounted) {
          setStreamUrl(endpoint);
          setIsReady(true);
          setStatus("");
        } else {
          if (isMounted) setTimeout(checkStream, 2000);
        }
      } catch (err) {
        if (isMounted) setTimeout(checkStream, 2000);
      }
    };

    checkStream();

    return () => {
      isMounted = false;
    };
  }, [magnetUri, imdbId, season, episode]);

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center">
      {!isReady ? (
        <div className="flex flex-col items-center justify-center text-white gap-4">
           <div className="w-12 h-12 border-4 border-[#00A8E1] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#00A8E1]"></div>
           <p className="font-mono text-sm tracking-widest text-[#00A8E1]">{status}</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef}
            src={streamUrl}
            className="w-full h-full"
            controls={true}
            autoPlay
          >
          {subtitles.map((sub, index) => (
            <track 
              key={sub.id} 
              kind="subtitles" 
              srcLang="en" 
              label={sub.label} 
              src={sub.url} 
              default={index === 0} 
            />
          ))}
        </video>
        </>
      )}
    </div>
  );
};
