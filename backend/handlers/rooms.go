package handlers

import (
	"encoding/json"
	"net/http"
)

func (h *Handlers) CreateRoom(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"invite_code": "ABCDEF"})
}

func (h *Handlers) JoinRoom(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "joined"})
}

func (h *Handlers) GetRoom(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"id": "room123"})
}

func (h *Handlers) UpdateRoom(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

func (h *Handlers) GetHistory(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode([]interface{}{})
}

func (h *Handlers) GetMessages(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode([]interface{}{})
}
