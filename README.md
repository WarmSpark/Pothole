# Togethr 🎬🎶

A private, invite-only couples app to watch movies, anime, and listen to music together in real-time, no matter the distance. 

## 🚀 Monorepo Architecture

- **Backend:** Go (Chi Router), PostgreSQL (Neon via pgx/sqlc), LiveKit Server SDK, Gorilla WebSockets.
- **Web App:** Next.js 14 (App Router), TailwindCSS, Zustand, LiveKit Components.
- **Mobile App:** Flutter, Riverpod, WebView (YouTube), LiveKit Client.

## 🛠 Setup & Run

### 1. Environment Variables
Create a `.env` file in the root and configure the following:
```env
DATABASE_URL=postgres://user:password@endpoint-pooler.neon.tech/neondb?sslmode=require
JWT_SECRET=super_secret_key
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
```

### 2. Run Locally using Docker
```bash
docker-compose up --build
```
This will start:
- **Go Backend** on `http://localhost:8080`
- **Next.js Web App** on `http://localhost:3000`

### 3. Run Mobile App (Flutter)
```bash
cd mobile
flutter run
```

---
*Built with ❤️ and glowing purple aesthetics.*
