// Pothole Streaming API Client for Django Backend
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';
  }
  return process.env.DJANGO_API_URL || 'http://localhost:8000/api';
};

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'viewer' | 'studio' | 'admin';
  subscription_tier?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ClaimedStatus {
  claimed: boolean;
  studio_id: string;
  studio_name: string;
  movie_id: string;
  title: string;
}

export interface StudioMovieItem {
  id: string;
  title: string;
  release_year: number;
  duration_minutes: number;
  imdb_id?: string;
  poster_url: string;
  stream_type: string;
  total_earnings?: number;
  total_seconds_watched?: number;
  total_hours_watched?: number;
  total_streams?: number;
}

export interface StudioAccounting {
  studio_id: string;
  total_earnings_usd: number;
  total_hours_streamed: number;
  total_heartbeats_logged: number;
  hosted_titles_count: number;
  movies: any[];
}

export const api = {
  // Authentication
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${getApiBase()}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid email or password');
    }
    return res.json();
  },

  register: async (email: string, password: string, fullName: string, role: string = 'viewer'): Promise<AuthResponse> => {
    const res = await fetch(`${getApiBase()}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  getMe: async (token: string): Promise<User> => {
    const res = await fetch(`${getApiBase()}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Session expired');
    const data = await res.json();
    return data.user;
  },

  // Studio Production Rights & Claiming
  claimMovie: async (movieData: any, token: string): Promise<any> => {
    const res = await fetch(`${getApiBase()}/movies/claim/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(movieData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to claim movie rights');
    }
    return data;
  },

  getStudioPortfolio: async (token: string): Promise<{ studio_id: string; total_portfolio_earnings_usd: number; titles_count: number; movies: StudioMovieItem[] }> => {
    const res = await fetch(`${getApiBase()}/movies/my-portfolio/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to load studio portfolio');
    }
    return res.json();
  },

  getClaimedStatusMap: async (): Promise<Record<string, ClaimedStatus>> => {
    try {
      const res = await fetch(`${getApiBase()}/movies/claimed-status/`);
      if (!res.ok) return {};
      return res.json();
    } catch {
      return {};
    }
  },

  searchOMDbWithClaimStatus: async (query: string): Promise<any[]> => {
    try {
      const res = await fetch(`${getApiBase()}/movies/search/omdb/?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    } catch {
      return [];
    }
  },

  // Telemetry Heartbeat (10-second micro-royalties)
  sendHeartbeat: async (movieId: string, seconds: number = 10, resolution: string = '1080p', country: string = 'IN', token?: string | null): Promise<any> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${getApiBase()}/royalties/heartbeat/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        movie_id: movieId,
        seconds_watched: seconds,
        playback_resolution: resolution,
        user_country: country,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  },

  getStudioAccounting: async (token: string): Promise<StudioAccounting> => {
    const res = await fetch(`${getApiBase()}/royalties/studio/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load studio accounting');
    return res.json();
  },
};
