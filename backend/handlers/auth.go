package handlers

import (
	"encoding/json"
	"net/http"
)

func (h *Handlers) Register(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (h *Handlers) Login(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"token": "dummy-jwt-token"})
}

func (h *Handlers) GetMe(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"user": "me"})
}
