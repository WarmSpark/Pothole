package handlers

import (
	"encoding/json"
	"net/http"
)

func (h *Handlers) SearchMusic(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode([]interface{}{})
}

func (h *Handlers) SearchMovies(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode([]interface{}{})
}

func (h *Handlers) SearchAnime(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode([]interface{}{})
}
