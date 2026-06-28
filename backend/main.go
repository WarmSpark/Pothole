package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	
	"togethr-backend/config"
	"togethr-backend/db/generated"
	"togethr-backend/handlers"
	appMiddleware "togethr-backend/middleware"
	"togethr-backend/ws"
)

func main() {
	cfg := config.LoadConfig()

	// Connect to Database
	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	queries := db.New(pool)
	hubManager := ws.NewHubManager()

	// Initialize handlers
	h := handlers.NewHandlers(queries, hubManager, cfg)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// API Routes
	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/register", h.Register)
		r.Post("/auth/login", h.Login)
		
		r.Group(func(r chi.Router) {
			r.Use(appMiddleware.AuthMiddleware(cfg.JWTSecret))
			r.Get("/auth/me", h.GetMe)
			
			r.Post("/rooms", h.CreateRoom)
			r.Post("/rooms/join", h.JoinRoom)
			r.Get("/rooms/{roomId}", h.GetRoom)
			r.Patch("/rooms/{roomId}", h.UpdateRoom)
			
			r.Get("/rooms/{roomId}/queue", h.GetQueue)
			r.Post("/rooms/{roomId}/queue", h.AddQueueItem)
			r.Delete("/rooms/{roomId}/queue/{id}", h.RemoveQueueItem)
			r.Patch("/rooms/{roomId}/queue/reorder", h.ReorderQueue)
			
			r.Get("/rooms/{roomId}/history", h.GetHistory)
			r.Get("/rooms/{roomId}/messages", h.GetMessages)
			
			r.Get("/search/music", h.SearchMusic)
			r.Get("/search/movies", h.SearchMovies)
			r.Get("/search/anime", h.SearchAnime)
			
			r.Post("/livekit/token", h.GenerateLiveKitToken)
		})
	})

	// WebSocket Route
	r.Get("/ws/{roomId}", func(w http.ResponseWriter, r *http.Request) {
		roomId := chi.URLParam(r, "roomId")
		// Assume user authentication is passed via query param or header for WS
		userId := r.URL.Query().Get("userId")
		if userId == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		ws.ServeWs(hubManager, roomId, userId, w, r)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
