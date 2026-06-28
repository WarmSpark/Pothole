package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/livekit/protocol/auth"
)

func (h *Handlers) GenerateLiveKitToken(w http.ResponseWriter, r *http.Request) {
	// Dummy token generation for scaffold
	// To fully implement: Parse room and user details, then use auth.AccessToken
	at := auth.NewAccessToken(h.Config.LivekitAPIKey, h.Config.LivekitAPISecret)
	grant := &auth.VideoGrant{
		RoomJoin: true,
		Room:     "dummy-room-id",
	}
	at.AddGrant(grant).
		SetIdentity("dummy-user-id").
		SetName("dummy-user-name").
		SetValidFor(time.Hour)

	token, _ := at.ToJWT()

	json.NewEncoder(w).Encode(map[string]string{
		"token": token,
		"url":   h.Config.LivekitURL,
	})
}
