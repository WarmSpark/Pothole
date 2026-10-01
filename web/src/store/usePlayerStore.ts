import { create } from 'zustand';

export interface QueueItem {
  id: string;
  type: 'movie' | 'series';
  title: string;
  thumbnailUrl: string;
  videoId?: string;
  season?: number;
  episode?: number;
}

interface PlayerState {
  queue: QueueItem[];
  isPlaying: boolean;
  
  setQueue: (queue: QueueItem[]) => void;
  addToQueue: (item: QueueItem) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  setPlaying: (playing: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  isPlaying: false,

  setQueue: (queue) => set({ queue }),
  addToQueue: (item) => {
    // Only allow 1 item in queue for this simplified web app
    set({ queue: [item] });
  },
  removeFromQueue: (id) => set((state) => ({ queue: state.queue.filter(q => q.id !== id) })),
  clearQueue: () => set({ queue: [], isPlaying: false }),
  setPlaying: (isPlaying) => set({ isPlaying }),
}));
