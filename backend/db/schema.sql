-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms (one per couple)
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE NOT NULL,  -- 6-char alphanumeric
  created_by UUID REFERENCES users(id),
  partner_id UUID REFERENCES users(id),
  name TEXT DEFAULT 'Our Room',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room members (max 2)
CREATE TABLE room_members (
  room_id UUID REFERENCES rooms(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- Queue items (shared music + video queue)
CREATE TABLE queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  added_by UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('music', 'movie', 'anime', 'upload')),
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INT,
  source_url TEXT NOT NULL,     -- YouTube URL, vidsrc embed URL, R2 URL, etc.
  youtube_id TEXT,              -- if type = music
  tmdb_id TEXT,                 -- if type = movie/anime
  position INT NOT NULL,
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watch history
CREATE TABLE watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  queue_item_id UUID REFERENCES queue_items(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE
);

-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'reaction', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
