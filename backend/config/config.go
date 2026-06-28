package config

import (
	"log"
	"os"
)

type Config struct {
	DatabaseURL        string
	JWTSecret          string
	LivekitAPIKey      string
	LivekitAPISecret   string
	LivekitURL         string
	YoutubeAPIKey      string
	TMDBAPIKey         string
}

func LoadConfig() Config {
	return Config{
		DatabaseURL:      getEnvOrFatal("DATABASE_URL"),
		JWTSecret:        getEnvOrFatal("JWT_SECRET"),
		LivekitAPIKey:    os.Getenv("LIVEKIT_API_KEY"),
		LivekitAPISecret: os.Getenv("LIVEKIT_API_SECRET"),
		LivekitURL:       os.Getenv("LIVEKIT_URL"),
		YoutubeAPIKey:    os.Getenv("YOUTUBE_API_KEY"),
		TMDBAPIKey:       os.Getenv("TMDB_API_KEY"),
	}
}

func getEnvOrFatal(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("Missing required environment variable: %s", key)
	}
	return val
}
