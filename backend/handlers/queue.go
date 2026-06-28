package handlers

import (
	"encoding/json"
	"net/http"
)

func (h *Handlers) GetQueue(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode([]interface{}{})
}

func (h *Handlers) AddQueueItem(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "added"})
}

func (h *Handlers) RemoveQueueItem(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "removed"})
}

func (h *Handlers) ReorderQueue(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "reordered"})
}
